import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'
import { collectAllData, updateSourceCounts } from './data-collector.tsx'
import { handleAIChat, getAIUsageStats } from './ai-chat.tsx'

const app = new Hono()

// Middleware
app.use('*', logger(console.log))
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// API Routes with prefix
const API_PREFIX = '/make-server-14895810'

// Health check
app.get(`${API_PREFIX}/health`, (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Get aggregated feed
app.get(`${API_PREFIX}/feed`, async (c) => {
  try {
    const { searchParams } = new URL(c.req.url)
    const company = searchParams.get('company')
    const sourceType = searchParams.get('sourceType')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let feedItems = await kv.getByPrefix('feed:')
    
    // Parse and filter items
    let items = feedItems.map(item => JSON.parse(item.value))
    
    if (company) {
      items = items.filter(item => item.company.toLowerCase() === company.toLowerCase())
    }
    
    if (sourceType) {
      items = items.filter(item => item.sourceType === sourceType)
    }
    
    // Sort by published date
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    
    // Pagination
    const paginatedItems = items.slice(offset, offset + limit)
    
    return c.json({
      items: paginatedItems,
      total: items.length,
      hasMore: offset + limit < items.length
    })
  } catch (error) {
    console.log('Error fetching feed:', error)
    return c.json({ error: 'Failed to fetch feed' }, 500)
  }
})

// Search feed items
app.get(`${API_PREFIX}/search`, async (c) => {
  try {
    const { searchParams } = new URL(c.req.url)
    const query = searchParams.get('q')?.toLowerCase()
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!query) {
      return c.json({ items: [], total: 0 })
    }
    
    const feedItems = await kv.getByPrefix('feed:')
    let items = feedItems.map(item => JSON.parse(item.value))
    
    // Search in title, summary, tags, company
    items = items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.company.toLowerCase().includes(query) ||
      item.tags.some((tag: string) => tag.toLowerCase().includes(query))
    )
    
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    items = items.slice(0, limit)
    
    return c.json({
      items,
      total: items.length,
      query
    })
  } catch (error) {
    console.log('Error searching feed:', error)
    return c.json({ error: 'Search failed' }, 500)
  }
})

// Get companies
app.get(`${API_PREFIX}/companies`, async (c) => {
  try {
    const companies = await kv.get('companies')
    return c.json(companies ? JSON.parse(companies) : [])
  } catch (error) {
    console.log('Error fetching companies:', error)
    return c.json({ error: 'Failed to fetch companies' }, 500)
  }
})

// Update company subscription
app.post(`${API_PREFIX}/companies/:id/subscribe`, async (c) => {
  try {
    const companyId = c.req.param('id')
    const { subscribed } = await c.req.json()
    
    const companies = await kv.get('companies')
    let companiesList = companies ? JSON.parse(companies) : []
    
    companiesList = companiesList.map((company: any) => 
      company.id === companyId 
        ? { ...company, subscribed }
        : company
    )
    
    await kv.set('companies', JSON.stringify(companiesList))
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error updating company subscription:', error)
    return c.json({ error: 'Failed to update subscription' }, 500)
  }
})

// Get source types
app.get(`${API_PREFIX}/source-types`, async (c) => {
  try {
    const sourceTypes = await kv.get('sourceTypes')
    return c.json(sourceTypes ? JSON.parse(sourceTypes) : [])
  } catch (error) {
    console.log('Error fetching source types:', error)
    return c.json({ error: 'Failed to fetch source types' }, 500)
  }
})

// Update source type
app.post(`${API_PREFIX}/source-types/:id/toggle`, async (c) => {
  try {
    const sourceTypeId = c.req.param('id')
    const { enabled } = await c.req.json()
    
    const sourceTypes = await kv.get('sourceTypes')
    let sourceTypesList = sourceTypes ? JSON.parse(sourceTypes) : []
    
    sourceTypesList = sourceTypesList.map((sourceType: any) => 
      sourceType.id === sourceTypeId 
        ? { ...sourceType, enabled }
        : sourceType
    )
    
    await kv.set('sourceTypes', JSON.stringify(sourceTypesList))
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error updating source type:', error)
    return c.json({ error: 'Failed to update source type' }, 500)
  }
})

