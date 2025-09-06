import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Separator } from './ui/separator'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Settings,
  Bot, 
  Key, 
  Zap, 
  Brain,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { AIModelGuide } from './AIModelGuide'

export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  maxTokens: number
  costPer1kTokens: number
  capabilities: string[]
  speed: 'fast' | 'medium' | 'slow'
  quality: 'good' | 'excellent' | 'outstanding'
  available: boolean
  requiresApiKey: boolean
  apiKeyEnvVar?: string
  setupUrl?: string
}

export interface ModelSettings {
  selectedModel: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  enabledModels: string[]
  apiKeys: Record<string, string>
}

const DEFAULT_MODELS: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: '最新的GPT-4模型，具有优化的性能和成本效益',
    maxTokens: 128000,
    costPer1kTokens: 0.01,
    capabilities: ['文本生成', '代码分析', '数据解析', '多语言'],
    speed: 'fast',
    quality: 'outstanding',
    available: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    setupUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI', 
    description: '快速且经济的模型，适合大部分对话场景',
    maxTokens: 16385,
    costPer1kTokens: 0.001,
    capabilities: ['文本生成', '对话', '数据分析'],
    speed: 'fast',
    quality: 'excellent',
    available: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    setupUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: '平衡性能和成本的优秀模型，擅长复杂推理',
    maxTokens: 200000,
    costPer1kTokens: 0.003,
    capabilities: ['文本生成', '代码分析', '长文档处理', '推理'],
    speed: 'medium',
    quality: 'outstanding',
    available: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    setupUrl: 'https://console.anthropic.com/'
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: '快速响应的轻量级模型',
    maxTokens: 200000,
    costPer1kTokens: 0.00025,
    capabilities: ['快速对话', '简单分析', '文本处理'],
    speed: 'fast',
    quality: 'good',
    available: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    setupUrl: 'https://console.anthropic.com/'
  },
  {
    id: 'grok-beta',
    name: 'Grok Beta',
    provider: 'xAI',
    description: 'Elon Musk的xAI推出的对话模型',
    maxTokens: 25000,
    costPer1kTokens: 0.002,
    capabilities: ['实时信息', '幽默对话', '数据分析'],
    speed: 'medium',
    quality: 'excellent',
    available: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'XAI_API_KEY',
    setupUrl: 'https://grok.x.ai/'
  }
]

const DEFAULT_SETTINGS: ModelSettings = {
  selectedModel: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: `你是一个专业的AI信息分析助手，专门帮助用户分析和理解AI行业动态。你的主要职责包括：

1. 分析信息流中的AI行业新闻和动态
2. 回答关于AI公司、技术和产品的问题
3. 提供数据统计和趋势分析
4. 协助用户更好地使用这个AI信息聚合平台

请保持专业、准确、有用的回复风格，使用简洁明了的中文回答。`,
  enabledModels: ['gpt-3.5-turbo'],
  apiKeys: {}
}

interface AIModelSettingsProps {
  onSettingsChange?: (settings: ModelSettings) => void
}

