import * as kv from '../kv_store.tsx'

interface RSSFeed {
  url: string
  company: string
  sourceType: 'blog' | 'announcement' | 'docs'
}

interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string
  guid?: string
  category?: string[]
}

// AI公司的RSS源
const RSS_FEEDS: RSSFeed[] = [
  // OpenAI
  { url: 'https://openai.com/blog/rss.xml', company: 'OpenAI', sourceType: 'blog' },
  
  // Google AI
  { url: 'https://ai.googleblog.com/feeds/posts/default', company: 'Google AI', sourceType: 'blog' },
  
  // Microsoft AI
  { url: 'https://blogs.microsoft.com/ai/feed/', company: 'Microsoft AI', sourceType: 'blog' },
  
  // Meta AI
  { url: 'https://ai.meta.com/blog/feed/', company: 'Meta AI', sourceType: 'blog' },
  
  // Hugging Face
  { url: 'https://huggingface.co/blog/feed.xml', company: 'Hugging Face', sourceType: 'blog' },
  
  // DeepMind
  { url: 'https://www.deepmind.com/blog/rss.xml', company: 'DeepMind', sourceType: 'blog' },
  
  // Anthropic (if they have RSS)
  // Note: Not all companies have public RSS feeds, some may need API integration
]

export async function collectRSSData() {
  console.log('Starting RSS data collection...')
  
  let totalCollected = 0
  const errors: string[] = []

  for (const feed of RSS_FEEDS) {
    try {
      await collectRSSFeed(feed)
      totalCollected++
      
      // Small delay between feeds
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      const errorMsg = `Error collecting RSS feed ${feed.url}: ${error}`
      console.log(errorMsg)
      errors.push(errorMsg)
    }
  }

  const result = {
    collected: totalCollected,
    total: RSS_FEEDS.length,
    errors
  }

  console.log('RSS data collection completed:', result)
  return result
}

async function collectRSSFeed(feed: RSSFeed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'AI-Info-Aggregator/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const xmlText = await response.text()
    const items = parseRSSXML(xmlText)
    
    for (const item of items) {
      const itemId = item.guid || generateItemId(item.link, item.title)
      const eventId = `rss:${btoa(itemId).replace(/[^a-zA-Z0-9]/g, '')}`
      
      // Check if already exists
      const existing = await kv.get(`feed:${eventId}`)
      if (existing) continue
      
      // Only process recent items (within last 30 days)
      const itemDate = new Date(item.pubDate)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      if (itemDate < thirtyDaysAgo) continue
      
      const feedItem = createRSSFeedItem(item, feed, eventId)
      
      await kv.set(`feed:${eventId}`, JSON.stringify(feedItem))
      console.log(`Stored RSS item: ${eventId}`)
    }
  } catch (error) {
    throw error
  }
}

function parseRSSXML(xmlText: string): RSSItem[] {
  // Simple XML parsing - in production, consider using a proper XML parser
  const items: RSSItem[] = []
  
  try {
    // Extract items using regex (simplified approach)
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []
    
    for (const itemXML of itemMatches) {
      const item: RSSItem = {
        title: extractXMLTag(itemXML, 'title') || '',
        link: extractXMLTag(itemXML, 'link') || '',
        description: extractXMLTag(itemXML, 'description') || '',
        pubDate: extractXMLTag(itemXML, 'pubDate') || new Date().toISOString(),
        guid: extractXMLTag(itemXML, 'guid'),
        category: extractXMLTags(itemXML, 'category')
      }
      
      if (item.title && item.link) {
        items.push(item)
      }
    }
  } catch (error) {
    console.log('Error parsing RSS XML:', error)
  }
  
  return items
}

function extractXMLTag(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i')
  const match = xml.match(regex)
  if (match && match[1]) {
    return cleanXMLContent(match[1])
  }
  return undefined
}

function extractXMLTags(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'gi')
  const matches = []
  let match
  
  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) {
      matches.push(cleanXMLContent(match[1]))
    }
  }
  
  return matches
}