// Manual data collection trigger  
app.post(`${API_PREFIX}/collect`, async (c) => {
  try {
    const { source } = await c.req.json()
    
    const result = await collectAllData()
    await updateSourceCounts()
    
    return c.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.log('Error in manual collection:', error)
    return c.json({ error: 'Collection failed' }, 500)
  }
})

// Save configuration
app.post(`${API_PREFIX}/save-config`, async (c) => {
  try {
    const { type, value } = await c.req.json()
    
    if (type === 'github_token') {
      // Save GitHub token to environment variable (simulated with KV store)
      await kv.set('config:github_token', value)
      console.log('GitHub token saved successfully')
    } else if (type === 'twitter_bearer_token') {
      // Save Twitter Bearer token to environment variable (simulated with KV store)
      await kv.set('config:twitter_bearer_token', value)
      console.log('Twitter Bearer token saved successfully')
    } else if (type === 'user_settings') {
      // Save general user settings
      await kv.set('config:user_settings', JSON.stringify(value))
      console.log('User settings saved successfully')
    } else {
      return c.json({ error: 'Invalid configuration type' }, 400)
    }
    
    return c.json({ success: true, message: 'Configuration saved successfully' })
  } catch (error) {
    console.log('Error saving configuration:', error)
    return c.json({ error: 'Failed to save configuration' }, 500)
  }
})

// Test GitHub token
app.post(`${API_PREFIX}/test-github-token`, async (c) => {
  try {
    const { token } = await c.req.json()
    
    if (!token) {
      return c.json({ error: 'Token is required' }, 400)
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Info-Aggregator'
    }
    
    // Test the token by making a simple API call
    const response = await fetch('https://api.github.com/rate_limit', { headers })
    
    if (!response.ok) {
      const errorData = await response.text()
      return c.json({ 
        valid: false, 
        error: `GitHub API error: ${response.status} ${response.statusText}`,
        details: errorData
      })
    }
    
    const rateLimitData = await response.json()
    
    return c.json({
      valid: true,
      rateLimit: {
        limit: rateLimitData.rate.limit,
        remaining: rateLimitData.rate.remaining,
        reset: new Date(rateLimitData.rate.reset * 1000).toISOString()
      },
      message: 'Token is valid and working'
    })
  } catch (error) {
    console.log('Error testing GitHub token:', error)
    return c.json({ 
      valid: false, 
      error: 'Failed to test token',
      details: error.message 
    }, 500)
  }
})

// Get GitHub status
app.get(`${API_PREFIX}/github-status`, async (c) => {
  try {
    // Check if token is configured
    let githubToken = await kv.get('config:github_token')
    if (!githubToken) {
      githubToken = Deno.env.get('GITHUB_TOKEN')
    }
    
    const tokenConfigured = !!githubToken
    let tokenValid = null
    let rateLimit = null
    let lastCollection = null
    
    if (tokenConfigured) {
      try {
        const headers = {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Info-Aggregator'
        }
        
        // Test the token
        const response = await fetch('https://api.github.com/rate_limit', { headers })
        
        if (response.ok) {
          const rateLimitData = await response.json()
          tokenValid = true
          rateLimit = {
            limit: rateLimitData.rate.limit,
            remaining: rateLimitData.rate.remaining,
            reset: new Date(rateLimitData.rate.reset * 1000).toISOString()
          }
        } else {
          tokenValid = false
        }
      } catch (error) {
        tokenValid = false
      }
    }
    
    // Get last collection time from feed items
    try {
      const feedItems = await kv.getByPrefix('feed:github:')
      if (feedItems.length > 0) {
        const latestItem = feedItems
          .map(item => JSON.parse(item.value))
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0]
        lastCollection = latestItem.publishedAt
      }
    } catch (error) {
      console.log('Error getting last collection time:', error)
    }
    
    return c.json({
      tokenConfigured,
      tokenValid,
      rateLimit,
      lastCollection
    })
  } catch (error) {
    console.log('Error getting GitHub status:', error)
    return c.json({ error: 'Failed to get GitHub status' }, 500)
  }
})

// GitHub repositories management
app.get(`${API_PREFIX}/github-repos`, async (c) => {
  try {
    const repos = await kv.get('github_repos')
    return c.json(repos ? JSON.parse(repos) : [])
  } catch (error) {
    console.log('Error fetching GitHub repos:', error)
    return c.json({ error: 'Failed to fetch GitHub repos' }, 500)
  }
})

