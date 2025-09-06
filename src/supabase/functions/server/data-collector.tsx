import * as kv from './kv_store.tsx'

// Enhanced data collection with real APIs
export async function collectAllData() {
  console.log('Starting enhanced data collection...')
  
  const mockData = [
    {
      id: 'github:openai:release:1',
      company: 'OpenAI',
      title: 'OpenAI Python SDK v1.52.0 发布',
      summary: 'OpenAI Python SDK 发布新版本，增加了对最新 GPT-4 Turbo 模型的支持，修复了多个已知问题并优化了性能。',
      sourceType: 'github',
      sourceUrl: 'https://github.com/openai/openai-python/releases/tag/v1.52.0',
      publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      tags: ['OpenAI', 'Python SDK', '版本发布', 'GPT-4'],
      metrics: { stars: 18500, views: 2340 }
    },
    {
      id: 'twitter:anthropic:1',
      company: 'Anthropic', 
      title: 'Claude 3 模型安全性再次升级',
      summary: 'Anthropic 团队分享了 Claude 3 在安全性方面的最新改进，包括更强的有害内容检测和拒绝能力。',
      sourceType: 'twitter',
      sourceUrl: 'https://twitter.com/AnthropicAI/status/example',
      publishedAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      tags: ['Claude', '安全性', 'AI安全', '内容过滤'],
      metrics: { retweets: 890, views: 15600 }
    },
    {
      id: 'blog:google:1',
      company: 'Google AI',
      title: 'Gemini 1.5 Pro 支持200万 token 上下文长度',
      summary: 'Google AI 博客发布文章详细介绍了 Gemini 1.5 Pro 如何实现超长上下文处理，以及在实际应用中的优势。',
      sourceType: 'blog', 
      sourceUrl: 'https://ai.googleblog.com/gemini-1-5-pro-context',
      publishedAt: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      tags: ['Gemini', '上下文长度', 'Google AI', '技术突破'],
      metrics: { views: 32100 }
    },
    {
      id: 'announcement:microsoft:1',
      company: 'Microsoft AI',
      title: 'Azure OpenAI 服务新增 GPT-4 Turbo with Vision',
      summary: 'Microsoft Azure 宣布在 OpenAI 服务中新增 GPT-4 Turbo with Vision 功能，企业客户现可通过 API 使用多模态AI能力。',
      sourceType: 'announcement',
      sourceUrl: 'https://azure.microsoft.com/updates/gpt-4-turbo-vision',
      publishedAt: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000).toISOString(), 
      priority: 'medium',
      tags: ['Azure', 'GPT-4 Turbo', '企业服务', '多模态AI'],
      metrics: { views: 18900 }
    },
    {
      id: 'github:meta:1', 
      company: 'Meta AI',
      title: 'Llama 3.2 模型权重开源发布',
      summary: 'Meta 在 GitHub 上发布了 Llama 3.2 系列模型的完整权重文件，包括多个参数规模的版本供研究使用。',
      sourceType: 'github',
      sourceUrl: 'https://github.com/meta-llama/llama3.2',
      publishedAt: new Date(Date.now() - Math.random() * 18 * 60 * 60 * 1000).toISOString(),
      priority: 'high', 
      tags: ['Llama', '开源模型', 'Meta AI', '模型权重'],
      metrics: { stars: 85600, views: 12400 }
    },
    {
      id: 'twitter:huggingface:1',
      company: 'Hugging Face',
      title: 'Transformers 库突破1亿次下载里程碑',
      summary: 'Hugging Face 庆祝 Transformers 库达到1亿次下载的重要里程碑，感谢全球开发者社区的支持。',
      sourceType: 'twitter',
      sourceUrl: 'https://twitter.com/huggingface/status/example',
      publishedAt: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      tags: ['Hugging Face', 'Transformers', '里程碑', '开源社区'],
      metrics: { retweets: 2340, views: 28900 }
    }
  ]

  let stored = 0
  for (const item of mockData) {
    // Check if item already exists
    const existing = await kv.get(`feed:${item.id}`)
    if (!existing) {
      await kv.set(`feed:${item.id}`, JSON.stringify(item))
      stored++
      console.log(`Stored new item: ${item.id}`)
    }
  }

  // Try to collect GitHub data if API token is available
  let githubResult = { collected: 0, total: 0, errors: [] }
  try {
    githubResult = await collectGitHubData()
    console.log('GitHub collection result:', githubResult)
  } catch (error) {
    console.log('GitHub collection failed:', error)
    githubResult.errors = [String(error)]
  }

  console.log(`Data collection completed. Mock stored: ${stored}, GitHub collected: ${githubResult.collected}`)
  return {
    total: mockData.length + githubResult.total,
    stored: stored + githubResult.collected,
    github: githubResult,
    message: 'Data collection completed successfully'
  }
}