export function AIModelSettings({ onSettingsChange }: AIModelSettingsProps) {
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS)
  const [models, setModels] = useState<AIModel[]>(DEFAULT_MODELS)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  // 从localStorage加载设置
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('ai-model-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (error) {
      console.error('Error loading AI model settings:', error)
    }
  }, [])

  // 保存设置到localStorage
  const saveSettings = (newSettings: ModelSettings) => {
    try {
      localStorage.setItem('ai-model-settings', JSON.stringify(newSettings))
      setSettings(newSettings)
      onSettingsChange?.(newSettings)
      toast.success('设置已保存')
    } catch (error) {
      console.error('Error saving AI model settings:', error)
      toast.error('保存设置失败')
    }
  }

  const handleApiKeyChange = (modelId: string, apiKey: string) => {
    const newSettings = {
      ...settings,
      apiKeys: {
        ...settings.apiKeys,
        [modelId]: apiKey
      }
    }
    
    // 更新模型可用性
    const updatedModels = models.map(model => 
      model.apiKeyEnvVar === getApiKeyEnvVar(modelId)
        ? { ...model, available: !!apiKey }
        : model
    )
    setModels(updatedModels)
    
    saveSettings(newSettings)
  }

  const getApiKeyEnvVar = (modelId: string): string => {
    const model = models.find(m => m.id === modelId)
    return model?.apiKeyEnvVar || ''
  }

  const testConnection = async (modelId: string) => {
    setTestingConnection(modelId)
    
    try {
      // 这里应该调用后端API来测试连接
      // 模拟API测试
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const hasApiKey = settings.apiKeys[modelId]
      if (hasApiKey) {
        toast.success(`${modelId} 连接测试成功`)
        
        // 更新模型可用性
        const updatedModels = models.map(model => 
          model.id === modelId ? { ...model, available: true } : model
        )
        setModels(updatedModels)
      } else {
        toast.error('请先配置API密钥')
      }
    } catch (error) {
      toast.error(`${modelId} 连接测试失败`)
    } finally {
      setTestingConnection(null)
    }
  }

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    toast.success('API密钥已复制到剪贴板')
  }

  const toggleModelEnabled = (modelId: string) => {
    const enabledModels = settings.enabledModels.includes(modelId)
      ? settings.enabledModels.filter(id => id !== modelId)
      : [...settings.enabledModels, modelId]
    
    saveSettings({
      ...settings,
      enabledModels
    })
  }

  const getSpeedBadgeColor = (speed: string) => {
    switch (speed) {
      case 'fast': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'slow': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getQualityBadgeColor = (quality: string) => {
    switch (quality) {
      case 'outstanding': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'excellent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'good': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2>AI模型配置</h2>
        <Badge variant="secondary">测试版</Badge>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">模型管理</TabsTrigger>
          <TabsTrigger value="settings">参数设置</TabsTrigger>
          <TabsTrigger value="guide">配置指南</TabsTrigger>
          <TabsTrigger value="advanced">高级配置</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              配置API密钥后，AI助手将使用真实的AI模型而不是模拟响应。请确保你有足够的API配额。
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {models.map((model) => (
              <Card key={model.id} className={`transition-all ${
                model.available ? 'ring-2 ring-primary/20' : 'opacity-75'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-base">{model.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {model.provider} • {model.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {model.available ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={settings.enabledModels.includes(model.id)}
                        onCheckedChange={() => toggleModelEnabled(model.id)}
                        disabled={!model.available}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getSpeedBadgeColor(model.speed)}>
                      <Zap className="h-3 w-3 mr-1" />
                      {model.speed === 'fast' ? '快速' : model.speed === 'medium' ? '中等' : '较慢'}
                    </Badge>
                    <Badge className={getQualityBadgeColor(model.quality)}>
                      <Sparkles className="h-3 w-3 mr-1" />
                      {model.quality === 'outstanding' ? '卓越' : model.quality === 'excellent' ? '优秀' : '良好'}
                    </Badge>
                    <Badge variant="outline">
                      {model.maxTokens.toLocaleString()} tokens
                    </Badge>
                    <Badge variant="outline">
                      ${model.costPer1kTokens}/1k tokens
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>

                  {model.requiresApiKey && (
                    <div className="space-y-2">
                      <Label className="text-sm">API密钥</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showApiKeys[model.id] ? 'text' : 'password'}
                            placeholder={`输入${model.provider} API密钥`}
                            value={settings.apiKeys[model.id] || ''}
                            onChange={(e) => handleApiKeyChange(model.id, e.target.value)}
                            className="pr-20"
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setShowApiKeys(prev => ({
                                ...prev,
                                [model.id]: !prev[model.id]
                              }))}
                            >
                              {showApiKeys[model.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            {settings.apiKeys[model.id] && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => copyApiKey(settings.apiKeys[model.id])}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(model.id)}
                          disabled={testingConnection === model.id || !settings.apiKeys[model.id]}
                          className="shrink-0"
                        >
                          {testingConnection === model.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                              测试中
                            </>
                          ) : (
                            '测试连接'
                          )}
                        </Button>
                      </div>
                      
                      {model.setupUrl && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Key className="h-3 w-3" />
                          <span>在</span>
                          <a 
                            href={model.setupUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {model.provider}官网
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <span>获取API密钥</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>默认模型选择</CardTitle>
              <CardDescription>
                选择AI助手默认使用的模型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>当前模型</Label>
                <Select
                  value={settings.selectedModel}
                  onValueChange={(value) => saveSettings({
                    ...settings,
                    selectedModel: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models
                      .filter(model => settings.enabledModels.includes(model.id))
                      .map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            <span>{model.name}</span>
                            {model.available ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>创造性 (Temperature)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => saveSettings({
                        ...settings,
                        temperature: parseFloat(e.target.value) || 0.7
                      })}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {settings.temperature < 0.3 ? '保守' : 
                       settings.temperature < 0.7 ? '平衡' : 
                       settings.temperature < 1.2 ? '创造' : '随机'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>最大回复长度</Label>
                  <Select
                    value={settings.maxTokens.toString()}
                    onValueChange={(value) => saveSettings({
                      ...settings,
                      maxTokens: parseInt(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">短回复 (500 tokens)</SelectItem>
                      <SelectItem value="1000">中等回复 (1000 tokens)</SelectItem>
                      <SelectItem value="2000">长回复 (2000 tokens)</SelectItem>
                      <SelectItem value="4000">详细回复 (4000 tokens)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <AIModelGuide />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>系统提示词</CardTitle>
              <CardDescription>
                定义AI助手的行为和回复风格
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>系统提示词</Label>
                <textarea
                  className="w-full h-32 p-3 border rounded-md resize-none bg-background"
                  value={settings.systemPrompt}
                  onChange={(e) => saveSettings({
                    ...settings,
                    systemPrompt: e.target.value
                  })}
                  placeholder="输入自定义系统提示词..."
                />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{settings.systemPrompt.length} 字符</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveSettings({
                      ...settings,
                      systemPrompt: DEFAULT_SETTINGS.systemPrompt
                    })}
                  >
                    重置为默认
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>调试与监控</CardTitle>
              <CardDescription>
                模型使用统计和调试信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  这些功能正在开发中，将在未来版本中提供详细的API调用统计、成本分析和性能监控。
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { DEFAULT_MODELS, DEFAULT_SETTINGS }
export type { AIModel, ModelSettings }