app.post(`${API_PREFIX}/github-repos`, async (c) => {
  try {
    const repoData = await c.req.json()
    
    // Get existing repos
    let repos = await kv.get('github_repos')
    repos = repos ? JSON.parse(repos) : []
    
    // Add new repo
    repos.push(repoData)
    
    // Save back to KV store
    await kv.set('github_repos', JSON.stringify(repos))
    
    return c.json(repoData)
  } catch (error) {
    console.log('Error adding GitHub repo:', error)
    return c.json({ error: 'Failed to add GitHub repo' }, 500)
  }
})

app.delete(`${API_PREFIX}/github-repos/:id`, async (c) => {
  try {
    const repoId = c.req.param('id')
    
    // Get existing repos
    let repos = await kv.get('github_repos')
    repos = repos ? JSON.parse(repos) : []
    
    // Remove repo
    repos = repos.filter((repo: any) => repo.id !== repoId)
    
    // Save back to KV store
    await kv.set('github_repos', JSON.stringify(repos))
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error removing GitHub repo:', error)
    return c.json({ error: 'Failed to remove GitHub repo' }, 500)
  }
})

app.post(`${API_PREFIX}/github-repos/:id/toggle`, async (c) => {
  try {
    const repoId = c.req.param('id')
    const { enabled } = await c.req.json()
    
    // Get existing repos
    let repos = await kv.get('github_repos')
    repos = repos ? JSON.parse(repos) : []
    
    // Update repo enabled status
    repos = repos.map((repo: any) => 
      repo.id === repoId ? { ...repo, enabled } : repo
    )
    
    // Save back to KV store
    await kv.set('github_repos', JSON.stringify(repos))
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error toggling GitHub repo:', error)
    return c.json({ error: 'Failed to toggle GitHub repo' }, 500)
  }
})

app.post(`${API_PREFIX}/validate-github-repo`, async (c) => {
  try {
    const { owner, repo } = await c.req.json()
    
    let githubToken = await kv.get('config:github_token')
    if (!githubToken) {
      githubToken = Deno.env.get('GITHUB_TOKEN')
    }
    
    if (!githubToken) {
      return c.json({ valid: false, error: 'GitHub token not configured' })
    }
    
    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Info-Aggregator'
    }
    
    // Check if repository exists
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
    
    if (response.ok) {
      const repoData = await response.json()
      return c.json({
        valid: true,
        description: repoData.description,
        stars: repoData.stargazers_count
      })
    } else {
      return c.json({ valid: false, error: 'Repository not found or not accessible' })
    }
  } catch (error) {
    console.log('Error validating GitHub repo:', error)
    return c.json({ valid: false, error: 'Validation failed' }, 500)
  }
})

app.post(`${API_PREFIX}/refresh-github-repos`, async (c) => {
  try {
    let githubToken = await kv.get('config:github_token')
    if (!githubToken) {
      githubToken = Deno.env.get('GITHUB_TOKEN')
    }
    
    if (!githubToken) {
      return c.json({ error: 'GitHub token not configured' }, 400)
    }
    
    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Info-Aggregator'
    }
    
    // Get existing repos
    let repos = await kv.get('github_repos')
    repos = repos ? JSON.parse(repos) : []
    
    // Update repo info
    for (let i = 0; i < repos.length; i++) {
      try {
        const repo = repos[i]
        const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, { headers })
        
        if (response.ok) {
          const repoData = await response.json()
          repos[i] = {
            ...repo,
            description: repoData.description,
            stars: repoData.stargazers_count,
            lastCollected: new Date().toISOString()
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.log(`Error refreshing repo ${repos[i].id}:`, error)
      }
    }
    
    // Save updated repos
    await kv.set('github_repos', JSON.stringify(repos))
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error refreshing GitHub repos:', error)
    return c.json({ error: 'Failed to refresh GitHub repos' }, 500)
  }
})

// Company Profiles Management
app.get(`${API_PREFIX}/company-profiles`, async (c) => {
  try {
    const profiles = await kv.get('company_profiles')
    return c.json(profiles ? JSON.parse(profiles) : [])
  } catch (error) {
    console.log('Error fetching company profiles:', error)
    return c.json({ error: 'Failed to fetch company profiles' }, 500)
  }
})

