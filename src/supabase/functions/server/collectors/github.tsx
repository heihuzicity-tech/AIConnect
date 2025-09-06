import * as kv from '../kv_store.tsx'

interface GitHubRepo {
  owner: string
  repo: string
  company: string
}

interface GitHubEvent {
  id: string
  type: string
  actor: { login: string }
  repo: { name: string }
  payload: any
  created_at: string
  public: boolean
}

interface GitHubRelease {
  id: number
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
}

// AI公司的主要GitHub仓库
const AI_REPOS: GitHubRepo[] = [
  { owner: 'openai', repo: 'openai-python', company: 'OpenAI' },
  { owner: 'openai', repo: 'whisper', company: 'OpenAI' },
  { owner: 'openai', repo: 'clip', company: 'OpenAI' },
  { owner: 'anthropics', repo: 'anthropic-sdk-python', company: 'Anthropic' },
  { owner: 'google-research', repo: 'google-research', company: 'Google AI' },
  { owner: 'google', repo: 'generative-ai', company: 'Google AI' },
  { owner: 'microsoft', repo: 'semantic-kernel', company: 'Microsoft AI' },
  { owner: 'microsoft', repo: 'autogen', company: 'Microsoft AI' },
  { owner: 'facebookresearch', repo: 'llama', company: 'Meta AI' },
  { owner: 'facebookresearch', repo: 'segment-anything', company: 'Meta AI' },
  { owner: 'huggingface', repo: 'transformers', company: 'Hugging Face' },
  { owner: 'huggingface', repo: 'diffusers', company: 'Hugging Face' },
  { owner: 'deepmind', repo: 'deepmind-research', company: 'DeepMind' }
]

export async function collectGitHubData() {
  // First try to get token from KV store (user configuration)
  let githubToken = await kv.get('config:github_token')
  
  // Fallback to environment variable
  if (!githubToken) {
    githubToken = Deno.env.get('GITHUB_TOKEN')
  }
  
  if (!githubToken) {
    console.log('GitHub token not configured')
    return { error: 'GitHub token not configured' }
  }

  console.log('Starting GitHub data collection...')
  
  const headers = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AI-Info-Aggregator'
  }

  let totalCollected = 0
  const errors: string[] = []

  for (const repoInfo of AI_REPOS) {
    try {
      // Collect repository events
      await collectRepoEvents(repoInfo, headers)
      
      // Collect releases
      await collectRepoReleases(repoInfo, headers)
      
      totalCollected++
      
      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      const errorMsg = `Error collecting data for ${repoInfo.owner}/${repoInfo.repo}: ${error}`
      console.log(errorMsg)
      errors.push(errorMsg)
    }
  }

  const result = {
    collected: totalCollected,
    total: AI_REPOS.length,
    errors
  }

  console.log('GitHub data collection completed:', result)
  return result
}

async function collectRepoEvents(repoInfo: GitHubRepo, headers: Record<string, string>) {
  const { owner, repo, company } = repoInfo
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/events?per_page=10`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const events: GitHubEvent[] = await response.json()
    
    for (const event of events) {
      const eventId = `github:${event.id}`
      
      // Check if already exists
      const existing = await kv.get(`feed:${eventId}`)
      if (existing) continue
      
      // Process different event types
      let feedItem: any = null
      
      switch (event.type) {
        case 'ReleaseEvent':
          feedItem = createReleaseEvent(event, company)
          break
        case 'PushEvent':
          if (event.payload.ref === 'refs/heads/main' || event.payload.ref === 'refs/heads/master') {
            feedItem = createPushEvent(event, company)
          }
          break
        case 'CreateEvent':
          if (event.payload.ref_type === 'tag') {
            feedItem = createTagEvent(event, company)
          }
          break
        case 'IssuesEvent':
          if (event.payload.action === 'opened' && isImportantIssue(event.payload.issue)) {
            feedItem = createIssueEvent(event, company)
          }
          break
      }
      
      if (feedItem) {
        await kv.set(`feed:${eventId}`, JSON.stringify(feedItem))
        console.log(`Stored GitHub event: ${eventId}`)
      }
    }
  } catch (error) {
    throw error
  }
}

async function collectRepoReleases(repoInfo: GitHubRepo, headers: Record<string, string>) {
  const { owner, repo, company } = repoInfo
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=5`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const releases: GitHubRelease[] = await response.json()
    
    for (const release of releases) {
      const eventId = `github:release:${release.id}`
      
      // Check if already exists
      const existing = await kv.get(`feed:${eventId}`)
      if (existing) continue
      
      // Only process recent releases (within last 30 days)
      const releaseDate = new Date(release.published_at)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      if (releaseDate < thirtyDaysAgo) continue
      
      const feedItem = {
        id: eventId,
        company,
        title: `${repo} 发布新版本 ${release.tag_name}`,
        summary: release.body 
          ? release.body.substring(0, 200) + '...'
          : `${company} 发布了 ${repo} 的新版本 ${release.tag_name}`,
        sourceType: 'github',
        sourceUrl: release.html_url,
        publishedAt: release.published_at,
        priority: determinePriority(release.tag_name, release.body || ''),
        tags: extractTags(release.tag_name, release.body || '', repo),
        metrics: {
          stars: await getRepoStars(owner, repo, headers)
        }
      }
      
      await kv.set(`feed:${eventId}`, JSON.stringify(feedItem))
      console.log(`Stored GitHub release: ${eventId}`)
    }
  } catch (error) {
    throw error
  }
}