function cleanXMLContent(content: string): string {
  return content
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function generateItemId(link: string, title: string): string {
  return `${link}:${title}`.substring(0, 100)
}

function createRSSFeedItem(item: RSSItem, feed: RSSFeed, eventId: string) {
  const summary = item.description
    ? (item.description.length > 300 ? item.description.substring(0, 300) + '...' : item.description)
    : `${feed.company} 发布了新的${feed.sourceType === 'blog' ? '博客文章' : '内容'}`
  
  return {
    id: eventId,
    company: feed.company,
    title: item.title,
    summary,
    sourceType: feed.sourceType,
    sourceUrl: item.link,
    publishedAt: item.pubDate,
    priority: determineRSSPriority(item),
    tags: extractRSSTags(item, feed)
  }
}

function determineRSSPriority(item: RSSItem): 'high' | 'medium' | 'low' {
  const title = item.title.toLowerCase()
  const description = (item.description || '').toLowerCase()
  const content = title + ' ' + description
  
  // High priority keywords
  const highPriorityKeywords = [
    'announcement', 'release', 'launching', 'available', 'breaking news',
    'major update', 'security', 'vulnerability', 'critical', 'important',
    '发布', '上线', '重大', '重要', '安全', '关键', '突破'
  ]
  
  if (highPriorityKeywords.some(keyword => content.includes(keyword))) {
    return 'high'
  }
  
  // Medium priority keywords
  const mediumPriorityKeywords = [
    'new', 'update', 'feature', 'improvement', 'enhancement', 'beta',
    'research', 'paper', 'study', 'analysis', 'tutorial', 'guide',
    '新', '更新', '功能', '改进', '研究', '论文', '分析', '教程'
  ]
  
  if (mediumPriorityKeywords.some(keyword => content.includes(keyword))) {
    return 'medium'
  }
  
  return 'low'
}

function extractRSSTags(item: RSSItem, feed: RSSFeed): string[] {
  const tags = [feed.sourceType === 'blog' ? '博客文章' : '官方内容']
  const content = (item.title + ' ' + (item.description || '')).toLowerCase()
  
  // Add category tags if available
  if (item.category) {
    item.category.forEach(cat => {
      if (cat.trim()) {
        tags.push(cat.trim())
      }
    })
  }
  
  // Extract topic tags based on content
  const topicMap = {
    'gpt': 'GPT',
    'claude': 'Claude',
    'gemini': 'Gemini',
    'llama': 'LLaMA',
    'transformer': 'Transformer',
    'neural network': '神经网络',
    'machine learning': '机器学习',
    'deep learning': '深度学习',
    'artificial intelligence': '人工智能',
    'natural language': '自然语言',
    'computer vision': '计算机视觉',
    'api': 'API',
    'model': '模型',
    'training': '训练',
    'fine-tuning': '微调',
    'dataset': '数据集',
    'benchmark': '基准测试',
    'research': '研究',
    'paper': '论文',
    'open source': '开源',
    'safety': '安全性',
    'ethics': '伦理',
    'alignment': '对齐',
    'multimodal': '多模态',
    'reasoning': '推理',
    'generation': '生成',
    'understanding': '理解'
  }
  
  for (const [keyword, tag] of Object.entries(topicMap)) {
    if (content.includes(keyword)) {
      tags.push(tag)
    }
  }
  
  // Extract additional technical terms
  const technicalTerms = [
    'llm', 'nlp', 'cv', 'rl', 'gan', 'vae', 'bert', 'roberta', 't5',
    'clip', 'dalle', 'stable diffusion', 'whisper', 'codex',
    'pytorch', 'tensorflow', 'huggingface', 'wandb', 'mlflow'
  ]
  
  technicalTerms.forEach(term => {
    if (content.includes(term)) {
      tags.push(term.toUpperCase())
    }
  })
  
  return [...new Set(tags)].slice(0, 10) // Limit to 10 tags
}