app.post(`${API_PREFIX}/company-profiles`, async (c) => {
  try {
    const profileData = await c.req.json()
    
    // Get existing profiles
    let profiles = await kv.get('company_profiles')
    profiles = profiles ? JSON.parse(profiles) : []
    
    // Add timestamps
    profileData.lastUpdated = new Date().toISOString()
    profileData.dataSourceCount = (
      profileData.github.repositories.length +
      profileData.twitter.accounts.length +
      profileData.rss.feeds.length +
      Object.values(profileData.websites).filter(Boolean).length
    )
    
    // Add new profile
    profiles.push(profileData)
    
    // Save back to KV store
    await kv.set('company_profiles', JSON.stringify(profiles))
    
    return c.json(profileData)
  } catch (error) {
    console.log('Error adding company profile:', error)
    return c.json({ error: 'Failed to add company profile' }, 500)
  }
})

app.put(`${API_PREFIX}/company-profiles/:id`, async (c) => {
  try {
    const profileId = c.req.param('id')
    const profileData = await c.req.json()
    
    // Get existing profiles
    let profiles = await kv.get('company_profiles')
    profiles = profiles ? JSON.parse(profiles) : []
    
    // Update timestamps and counts
    profileData.lastUpdated = new Date().toISOString()
    profileData.dataSourceCount = (
      profileData.github.repositories.length +
      profileData.twitter.accounts.length +
      profileData.rss.feeds.length +
      Object.values(profileData.websites).filter(Boolean).length
    )
    
    // Update profile
    profiles = profiles.map((profile: any) => 
      profile.id === profileId ? profileData : profile
    )
    
    // Save back to KV store
    await kv.set('company_profiles', JSON.stringify(profiles))
    
    return c.json(profileData)
  } catch (error) {
    console.log('Error updating company profile:', error)
    return c.json({ error: 'Failed to update company profile' }, 500)
  }
})

app.delete(`${API_PREFIX}/company-profiles/:id`, async (c) => {
  try {
    const profileId = c.req.param('id')
    
    // Get existing profiles
    let profiles = await kv.get('company_profiles')
    profiles = profiles ? JSON.parse(profiles) : []
    
    // Remove profile
    profiles = profiles.filter((profile: any) => profile.id !== profileId)
    
    // Save back to KV store
    await kv.set('company_profiles', JSON.stringify(profiles))
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error removing company profile:', error)
    return c.json({ error: 'Failed to remove company profile' }, 500)
  }
})

// AI Company Discovery
app.post(`${API_PREFIX}/ai-discover-company`, async (c) => {
  try {
    const { companyName } = await c.req.json()
    
    if (!companyName) {
      return c.json({ error: 'Company name is required' }, 400)
    }
    
    console.log(`AI discovering company: ${companyName}`)
    
    // AI-powered company discovery logic
    const discoveredProfile = await discoverCompanyProfile(companyName)
    
    if (discoveredProfile) {
      return c.json(discoveredProfile)
    } else {
      return c.json({ error: 'No information found for this company' }, 404)
    }
  } catch (error) {
    console.log('Error in AI company discovery:', error)
    return c.json({ error: 'AI discovery failed' }, 500)
  }
})

