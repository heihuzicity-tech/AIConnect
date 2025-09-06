import * as kv from '../kv_store.tsx'

interface TwitterUser {
  username: string
  company: string
}

interface Tweet {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics: {
    retweet_count: number
    like_count: number
    reply_count: number
    quote_count: number
  }
  context_annotations?: Array<{
    domain: { name: string }
    entity: { name: string }
  }>
  entities?: {
    hashtags?: Array<{ tag: string }>
    urls?: Array<{ expanded_url: string }>
  }
}

// AI公司和关键人物的Twitter账号
const AI_TWITTER_ACCOUNTS: TwitterUser[] = [
  { username: 'OpenAI', company: 'OpenAI' },
  { username: 'sama', company: 'OpenAI' }, // Sam Altman
  { username: 'AnthropicAI', company: 'Anthropic' },
  { username: 'darioamodei', company: 'Anthropic' }, // Dario Amodei
  { username: 'GoogleAI', company: 'Google AI' },
  { username: 'sundarpichai', company: 'Google AI' }, // Sundar Pichai
  { username: 'Microsoft', company: 'Microsoft AI' },
  { username: 'satyanadella', company: 'Microsoft AI' }, // Satya Nadella
  { username: 'MetaAI', company: 'Meta AI' },
  { username: 'zuck', company: 'Meta AI' }, // Mark Zuckerberg
  { username: 'elonmusk', company: 'xAI' }, // Elon Musk
  { username: 'huggingface', company: 'Hugging Face' },
  { username: 'DeepMind', company: 'DeepMind' }
]

export async function collectTwitterData() {
  const bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN')
  if (!bearerToken) {
    console.log('Twitter Bearer Token not configured')
    return { error: 'Twitter Bearer Token not configured' }
  }

  console.log('Starting Twitter data collection...')
  
  const headers = {
    'Authorization': `Bearer ${bearerToken}`,
    'Content-Type': 'application/json'
  }

  let totalCollected = 0
  const errors: string[] = []

  // First, get user IDs for usernames
  const userMap = await getUserIds(AI_TWITTER_ACCOUNTS.map(u => u.username), headers)

  for (const account of AI_TWITTER_ACCOUNTS) {
    try {
      const userId = userMap[account.username]
      if (!userId) {
        console.log(`User ID not found for ${account.username}`)
        continue
      }

      await collectUserTweets(userId, account.company, headers)
      totalCollected++
      
      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      const errorMsg = `Error collecting tweets for ${account.username}: ${error}`
      console.log(errorMsg)
      errors.push(errorMsg)
    }
  }

  const result = {
    collected: totalCollected,
    total: AI_TWITTER_ACCOUNTS.length,
    errors
  }

  console.log('Twitter data collection completed:', result)
  return result
}

async function getUserIds(usernames: string[], headers: Record<string, string>): Promise<Record<string, string>> {
  try {
    const usernamesParam = usernames.join(',')
    const response = await fetch(
      `https://api.twitter.com/2/users/by?usernames=${usernamesParam}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const userMap: Record<string, string> = {}
    
    if (data.data) {
      for (const user of data.data) {
        userMap[user.username] = user.id
      }
    }

    return userMap
  } catch (error) {
    console.log('Error fetching user IDs:', error)
    return {}
  }
}

async function collectUserTweets(userId: string, company: string, headers: Record<string, string>) {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?` +
      'tweet.fields=created_at,public_metrics,context_annotations,entities&' +
      'max_results=10&exclude=retweets,replies',
      { headers }
    )

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.data) {
      return
    }

    for (const tweet of data.data) {
      const eventId = `twitter:${tweet.id}`
      
      // Check if already exists
      const existing = await kv.get(`feed:${eventId}`)
      if (existing) continue
      
      // Only process recent tweets (within last 7 days)
      const tweetDate = new Date(tweet.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      if (tweetDate < sevenDaysAgo) continue
      
      // Filter for AI-related content
      if (!isAIRelated(tweet)) continue
      
      const feedItem = createTweetFeedItem(tweet, company)
      
      await kv.set(`feed:${eventId}`, JSON.stringify(feedItem))
      console.log(`Stored Twitter post: ${eventId}`)
    }
  } catch (error) {
    throw error
  }
}