function createReleaseEvent(event: GitHubEvent, company: string) {
  const release = event.payload.release
  return {
    id: `github:${event.id}`,
    company,
    title: `${event.repo.name.split('/')[1]} 发布新版本 ${release.tag_name}`,
    summary: release.body 
      ? release.body.substring(0, 200) + '...'
      : `${company} 发布了新版本`,
    sourceType: 'github',
    sourceUrl: release.html_url,
    publishedAt: event.created_at,
    priority: determinePriority(release.tag_name, release.body || ''),
    tags: extractTags(release.tag_name, release.body || '', event.repo.name)
  }
}

function createPushEvent(event: GitHubEvent, company: string) {
  const commits = event.payload.commits || []
  const commitCount = commits.length
  
  return {
    id: `github:${event.id}`,
    company,
    title: `${event.repo.name.split('/')[1]} 推送了 ${commitCount} 个提交`,
    summary: commits.length > 0 
      ? `最新提交: ${commits[0].message}`
      : `${company} 向主分支推送了更新`,
    sourceType: 'github',
    sourceUrl: `https://github.com/${event.repo.name}/commits`,
    publishedAt: event.created_at,
    priority: 'low',
    tags: ['代码更新', '提交'],
    metrics: {
      commits: commitCount
    }
  }
}

function createTagEvent(event: GitHubEvent, company: string) {
  return {
    id: `github:${event.id}`,
    company,
    title: `${event.repo.name.split('/')[1]} 创建新标签 ${event.payload.ref}`,
    summary: `${company} 为项目创建了新的版本标签`,
    sourceType: 'github',
    sourceUrl: `https://github.com/${event.repo.name}/tags`,
    publishedAt: event.created_at,
    priority: 'medium',
    tags: ['版本标签', '发布']
  }
}

function createIssueEvent(event: GitHubEvent, company: string) {
  const issue = event.payload.issue
  return {
    id: `github:${event.id}`,
    company,
    title: `${event.repo.name.split('/')[1]} 新增重要议题: ${issue.title}`,
    summary: issue.body ? issue.body.substring(0, 200) + '...' : issue.title,
    sourceType: 'github',
    sourceUrl: issue.html_url,
    publishedAt: event.created_at,
    priority: 'medium',
    tags: ['议题', '讨论']
  }
}

function isImportantIssue(issue: any): boolean {
  const title = issue.title.toLowerCase()
  const labels = issue.labels?.map((l: any) => l.name.toLowerCase()) || []
  
  // Important keywords
  const importantKeywords = [
    'security', 'vulnerability', 'critical', 'urgent', 'breaking',
    'announcement', 'release', 'roadmap', 'deprecation'
  ]
  
  return importantKeywords.some(keyword => 
    title.includes(keyword) || labels.some(label => label.includes(keyword))
  )
}

function determinePriority(tagName: string, body: string): 'high' | 'medium' | 'low' {
  const content = (tagName + ' ' + body).toLowerCase()
  
  if (content.includes('breaking') || content.includes('major') || 
      content.includes('security') || content.includes('critical')) {
    return 'high'
  }
  
  if (content.includes('feature') || content.includes('enhancement') ||
      content.includes('minor') || tagName.includes('beta')) {
    return 'medium'
  }
  
  return 'low'
}

function extractTags(tagName: string, body: string, repoName: string): string[] {
  const tags = [repoName.split('/')[1]]
  const content = (tagName + ' ' + body).toLowerCase()
  
  const tagMap = {
    'security': '安全',
    'feature': '新功能',
    'bugfix': '错误修复',
    'performance': '性能优化',
    'api': 'API',
    'breaking': '破坏性变更',
    'deprecated': '废弃',
    'experimental': '实验性',
    'stable': '稳定版',
    'beta': 'Beta版',
    'alpha': 'Alpha版'
  }
  
  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (content.includes(keyword)) {
      tags.push(tag)
    }
  }
  
  return [...new Set(tags)]
}

async function getRepoStars(owner: string, repo: string, headers: Record<string, string>): Promise<number> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    )
    
    if (response.ok) {
      const repoData = await response.json()
      return repoData.stargazers_count || 0
    }
  } catch (error) {
    console.log(`Error fetching stars for ${owner}/${repo}:`, error)
  }
  
  return 0
}