// AI Company Discovery Helper Function
async function discoverCompanyProfile(companyName: string) {
  const company = companyName.toLowerCase()
  
  // AI-like knowledge base mapping
  const knownCompanies: Record<string, any> = {
    'openai': {
      id: 'openai',
      name: 'OpenAI',
      description: 'Leading artificial intelligence research company, creator of GPT models and ChatGPT.',
      website: 'https://openai.com',
      github: {
        repositories: [
          { owner: 'openai', repo: 'openai-python', enabled: true, description: 'Official Python library for OpenAI API' },
          { owner: 'openai', repo: 'openai-cookbook', enabled: true, description: 'Examples and guides for using the OpenAI API' },
          { owner: 'openai', repo: 'whisper', enabled: true, description: 'Robust Speech Recognition via Large-Scale Weak Supervision' }
        ]
      },
      twitter: {
        accounts: [
          { username: 'OpenAI', enabled: true, displayName: 'OpenAI' },
          { username: 'sama', enabled: true, displayName: 'Sam Altman' }
        ]
      },
      rss: {
        feeds: [
          { url: 'https://openai.com/blog/rss.xml', title: 'OpenAI Blog', enabled: true }
        ]
      },
      websites: {
        blog: 'https://openai.com/blog',
        docs: 'https://platform.openai.com/docs',
        status: 'https://status.openai.com'
      }
    },
    'anthropic': {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'AI safety company focused on developing safe, beneficial AI systems like Claude.',
      website: 'https://anthropic.com',
      github: {
        repositories: [
          { owner: 'anthropics', repo: 'anthropic-sdk-python', enabled: true, description: 'Python SDK for Anthropic API' },
          { owner: 'anthropics', repo: 'anthropic-sdk-typescript', enabled: true, description: 'TypeScript SDK for Anthropic API' }
        ]
      },
      twitter: {
        accounts: [
          { username: 'AnthropicAI', enabled: true, displayName: 'Anthropic' }
        ]
      },
      rss: {
        feeds: [
          { url: 'https://anthropic.com/news/rss.xml', title: 'Anthropic News', enabled: true }
        ]
      },
      websites: {
        blog: 'https://anthropic.com/news',
        docs: 'https://docs.anthropic.com'
      }
    },
    'google': {
      id: 'google-ai',
      name: 'Google AI',
      description: 'Google\'s artificial intelligence research division, creator of Gemini, Bard, and other AI technologies.',
      website: 'https://ai.google',
      github: {
        repositories: [
          { owner: 'google-research', repo: 'google-research', enabled: true, description: 'Google Research repositories' },
          { owner: 'google', repo: 'generative-ai-python', enabled: true, description: 'Google AI Python SDK' },
          { owner: 'googlegemini', repo: 'gemini-api', enabled: true, description: 'Gemini API examples' }
        ]
      },
      twitter: {
        accounts: [
          { username: 'GoogleAI', enabled: true, displayName: 'Google AI' },
          { username: 'GoogleDeepMind', enabled: true, displayName: 'Google DeepMind' }
        ]
      },
      rss: {
        feeds: [
          { url: 'https://ai.googleblog.com/feeds/posts/default', title: 'Google AI Blog', enabled: true }
        ]
      },
      websites: {
        blog: 'https://ai.googleblog.com',
        docs: 'https://ai.google.dev/docs'
      }
    },
    'meta': {
      id: 'meta',
      name: 'Meta AI',
      description: 'Meta\'s artificial intelligence research division, creator of LLaMA models and various AI tools.',
      website: 'https://ai.meta.com',
      github: {
        repositories: [
          { owner: 'facebookresearch', repo: 'llama', enabled: true, description: 'Inference code for LLaMA models' },
          { owner: 'meta-llama', repo: 'llama-recipes', enabled: true, description: 'Examples and recipes for Llama model' },
          { owner: 'facebookresearch', repo: 'segment-anything', enabled: true, description: 'Segment Anything Model (SAM)' }
        ]
      },
      twitter: {
        accounts: [
          { username: 'MetaAI', enabled: true, displayName: 'Meta AI' }
        ]
      },
      rss: {
        feeds: [
          { url: 'https://ai.meta.com/blog/rss/', title: 'Meta AI Blog', enabled: true }
        ]
      },
      websites: {
        blog: 'https://ai.meta.com/blog',
        docs: 'https://ai.meta.com/resources'
      }
    },
    'microsoft': {
      id: 'microsoft',
      name: 'Microsoft AI',
      description: 'Microsoft\'s artificial intelligence initiatives, including Azure OpenAI Service and Copilot.',
      website: 'https://microsoft.com/ai',
      github: {
        repositories: [
          { owner: 'microsoft', repo: 'semantic-kernel', enabled: true, description: 'Integrate LLMs with conventional programming languages' },
          { owner: 'microsoft', repo: 'autogen', enabled: true, description: 'Enable Next-Gen Large Language Model Applications' },
          { owner: 'Azure', repo: 'azure-openai-samples', enabled: true, description: 'Azure OpenAI Service samples' }
        ]
      },
      twitter: {
        accounts: [
          { username: 'MSFTResearch', enabled: true, displayName: 'Microsoft Research' },
          { username: 'Azure', enabled: true, displayName: 'Microsoft Azure' }
        ]
      },
      rss: {
        feeds: [
          { url: 'https://blogs.microsoft.com/ai/feed/', title: 'Microsoft AI Blog', enabled: true }
        ]
      },
      websites: {
        blog: 'https://blogs.microsoft.com/ai',
        docs: 'https://docs.microsoft.com/azure/cognitive-services'
      }
    },
    'huggingface': {
      id: 'huggingface',
      name: 'Hugging Face',
      description: 'The platform where the machine learning community collaborates on models, datasets, and applications.',
      website: 'https://huggingface.co',
      github: {
        repositories: [
          { owner: 'huggingface', repo: 'transformers', enabled: true, description: '🤗 Transformers: State-of-the-art Machine Learning' },
          { owner: 'huggingface', repo: 'datasets', enabled: true, description: '🤗 The largest hub of ready-to-use datasets' },
          { owner: 'huggingface', repo: 'diffusers', enabled: true, description: '🤗 Diffusers: State-of-the-art diffusion models' }
        ]
      },
      twitter: {
        accounts: [
          { username: 'huggingface', enabled: true, displayName: 'Hugging Face' }
        ]
      },
      rss: {
        feeds: [
          { url: 'https://huggingface.co/blog/feed.xml', title: 'Hugging Face Blog', enabled: true }
        ]
      },
      websites: {
        blog: 'https://huggingface.co/blog',
        docs: 'https://huggingface.co/docs'
      }
    }
  }
  
  // Try exact match first
  if (knownCompanies[company]) {
    console.log(`Found exact match for ${companyName}`)
    return {
      ...knownCompanies[company],
      enabled: true
    }
  }
  
  // Try partial matches
  for (const [key, profile] of Object.entries(knownCompanies)) {
    if (key.includes(company) || company.includes(key) || 
        profile.name.toLowerCase().includes(company) || 
        company.includes(profile.name.toLowerCase())) {
      console.log(`Found partial match for ${companyName}: ${profile.name}`)
      return {
        ...profile,
        enabled: true
      }
    }
  }
  
  console.log(`No match found for ${companyName}`)
  return null
}

