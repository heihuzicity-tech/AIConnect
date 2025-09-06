import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  ExternalLink, 
  Key, 
  Sparkles, 
  Brain, 
  Zap,
  AlertCircle,
  CheckCircle,
  Copy,
  DollarSign
} from 'lucide-react'
import { Button } from './ui/button'

export function AIModelGuide() {
  const models = [
    {
      id: 'openai',
      name: 'OpenAI GPT',
      models: ['GPT-4 Turbo', 'GPT-3.5 Turbo'],
      icon: <Brain className="h-5 w-5" />,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      description: '最流行的AI模型，适合各种对话和分析任务',
      apiUrl: 'https://platform.openai.com/api-keys',
      envVar: 'OPENAI_API_KEY',
      pricing: [
        { model: 'GPT-4 Turbo', input: '$0.01/1K tokens', output: '$0.03/1K tokens' },
        { model: 'GPT-3.5 Turbo', input: '$0.0005/1K tokens', output: '$0.0015/1K tokens' }
      ],
      features: [
        '快速响应',
        '优秀的中文理解', 
        '代码生成',
        '数据分析'
      ],
      setupSteps: [
        '访问 OpenAI Platform',
        '注册并验证账户',
        '创建 API Key',
        '在模型配置中输入密钥'
      ]
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      models: ['Claude 3 Sonnet', 'Claude 3 Haiku'],
      icon: <Sparkles className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      description: '擅长复杂推理和长文档处理的优秀模型',
      apiUrl: 'https://console.anthropic.com/',
      envVar: 'ANTHROPIC_API_KEY',
      pricing: [
        { model: 'Claude 3 Sonnet', input: '$0.003/1K tokens', output: '$0.015/1K tokens' },
        { model: 'Claude 3 Haiku', input: '$0.00025/1K tokens', output: '$0.00125/1K tokens' }
      ],
      features: [
        '长文档处理',
        '复杂推理',
        '安全可靠',
        '创意写作'
      ],
      setupSteps: [
        '访问 Anthropic Console',
        '申请 API 访问权限',
        '生成 API Key',
        '在模型配置中输入密钥'
      ]
    },
    {
      id: 'xai',
      name: 'xAI Grok',
      models: ['Grok Beta'],
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      description: 'Elon Musk的xAI推出的对话模型，具有独特的幽默风格',
      apiUrl: 'https://grok.x.ai/',
      envVar: 'XAI_API_KEY',
      pricing: [
        { model: 'Grok Beta', input: '$0.002/1K tokens', output: '$0.008/1K tokens' }
      ],
      features: [
        '实时信息',
        '幽默对话',
        '创新思维',
        'X平台集成'
      ],
      setupSteps: [
        '访问 Grok 官网',
        '申请 Beta 访问',
        '获取 API Key',
        '在模型配置中输入密钥'
      ],
      beta: true
    }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg">AI模型配置指南</h2>
        <p className="text-sm text-muted-foreground">
          选择并配置你喜欢的AI模型，开始智能对话体验
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          配置API密钥后，AI助手将调用真实的AI模型。请注意API使用费用。所有密钥都安全存储在你的浏览器本地。
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {models.map((provider) => (
          <Card key={provider.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${provider.color}`}>
                    {provider.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {provider.name}
                      {provider.beta && (
                        <Badge variant="secondary" className="text-xs">Beta</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {provider.description}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(provider.apiUrl, '_blank')}
                  className="shrink-0"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  获取密钥
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 模型列表 */}
              <div>
                <h4 className="text-sm font-medium mb-2">可用模型</h4>
                <div className="flex flex-wrap gap-2">
                  {provider.models.map((model) => (
                    <Badge key={model} variant="outline" className="text-xs">
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 功能特性 */}
              <div>
                <h4 className="text-sm font-medium mb-2">主要特性</h4>
                <div className="flex flex-wrap gap-2">
                  {provider.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 价格信息 */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  定价信息
                </h4>
                <div className="space-y-1">
                  {provider.pricing.map((price, index) => (
                    <div key={index} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{price.model}</span>
                      <span>输入: {price.input} • 输出: {price.output}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 环境变量配置 */}
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  环境变量配置
                </h4>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded font-mono">
                    {provider.envVar}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(provider.envVar)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  将你的API密钥保存为此环境变量名，或直接在模型配置中输入
                </p>
              </div>

              {/* 设置步骤 */}
              <div>
                <h4 className="text-sm font-medium mb-2">设置步骤</h4>
                <ol className="text-xs text-muted-foreground space-y-1">
                  {provider.setupSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="bg-primary/10 text-primary rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium mt-0.5 shrink-0">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* 快速测试 */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    配置完成后可在AI助手中测试
                  </span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">等待配置</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 使用建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">使用建议</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5 shrink-0">
                💡
              </div>
              <div>
                <span className="font-medium text-foreground">新手推荐：</span>
                选择 GPT-3.5 Turbo 开始，性价比高且响应快速
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5 shrink-0">
                🎯
              </div>
              <div>
                <span className="font-medium text-foreground">专业用户：</span>
                GPT-4 Turbo 或 Claude 3 Sonnet 适合复杂分析任务
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5 shrink-0">
                ⚡
              </div>
              <div>
                <span className="font-medium text-foreground">尝鲜体验：</span>
                Grok 提供独特的对话风格，适合创意场景
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}