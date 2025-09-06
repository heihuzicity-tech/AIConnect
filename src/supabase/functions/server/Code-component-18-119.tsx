// AI Chat Handler for different AI models
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

interface ChatRequest {
  model: string
  message: string
  feedItems?: any[]
  filters?: any
  settings?: {
    temperature: number
    maxTokens: number
    systemPrompt: string
    apiKeys: Record<string, string>
  }
}

interface ChatResponse {
  response: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// OpenAI API调用
async function callOpenAI(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = request.settings?.apiKeys[request.model] || Deno.env.get('OPENAI_API_KEY')
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const systemPrompt = request.settings?.systemPrompt || `你是一个专业的AI信息分析助手，专门帮助用户分析和理解AI行业动态。`
  
  // 构建上下文信息
  let contextInfo = ''
  if (request.feedItems && request.feedItems.length > 0) {
    contextInfo = `\n\n当前信息流数据摘要：\n${request.feedItems.slice(0, 5).map(item => 
      `• ${item.company}: ${item.title}`
    ).join('\n')}`
  }

  const messages = [
    {
      role: 'system',
      content: systemPrompt + contextInfo
    },
    {
      role: 'user',
      content: request.message
    }
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: request.model,
      messages,
      temperature: request.settings?.temperature || 0.7,
      max_tokens: request.settings?.maxTokens || 1000
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  return {
    response: data.choices[0]?.message?.content || '抱歉，我无法生成回复。',
    model: request.model,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    } : undefined
  }
}

// Anthropic Claude API调用
async function callClaude(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = request.settings?.apiKeys[request.model] || Deno.env.get('ANTHROPIC_API_KEY')
  
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const systemPrompt = request.settings?.systemPrompt || `你是一个专业的AI信息分析助手，专门帮助用户分析和理解AI行业动态。`
  
  // 构建上下文信息
  let contextInfo = ''
  if (request.feedItems && request.feedItems.length > 0) {
    contextInfo = `\n\n当前信息流数据摘要：\n${request.feedItems.slice(0, 5).map(item => 
      `• ${item.company}: ${item.title}`
    ).join('\n')}`
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: request.model,
      max_tokens: request.settings?.maxTokens || 1000,
      temperature: request.settings?.temperature || 0.7,
      system: systemPrompt + contextInfo,
      messages: [
        {
          role: 'user',
          content: request.message
        }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  return {
    response: data.content[0]?.text || '抱歉，我无法生成回复。',
    model: request.model,
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens
    } : undefined
  }
}

// xAI Grok API调用（假设的API端点，实际需要根据xAI文档调整）
async function callGrok(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = request.settings?.apiKeys[request.model] || Deno.env.get('XAI_API_KEY')
  
  if (!apiKey) {
    throw new Error('xAI API key not configured')
  }

  // 注意：这是假设的API端点，实际需要根据xAI的真实API文档调整
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: request.settings?.systemPrompt || '你是Grok，一个有趣且有用的AI助手。'
        },
        {
          role: 'user',
          content: request.message
        }
      ],
      temperature: request.settings?.temperature || 0.7,
      max_tokens: request.settings?.maxTokens || 1000
    })
  })

  if (!response.ok) {
    // 如果Grok API不可用，返回一个模拟响应
    return {
      response: `我是Grok！关于你的问题"${request.message}"，我觉得这是个很有趣的话题。不过目前我的API还在开发中，请稍后再试。🚀`,
      model: request.model
    }
  }

  const data = await response.json()
  
  return {
    response: data.choices[0]?.message?.content || '抱歉，Grok暂时无法回复。',
    model: request.model,
    usage: data.usage
  }
}

// 主要的聊天处理函数
export async function handleAIChat(request: Request): Promise<Response> {
  try {
    const body = await request.json() as ChatRequest
    
    if (!body.message || !body.model) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: message and model' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let result: ChatResponse

    // 根据模型类型调用相应的API
    if (body.model.includes('gpt')) {
      result = await callOpenAI(body)
    } else if (body.model.includes('claude')) {
      result = await callClaude(body)
    } else if (body.model.includes('grok')) {
      result = await callGrok(body)
    } else {
      throw new Error(`Unsupported model: ${body.model}`)
    }

    // 记录使用统计
    try {
      const today = new Date().toISOString().split('T')[0]
      const statsKey = `ai_usage_${today}`
      const currentStats = await kv.get(statsKey) || { totalCalls: 0, totalTokens: 0, models: {} }
      
      currentStats.totalCalls++
      if (result.usage) {
        currentStats.totalTokens += result.usage.totalTokens
      }
      
      if (!currentStats.models[body.model]) {
        currentStats.models[body.model] = { calls: 0, tokens: 0 }
      }
      currentStats.models[body.model].calls++
      if (result.usage) {
        currentStats.models[body.model].tokens += result.usage.totalTokens
      }
      
      await kv.set(statsKey, currentStats, { ttl: 86400 * 7 }) // 保存7天
    } catch (error) {
      console.error('Error saving AI usage stats:', error)
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('AI chat error:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      fallbackResponse: '抱歉，AI服务暂时不可用。请检查模型配置或稍后重试。'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// 获取AI使用统计
export async function getAIUsageStats(): Promise<Response> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const statsKey = `ai_usage_${today}`
    const stats = await kv.get(statsKey) || { totalCalls: 0, totalTokens: 0, models: {} }
    
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error getting AI usage stats:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}