// Get collection stats
app.get(`${API_PREFIX}/stats`, async (c) => {
  try {
    const feedItems = await kv.getByPrefix('feed:')
    const items = feedItems.map(item => JSON.parse(item.value))
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayItems = items.filter(item => 
      new Date(item.publishedAt) >= today
    )
    
    const stats = {
      totalItems: items.length,
      todayItems: todayItems.length,
      companies: [...new Set(items.map(item => item.company))].length,
      sourceTypes: {
        announcement: items.filter(item => item.sourceType === 'announcement').length,
        twitter: items.filter(item => item.sourceType === 'twitter').length,
        blog: items.filter(item => item.sourceType === 'blog').length,
        github: items.filter(item => item.sourceType === 'github').length,
        docs: items.filter(item => item.sourceType === 'docs').length
      }
    }
    
    return c.json(stats)
  } catch (error) {
    console.log('Error fetching stats:', error)
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})

// Initialize data
async function initializeData() {
  try {
    // Initialize companies if not exists
    const existingCompanies = await kv.get('companies')
    if (!existingCompanies) {
      const defaultCompanies = [
        { id: 'openai', name: 'OpenAI', subscribed: true, unreadCount: 0 },
        { id: 'anthropic', name: 'Anthropic', subscribed: true, unreadCount: 0 },
        { id: 'google-ai', name: 'Google AI', subscribed: true, unreadCount: 0 },
        { id: 'microsoft', name: 'Microsoft AI', subscribed: true, unreadCount: 0 },
        { id: 'meta', name: 'Meta AI', subscribed: true, unreadCount: 0 },
        { id: 'xai', name: 'xAI', subscribed: false, unreadCount: 0 },
        { id: 'deepmind', name: 'DeepMind', subscribed: true, unreadCount: 0 },
        { id: 'huggingface', name: 'Hugging Face', subscribed: true, unreadCount: 0 }
      ]
      await kv.set('companies', JSON.stringify(defaultCompanies))
    }
    
    // Initialize source types if not exists
    const existingSourceTypes = await kv.get('sourceTypes')
    if (!existingSourceTypes) {
      const defaultSourceTypes = [
        { id: 'announcement', name: '官方公告', enabled: true, count: 0 },
        { id: 'twitter', name: 'X推文', enabled: true, count: 0 },
        { id: 'blog', name: '博客文章', enabled: true, count: 0 },
        { id: 'github', name: 'GitHub动态', enabled: true, count: 0 },
        { id: 'docs', name: '开发文档', enabled: false, count: 0 }
      ]
      await kv.set('sourceTypes', JSON.stringify(defaultSourceTypes))
    }
    
    // Initialize company profiles if not exists
    const existingCompanyProfiles = await kv.get('company_profiles')
    if (!existingCompanyProfiles) {
      const defaultCompanyProfiles = [
        {
          id: 'openai',
          name: 'OpenAI',
          description: 'Leading artificial intelligence research company, creator of GPT models and ChatGPT.',
          website: 'https://openai.com',
          enabled: true,
          github: {
            repositories: [
              { owner: 'openai', repo: 'openai-python', enabled: true, description: 'Official Python library for OpenAI API' },
              { owner: 'openai', repo: 'whisper', enabled: true, description: 'Robust Speech Recognition' }
            ]
          },
          twitter: {
            accounts: [
              { username: 'OpenAI', enabled: true, displayName: 'OpenAI' }
            ]
          },
          rss: {
            feeds: [
              { url: 'https://openai.com/blog/rss.xml', title: 'OpenAI Blog', enabled: true }
            ]
          },
          websites: {
            blog: 'https://openai.com/blog',
            docs: 'https://platform.openai.com/docs'
          },
          lastUpdated: new Date().toISOString(),
          dataSourceCount: 4
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          description: 'AI safety company focused on developing safe, beneficial AI systems like Claude.',
          website: 'https://anthropic.com',
          enabled: true,
          github: {
            repositories: [
              { owner: 'anthropics', repo: 'anthropic-sdk-python', enabled: true, description: 'Python SDK for Anthropic API' }
            ]
          },
          twitter: {
            accounts: [
              { username: 'AnthropicAI', enabled: true, displayName: 'Anthropic' }
            ]
          },
          rss: {
            feeds: [
              { url: 'https://anthropic.com/news/rss.xml', title: 'Anthropic News', enabled: true }
            ]
          },
          websites: {
            blog: 'https://anthropic.com/news',
            docs: 'https://docs.anthropic.com'
          },
          lastUpdated: new Date().toISOString(),
          dataSourceCount: 4
        },
        {
          id: 'google-ai',
          name: 'Google AI',
          description: 'Google\'s artificial intelligence research division, creator of Gemini and other AI technologies.',
          website: 'https://ai.google',
          enabled: true,
          github: {
            repositories: [
              { owner: 'google-research', repo: 'google-research', enabled: true, description: 'Google Research repositories' }
            ]
          },
          twitter: {
            accounts: [
              { username: 'GoogleAI', enabled: true, displayName: 'Google AI' }
            ]
          },
          rss: {
            feeds: [
              { url: 'https://ai.googleblog.com/feeds/posts/default', title: 'Google AI Blog', enabled: true }
            ]
          },
          websites: {
            blog: 'https://ai.googleblog.com',
            docs: 'https://ai.google.dev/docs'
          },
          lastUpdated: new Date().toISOString(),
          dataSourceCount: 4
        }
      ]
      await kv.set('company_profiles', JSON.stringify(defaultCompanyProfiles))
    }
    
    // Keep GitHub repos for backward compatibility but mark as deprecated
    const existingGitHubRepos = await kv.get('github_repos')
    if (!existingGitHubRepos) {
      // Create empty array - repos are now managed through company profiles
      await kv.set('github_repos', JSON.stringify([]))
    }
    
    console.log('Data initialization completed')
  } catch (error) {
    console.log('Error initializing data:', error)
  }
}

// Start initialization
initializeData().then(async () => {
  // Load initial data if no feed items exist
  const existingItems = await kv.getByPrefix('feed:')
  if (existingItems.length === 0) {
    console.log('Loading initial data...')
    await collectAllData()
    await updateSourceCounts()
  }
})

// Schedule automatic data collection (every 15 minutes)
setInterval(async () => {
  try {
    console.log('Starting scheduled data collection...')
    await collectAllData()
    await updateSourceCounts()
    console.log('Scheduled data collection completed')
  } catch (error) {
    console.log('Error in scheduled collection:', error)
  }
}, 15 * 60 * 1000) // 15 minutes

// AI Chat routes
app.post(`${API_PREFIX}/ai-chat`, async (c) => {
  return handleAIChat(c.req)
})

app.get(`${API_PREFIX}/ai-usage-stats`, async (c) => {
  return getAIUsageStats()
})

Deno.serve(app.fetch)