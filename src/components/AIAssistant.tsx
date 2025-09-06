import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AIModelSettings, type ModelSettings, DEFAULT_SETTINGS } from './AIModelSettings'
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Minimize2,
  Maximize2,
  RotateCcw,
  Settings,
  Zap,
  Brain,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  feedItems?: any[]
  currentFilters?: any
}

export function AIAssistant({ feedItems = [], currentFilters }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '你好！我是AI助手，可以帮你分析信息流内容、回答关于AI行业动态的问题，或者协助你更好地使用这个平台。有什么我可以帮助你的吗？',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [modelSettings, setModelSettings] = useState<ModelSettings>(DEFAULT_SETTINGS)
  const [currentModel, setCurrentModel] = useState('gpt-3.5-turbo')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-14895810`

  // 加载模型设置
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('ai-model-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setModelSettings({ ...DEFAULT_SETTINGS, ...parsed })
        setCurrentModel(parsed.selectedModel || DEFAULT_SETTINGS.selectedModel)
      }
    } catch (error) {
      console.error('Error loading AI model settings:', error)
    }
  }, [])



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // 检查是否有可用的API密钥
      const hasApiKey = modelSettings.apiKeys[currentModel]
      
      if (hasApiKey && modelSettings.enabledModels.includes(currentModel)) {
        // 调用真实AI模型
        const aiResponse = await callAIModel(userMessage.content, feedItems, currentFilters)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // 使用模拟响应
        const aiResponse = generateAIResponse(userMessage.content, feedItems, currentFilters)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse + '\n\n💡 *提示：配置AI模型API密钥后可获得更智能的回复*',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('AI response error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '抱歉，我遇到了一些技术问题。请稍后再试，或者检查AI模型配置。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('AI响应失败，请检查模型配置')
    } finally {
      setIsLoading(false)
    }
  }

  // 调用真实AI模型
  const callAIModel = async (userInput: string, feedItems: any[], filters: any): Promise<string> => {
    try {
      const response = await fetch(`${serverUrl}/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: currentModel,
          message: userInput,
          feedItems: feedItems.slice(0, 10), // 限制数据量
          filters,
          settings: modelSettings
        })
      })

      if (!response.ok) {
        throw new Error(`AI API call failed: ${response.status}`)
      }

      const data = await response.json()
      return data.response || '抱歉，我无法生成回复。'
    } catch (error) {
      console.error('AI model call error:', error)
      throw error
    }
  }

  const generateAIResponse = (userInput: string, feedItems: any[], filters: any): string => {
    const input = userInput.toLowerCase()
    
    // 分析用户输入，生成相应的响应
    if (input.includes('今天') || input.includes('最新')) {
      const todayItems = feedItems.filter(item => {
        if (!item.publishedAt) return false
        const today = new Date()
        const itemDate = new Date(item.publishedAt)
        return itemDate.toDateString() === today.toDateString()
      })
      
      if (todayItems.length > 0) {
        const companies = [...new Set(todayItems.map(item => item.company))].filter(Boolean)
        return `今天共有 ${todayItems.length} 条新消息，涉及 ${companies.join('、')} 等公司。主要关注点包括：\n\n${todayItems.slice(0, 3).map(item => `• ${item.title}`).join('\n')}\n\n有什么特定的公司或话题你想了解更多？`
      } else {
        return '今天还没有新的消息。你可以尝试手动触发数据收集，或者问我其他问题！'
      }
    }
    
    if (input.includes('openai') || input.includes('gpt')) {
      const openaiItems = feedItems.filter(item => 
        item.company?.toLowerCase().includes('openai') || 
        item.title?.toLowerCase().includes('gpt') ||
        (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes('gpt')))
      )
      
      if (openaiItems.length > 0) {
        return `我找到了 ${openaiItems.length} 条关于OpenAI/GPT的消息。最新的包括：\n\n${openaiItems.slice(0, 2).map(item => `• ${item.title}\n  发布时间：${item.publishedAt ? new Date(item.publishedAt).toLocaleString() : '未知'}`).join('\n\n')}\n\n需要我分析这些消息的具体内容吗？`
      }
    }
    
    if (input.includes('统计') || input.includes('数据') || input.includes('分析')) {
      const totalItems = feedItems.length
      const companies = [...new Set(feedItems.map(item => item.company))].filter(Boolean)
      const highPriorityItems = feedItems.filter(item => item.priority === 'high').length
      
      return `当前数据统计：\n\n📊 总信息量：${totalItems} 条\n🏢 涉及公司：${companies.length} 家（${companies.slice(0, 5).join('、')}等）\n⚡ 高优先级：${highPriorityItems} 条\n🔥 热门标签：${getTopTags(feedItems).join('、')}\n\n需要我深入分析某个特定指标吗？`
    }
    
    if (input.includes('帮助') || input.includes('功能') || input.includes('使用')) {
      return `我可以帮助你：\n\n🔍 **信息检索**：搜索特定公司、技术或话题的相关消息\n📈 **数据分析**：分析信息流趋势、公司活跃度等\n🎯 **智能筛选**：根据你的需求推荐相关内容\n💡 **行业洞察**：解读AI行业动态和技术发展\n⚙️ **平台指导**：协助使用平台各项功能\n\n你可以直接问我关于任何AI公司或技术的问题！`
    }
    
    // 默认响应
    const responses = [
      `很有趣的问题！基于当前的 ${feedItems.length} 条信息，我注意到最活跃的公司是 ${getTopCompanies(feedItems).join('、')}。你想了解哪家公司的具体动态？`,
      `让我帮你分析一下。从最近的信息来看，${getTopTags(feedItems).slice(0, 3).join('、')} 是比较热门的话题。需要我详细解读吗？`,
      `根据你的问题，我建议关注一下最近的高优先级消息。有什么特定的方面你想深入了解？`,
      `这是个很好的观察！结合当前的信息流数据，我可以为你提供更具体的分析。你希望从哪个角度来探讨？`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const getTopTags = (items: any[]): string[] => {
    if (!items.length) return []
    
    try {
      const tagFreq = items
        .filter(item => item.tags && Array.isArray(item.tags))
        .flatMap(item => item.tags)
        .reduce((acc, tag) => {
          if (tag && typeof tag === 'string') {
            acc[tag] = (acc[tag] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>)
      
      return Object.entries(tagFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag)
    } catch (error) {
      console.error('Error getting top tags:', error)
      return []
    }
  }

  const getTopCompanies = (items: any[]): string[] => {
    if (!items.length) return []
    
    try {
      const companyFreq = items
        .filter(item => item.company && typeof item.company === 'string')
        .reduce((acc, item) => {
          acc[item.company] = (acc[item.company] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      
      return Object.entries(companyFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([company]) => company)
    } catch (error) {
      console.error('Error getting top companies:', error)
      return []
    }
  }

  const getSuggestions = (items: any[], messageCount: number): string[] => {
    const allSuggestions = [
      '今天有什么新消息？',
      '分析数据统计',
      'OpenAI最新动态',
      '帮助我使用平台功能'
    ]
    
    return allSuggestions.slice(0, 3)
  }

  const handleModelSettingsChange = (newSettings: ModelSettings) => {
    setModelSettings(newSettings)
    setCurrentModel(newSettings.selectedModel)
  }

  const getModelDisplayName = (modelId: string) => {
    const modelNames: Record<string, string> = {
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'claude-3-sonnet': 'Claude 3 Sonnet',
      'claude-3-haiku': 'Claude 3 Haiku',
      'grok-beta': 'Grok Beta'
    }
    return modelNames[modelId] || modelId
  }

  const getModelIcon = (modelId: string) => {
    if (modelId.includes('gpt')) return <Brain className="h-3 w-3" />
    if (modelId.includes('claude')) return <Sparkles className="h-3 w-3" />
    if (modelId.includes('grok')) return <Zap className="h-3 w-3" />
    return <Bot className="h-3 w-3" />
  }

  const hasConfiguredModel = modelSettings.enabledModels.some(modelId => 
    modelSettings.apiKeys[modelId]
  )

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: '你好！我是AI助手，可以帮你分析信息流内容、回答关于AI行业动态的问题，或者协助你更好地使用这个平台。有什么我可以帮助你的吗？',
        timestamp: new Date()
      }
    ])
  }

  const handleButtonClick = () => {
    setIsOpen(true)
  }

  const handleCloseClick = () => {
    setIsOpen(false)
  }

  return (
    <div className="ai-assistant-container">
      {/* 悬浮按钮 */}
      {!isOpen && (
        <div 
          className="fixed bottom-6 right-6"
          style={{ zIndex: 9999 }}
        >
          <Button
            onClick={handleButtonClick}
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
            size="icon"
          >
            <Bot className="h-6 w-6 text-primary-foreground" />
          </Button>
          
          {/* 脉冲指示器 */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
            <Sparkles className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
          </div>
        </div>
      )}

      {/* AI对话窗口 */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6"
          style={{ zIndex: 9999 }}
        >
          <Card className={`bg-card border shadow-2xl transition-all duration-200 ${
            isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]'
          }`}>
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm">AI智能助手</h3>
                  {!isMinimized && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {getModelIcon(currentModel)}
                        <span className="text-xs text-muted-foreground">
                          {getModelDisplayName(currentModel)}
                        </span>
                      </div>
                      {!hasConfiguredModel && (
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {!isMinimized && (
                  <>
                    <Select
                      value={currentModel}
                      onValueChange={setCurrentModel}
                    >
                      <SelectTrigger className="w-auto h-8 text-xs border-0 bg-transparent hover:bg-accent/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelSettings.enabledModels.map(modelId => (
                          <SelectItem key={modelId} value={modelId}>
                            <div className="flex items-center gap-2">
                              {getModelIcon(modelId)}
                              <span>{getModelDisplayName(modelId)}</span>
                              {modelSettings.apiKeys[modelId] ? (
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                              ) : (
                                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={showSettings} onOpenChange={setShowSettings}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent/50"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>AI模型配置</DialogTitle>
                          <DialogDescription>
                            配置和管理AI模型，选择你喜欢的AI服务提供商并设置API密钥
                          </DialogDescription>
                        </DialogHeader>
                        <AIModelSettings onSettingsChange={handleModelSettingsChange} />
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearChat}
                      className="h-8 w-8 p-0 hover:bg-accent/50"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 p-0 hover:bg-accent/50"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseClick}
                  className="h-8 w-8 p-0 hover:bg-accent/50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* 对话内容 */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-4 h-96">
                  <div className="space-y-4">
                    {!hasConfiguredModel && messages.length === 1 && (
                      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          当前使用模拟响应。
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowSettings(true)}
                            className="h-auto p-0 ml-1 text-sm underline"
                          >
                            配置AI模型
                          </Button>
                          获得更智能的回复
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent text-accent-foreground'
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </div>
                          <div className={`mt-1 opacity-70 ${
                            message.type === 'user' ? 'text-right' : 'text-left'
                          }`}>
                            <span className="text-xs">
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-accent text-accent-foreground rounded-2xl px-3 py-2 max-w-[85%]">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* 输入区域 */}
                <div className="p-4 border-t bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="询问AI助手任何问题..."
                        className="pr-10 bg-background border-border/50 focus:border-primary/50 rounded-full"
                        disabled={isLoading}
                      />
                      {inputValue && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={isLoading || !inputValue.trim()}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* 快速操作标签 */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {getSuggestions(feedItems, messages.length).map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          setInputValue(suggestion)
                          setTimeout(() => handleSendMessage(), 100)
                        }}
                      >
                        <span className="text-xs">{suggestion}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}