function createTweetFeedItem(tweet: Tweet, company: string) {
  const tweetText = tweet.text
  const tweetUrl = `https://twitter.com/i/web/status/${tweet.id}`
  
  return {
    id: `twitter:${tweet.id}`,
    company,
    title: generateTweetTitle(tweetText, company),
    summary: tweetText.length > 200 ? tweetText.substring(0, 200) + '...' : tweetText,
    sourceType: 'twitter',
    sourceUrl: tweetUrl,
    publishedAt: tweet.created_at,
    priority: determineTweetPriority(tweet),
    tags: extractTweetTags(tweet),
    metrics: {
      retweets: tweet.public_metrics.retweet_count,
      views: tweet.public_metrics.like_count // Using likes as proxy for views
    }
  }
}

function generateTweetTitle(text: string, company: string): string {
  // Extract first sentence or first 100 characters
  let title = text.split('.')[0]
  if (title.length > 100) {
    title = text.substring(0, 100) + '...'
  }
  
  // Remove URLs and mentions
  title = title.replace(/https?:\/\/\S+/g, '')
  title = title.replace(/@\w+/g, '')
  title = title.trim()
  
  if (!title) {
    title = `${company} 发布新动态`
  }
  
  return title
}

function isAIRelated(tweet: Tweet): boolean {
  const text = tweet.text.toLowerCase()
  
  // AI-related keywords
  const aiKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'neural network', 'llm', 'large language model', 'gpt', 'claude', 'gemini',
    'chatbot', 'nlp', 'computer vision', 'transformer', 'model', 'training',
    'inference', 'fine-tuning', 'prompt', 'api', 'openai', 'anthropic',
    '人工智能', '机器学习', '深度学习', '神经网络', '大模型', '语言模型',
    '聊天机器人', '自然语言', '计算机视觉', '模型训练'
  ]
  
  // Check if tweet contains AI keywords
  const hasAIKeywords = aiKeywords.some(keyword => text.includes(keyword))
  
  // Check context annotations
  const hasAIContext = tweet.context_annotations?.some(annotation =>
    annotation.domain.name.toLowerCase().includes('technology') ||
    annotation.entity.name.toLowerCase().includes('artificial intelligence')
  ) || false
  
  // Check hashtags
  const hasAIHashtags = tweet.entities?.hashtags?.some(hashtag =>
    aiKeywords.some(keyword => hashtag.tag.toLowerCase().includes(keyword))
  ) || false
  
  return hasAIKeywords || hasAIContext || hasAIHashtags
}

function determineTweetPriority(tweet: Tweet): 'high' | 'medium' | 'low' {
  const text = tweet.text.toLowerCase()
  const metrics = tweet.public_metrics
  
  // High priority keywords
  const highPriorityKeywords = [
    'announcement', 'release', 'launching', 'available now', 'breaking',
    'major update', 'security', 'vulnerability', 'critical',
    '发布', '上线', '重大更新', '安全', '重要'
  ]
  
  // High engagement threshold
  const highEngagement = metrics.retweet_count > 100 || metrics.like_count > 500
  
  if (highPriorityKeywords.some(keyword => text.includes(keyword)) || highEngagement) {
    return 'high'
  }
  
  // Medium priority keywords
  const mediumPriorityKeywords = [
    'update', 'feature', 'improvement', 'new', 'beta', 'preview',
    '更新', '功能', '改进', '新增', '测试版', '预览'
  ]
  
  const mediumEngagement = metrics.retweet_count > 20 || metrics.like_count > 100
  
  if (mediumPriorityKeywords.some(keyword => text.includes(keyword)) || mediumEngagement) {
    return 'medium'
  }
  
  return 'low'
}

function extractTweetTags(tweet: Tweet): string[] {
  const tags = ['X推文']
  const text = tweet.text.toLowerCase()
  
  // Extract hashtags
  if (tweet.entities?.hashtags) {
    tweet.entities.hashtags.forEach(hashtag => {
      tags.push(`#${hashtag.tag}`)
    })
  }
  
  // Extract topic tags based on content
  const topicMap = {
    'gpt': 'GPT',
    'claude': 'Claude',
    'gemini': 'Gemini',
    'llama': 'LLaMA',
    'api': 'API',
    'model': '模型',
    'training': '训练',
    'fine-tuning': '微调',
    'release': '发布',
    'update': '更新',
    'beta': '测试版',
    'security': '安全',
    'research': '研究',
    'paper': '论文'
  }
  
  for (const [keyword, tag] of Object.entries(topicMap)) {
    if (text.includes(keyword)) {
      tags.push(tag)
    }
  }
  
  // Check context annotations for additional tags
  tweet.context_annotations?.forEach(annotation => {
    tags.push(annotation.entity.name)
  })
  
  return [...new Set(tags)].slice(0, 8) // Limit to 8 tags
}