export async function updateSourceCounts() {
  try {
    // Get all feed items to count by source type
    const feedItems = await kv.getByPrefix('feed:')
    const items = feedItems.map(item => JSON.parse(item.value))
    
    const counts = {
      announcement: items.filter(item => item.sourceType === 'announcement').length,
      twitter: items.filter(item => item.sourceType === 'twitter').length,
      blog: items.filter(item => item.sourceType === 'blog').length,
      github: items.filter(item => item.sourceType === 'github').length,
      docs: items.filter(item => item.sourceType === 'docs').length
    }

    // Update source types with current counts
    const sourceTypes = await kv.get('sourceTypes')
    if (sourceTypes) {
      let sourceTypesList = JSON.parse(sourceTypes)
      sourceTypesList = sourceTypesList.map((sourceType: any) => ({
        ...sourceType,
        count: counts[sourceType.id as keyof typeof counts] || 0
      }))
      await kv.set('sourceTypes', JSON.stringify(sourceTypesList))
    }

    return counts
  } catch (error) {
    console.log('Error updating source counts:', error)
    return {}
  }
}

// Inline GitHub data collection to avoid deployment issues
async function collectGitHubData() {
  // First try to get token from KV store (user configuration)
  let githubToken = await kv.get('config:github_token')
  
  // Fallback to environment variable
  if (!githubToken) {
    githubToken = Deno.env.get('GITHUB_TOKEN')
  }
  
  if (!githubToken) {
    console.log('GitHub token not configured')
    return { collected: 0, total: 0, errors: ['GitHub token not configured'] }
  }

  console.log('Starting GitHub data collection...')
  
  const headers = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AI-Info-Aggregator'
  }

  // Get company profiles from KV store
  let companyProfiles = await kv.get('company_profiles')
  companyProfiles = companyProfiles ? JSON.parse(companyProfiles) : []
  
  // Extract GitHub repositories from enabled companies
  let repos: any[] = []
  companyProfiles
    .filter((company: any) => company.enabled)
    .forEach((company: any) => {
      company.github.repositories
        .filter((repo: any) => repo.enabled)
        .forEach((repo: any) => {
          repos.push({
            owner: repo.owner,
            repo: repo.repo,
            company: company.name
          })
        })
    })
  
  // If no repos configured from company profiles, use default set
  if (repos.length === 0) {
    repos = [
      { owner: 'openai', repo: 'openai-python', company: 'OpenAI' },
      { owner: 'anthropics', repo: 'anthropic-sdk-python', company: 'Anthropic' },
      { owner: 'google-research', repo: 'google-research', company: 'Google AI' },
      { owner: 'microsoft', repo: 'semantic-kernel', company: 'Microsoft AI' },
      { owner: 'facebookresearch', repo: 'llama', company: 'Meta AI' },
      { owner: 'huggingface', repo: 'transformers', company: 'Hugging Face' }
    ]
    
    console.log('No company profiles configured, using default GitHub repos')
  }

  let totalCollected = 0
  const errors: string[] = []

  for (const repoInfo of repos) {
    try {
      // Collect recent releases
      const releasesResponse = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/releases?per_page=3`,
        { headers }
      )

      if (releasesResponse.ok) {
        const releases = await releasesResponse.json()
        
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
            company: repoInfo.company,
            title: `${repoInfo.repo} 发布新版本 ${release.tag_name}`,
            summary: release.body 
              ? release.body.substring(0, 200) + '...'
              : `${repoInfo.company} 发布了 ${repoInfo.repo} 的新版本 ${release.tag_name}`,
            sourceType: 'github',
            sourceUrl: release.html_url,
            publishedAt: release.published_at,
            priority: release.tag_name.includes('major') ? 'high' : 'medium',
            tags: [repoInfo.repo, '版本发布', 'GitHub'],
            metrics: {
              stars: 0 // We'll skip fetching stars to avoid rate limits
            }
          }
          
          await kv.set(`feed:${eventId}`, JSON.stringify(feedItem))
          totalCollected++
          console.log(`Stored GitHub release: ${eventId}`)
        }
      }
      
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
    total: repos.length,
    errors
  }

  console.log('GitHub data collection completed:', result)
  return result
}