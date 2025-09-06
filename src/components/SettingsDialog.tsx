import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { CompanyManager } from './CompanyManager'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    github: {
      enabled: true,
      token: '',
      interval: '15'
    },
    twitter: {
      enabled: true,
      bearerToken: '',
      interval: '10'
    },
    rss: {
      enabled: true,
      interval: '30'
    },
    notifications: {
      highPriority: true,
      newSubscriptions: true,
      keywords: false,
      keywordList: '',
      frequency: 'realtime'
    },
    reading: {
      darkMode: false,
      compactView: false,
      autoExpandSummary: true,
      sortBy: 'time',
      itemsPerPage: '20',
      smartMerge: true,
      showOriginalSources: false
    },
    api: {
      webhookUrl: '',
      exportFormat: 'json',
      enableApi: false,
      requireAuth: true
    }
  })
  const [saving, setSaving] = useState(false)
  const [testingGithub, setTestingGithub] = useState(false)
  const [githubStatus, setGithubStatus] = useState<{
    status: 'unknown' | 'valid' | 'invalid' | 'testing'
    message?: string
  }>({ status: 'unknown' })

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-14895810`

  const handleSave = async () => {
    setSaving(true)
    try {
      // 保存GitHub令牌到环境变量
      if (settings.github.token && settings.github.token.trim()) {
        const response = await fetch(`${serverUrl}/save-config`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'github_token',
            value: settings.github.token.trim()
          })
        })

        if (!response.ok) {
          throw new Error('保存GitHub令牌失败')
        }
      }

      // 保存Twitter Bearer Token
      if (settings.twitter.bearerToken && settings.twitter.bearerToken.trim()) {
        const response = await fetch(`${serverUrl}/save-config`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'twitter_bearer_token',
            value: settings.twitter.bearerToken.trim()
          })
        })

        if (!response.ok) {
          throw new Error('保存Twitter令牌失败')
        }
      }

      // 保存其他设置到KV存储
      const response = await fetch(`${serverUrl}/save-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'user_settings',
          value: settings
        })
      })

      if (!response.ok) {
        throw new Error('保存设置失败')
      }

      toast.success('设置保存成功！GitHub令牌已配置，可以开始收集真实数据了。')
      onOpenChange(false)
    } catch (error) {
      console.error('保存设置时出错:', error)
      toast.error('保存设置失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const testGithubToken = async () => {
    if (!settings.github.token.trim()) {
      setGithubStatus({ status: 'invalid', message: '请先输入GitHub令牌' })
      return
    }

    setTestingGithub(true)
    setGithubStatus({ status: 'testing', message: '正在测试令牌...' })

    try {
      const response = await fetch(`${serverUrl}/test-github-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: settings.github.token.trim()
        })
      })

      const result = await response.json()

      if (response.ok && result.valid) {
        setGithubStatus({ 
          status: 'valid', 
          message: `令牌有效！API限制: ${result.rateLimit?.remaining}/${result.rateLimit?.limit}` 
        })
      } else {
        setGithubStatus({ 
          status: 'invalid', 
          message: result.error || '令牌无效或已过期' 
        })
      }
    } catch (error) {
      setGithubStatus({ 
        status: 'invalid', 
        message: '测试失败，请检查网络连接' 
      })
    } finally {
      setTestingGithub(false)
    }
  }

  // 当token改变时重置状态
  const handleTokenChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      github: { ...prev.github, token: value }
    }))
    setGithubStatus({ status: 'unknown' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="settings-dialog-content overflow-y-auto p-0">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl">系统设置</DialogTitle>
            <DialogDescription className="text-lg">
              以公司为中心，AI智能配置所有数据源
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="sources" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14 mb-8">
            <TabsTrigger value="sources" className="text-base px-6 py-4">数据源</TabsTrigger>
            <TabsTrigger value="apis" className="text-base px-6 py-4">API配置</TabsTrigger>
            <TabsTrigger value="notifications" className="text-base px-6 py-4">通知</TabsTrigger>
            <TabsTrigger value="reading" className="text-base px-6 py-4">阅读</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-6">
            <CompanyManager />
          </TabsContent>

          <TabsContent value="apis" className="space-y-6">
            <div className="space-y-6">
              {/* 数据源API */}
              <Card>
                <CardHeader className="p-6">
                  <CardTitle>数据源 API</CardTitle>
                  <CardDescription>
                    配置各个数据源的API访问权限和更新频率
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* GitHub API */}
                  <div className="group">
                    <div className="flex items-start justify-between p-4 border rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">GitHub API</h3>
                            <div className={`w-2 h-2 rounded-full ${settings.github.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            获取仓库更新、发布信息和提交动态
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.github.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          github: { ...prev.github, enabled: checked }
                        }))}
                      />
                    </div>
                    
                    {settings.github.enabled && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800/50 border rounded-lg ml-4 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2 space-y-2">
                            <Label htmlFor="github-token" className="text-sm font-medium">访问令牌</Label>
                            <div className="flex gap-2">
                              <Input 
                                id="github-token" 
                                type="password" 
                                placeholder="ghp_xxxxxxxxxxxx"
                                value={settings.github.token}
                                onChange={(e) => handleTokenChange(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={testGithubToken}
                                disabled={testingGithub || !settings.github.token.trim()}
                              >
                                {testingGithub ? '测试中...' : '验证'}
                              </Button>
                            </div>
                            {githubStatus.status !== 'unknown' && (
                              <div className={`text-xs flex items-center gap-2 px-2 py-1 rounded-md ${
                                githubStatus.status === 'valid' ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30' :
                                githubStatus.status === 'invalid' ? 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30' :
                                'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  githubStatus.status === 'valid' ? 'bg-green-500' :
                                  githubStatus.status === 'invalid' ? 'bg-red-500' :
                                  'bg-blue-500 animate-pulse'
                                }`} />
                                {githubStatus.message}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="github-interval" className="text-sm font-medium">更新间隔</Label>
                            <Select 
                              value={settings.github.interval}
                              onValueChange={(value) => setSettings(prev => ({
                                ...prev,
                                github: { ...prev.github, interval: value }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5分钟</SelectItem>
                                <SelectItem value="15">15分钟</SelectItem>
                                <SelectItem value="30">30分钟</SelectItem>
                                <SelectItem value="60">1小时</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Twitter API */}
                  <div className="group">
                    <div className="flex items-start justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">X (Twitter) API</h3>
                            <div className={`w-2 h-2 rounded-full ${settings.twitter.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            监控公司官方账号的推文和动态
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.twitter.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          twitter: { ...prev.twitter, enabled: checked }
                        }))}
                      />
                    </div>
                    
                    {settings.twitter.enabled && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800/50 border rounded-lg ml-4 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="twitter-bearer" className="text-sm font-medium">Bearer Token</Label>
                            <Input 
                              id="twitter-bearer" 
                              type="password" 
                              placeholder="AAAAAAAAAAAAAAAAAAAAAxxxx"
                              value={settings.twitter.bearerToken}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                twitter: { ...prev.twitter, bearerToken: e.target.value }
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="twitter-interval" className="text-sm font-medium">更新间隔</Label>
                            <Select 
                              value={settings.twitter.interval}
                              onValueChange={(value) => setSettings(prev => ({
                                ...prev,
                                twitter: { ...prev.twitter, interval: value }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5分钟</SelectItem>
                                <SelectItem value="10">10分钟</SelectItem>
                                <SelectItem value="30">30分钟</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RSS API */}
                  <div className="group">
                    <div className="flex items-start justify-between p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248S0 22.546 0 20.752s1.456-3.248 3.252-3.248 3.251 1.454 3.251 3.248zM1.677 6.155v4.301c2.493 0 4.84.978 6.607 2.745C10.051 15.002 11.03 17.35 11.03 19.841h4.301c0-5.011-4.072-9.084-9.083-9.084L1.677 6.155zM1.677.06v4.301C11.636 4.361 19.676 12.4 19.676 22.36H24C24 11.695 13.31 1.005 2.647 1.005L1.677.06z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">RSS 订阅</h3>
                            <div className={`w-2 h-2 rounded-full ${settings.rss.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            通过RSS获取博客文章和官方公告
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.rss.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          rss: { ...prev.rss, enabled: checked }
                        }))}
                      />
                    </div>
                    
                    {settings.rss.enabled && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800/50 border rounded-lg ml-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="rss-interval" className="text-sm font-medium">更新间隔</Label>
                            <Select 
                              value={settings.rss.interval}
                              onValueChange={(value) => setSettings(prev => ({
                                ...prev,
                                rss: { ...prev.rss, interval: value }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15分钟</SelectItem>
                                <SelectItem value="30">30分钟</SelectItem>
                                <SelectItem value="60">1小时</SelectItem>
                                <SelectItem value="120">2小时</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 外部服务集成 */}
              <Card>
                <CardHeader className="p-6">
                  <CardTitle>外部服务集成</CardTitle>
                  <CardDescription>
                    配置Webhook、数据导出和API访问控制
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="webhook" className="text-sm font-medium">Webhook URL</Label>
                      <Input 
                        id="webhook" 
                        placeholder="https://your-app.com/webhook"
                        value={settings.api.webhookUrl}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          api: { ...prev.api, webhookUrl: e.target.value }
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        重要事件将推送到此URL
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="export-format" className="text-sm font-medium">数据导出格式</Label>
                      <Select 
                        value={settings.api.exportFormat}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          api: { ...prev.api, exportFormat: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">API 访问控制</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                        <div>
                          <Label className="text-sm font-medium">启用API访问</Label>
                          <p className="text-xs text-muted-foreground">允许外部应用访问数据</p>
                        </div>
                        <Switch 
                          checked={settings.api.enableApi}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            api: { ...prev.api, enableApi: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                        <div>
                          <Label className="text-sm font-medium">需要身份验证</Label>
                          <p className="text-xs text-muted-foreground">API调用需要认证</p>
                        </div>
                        <Switch 
                          checked={settings.api.requireAuth}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            api: { ...prev.api, requireAuth: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 保存按钮 */}
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="px-8">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      保存中...
                    </>
                  ) : (
                    '保存设置'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>



          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-6">
              {/* 通知类型配置 */}
              <Card>
                <CardHeader className="p-6">
                  <CardTitle>通知类型</CardTitle>
                  <CardDescription>
                    选择您希望接收的通知类型
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div>
                        <Label>高优先级事件通知</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          重大发布、安全更新等重要事件
                        </p>
                      </div>
                      <Switch 
                        checked={settings.notifications.highPriority}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, highPriority: checked }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div>
                        <Label>新订阅公司动态</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          当关注的公司发布新内容时通知
                        </p>
                      </div>
                      <Switch 
                        checked={settings.notifications.newSubscriptions}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, newSubscriptions: checked }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div>
                        <Label>关键词提醒</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          包含特定关键词的内容
                        </p>
                      </div>
                      <Switch 
                        checked={settings.notifications.keywords}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, keywords: checked }
                        }))}
                      />
                    </div>
                    
                    {settings.notifications.keywords && (
                      <div className="ml-4 space-y-2 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border">
                        <Label htmlFor="keywords">监控关键词</Label>
                        <Input 
                          id="keywords" 
                          placeholder="GPT, LLAMA, 大模型, 人工智能 (用逗号分隔)"
                          value={settings.notifications.keywordList}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, keywordList: e.target.value }
                          }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 用逗号分隔多个关键词，支持中英文
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 通知频率配置 */}
              <Card>
                <CardHeader className="p-6">
                  <CardTitle>通知频率</CardTitle>
                  <CardDescription>
                    设置接收通知的频率和时间
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>通知频率</Label>
                      <Select 
                        value={settings.notifications.frequency}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, frequency: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">实时通知</SelectItem>
                          <SelectItem value="hourly">每小时汇总</SelectItem>
                          <SelectItem value="daily">每日汇总</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>通知方式</Label>
                      <Select defaultValue="browser">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="browser">浏览器通知</SelectItem>
                          <SelectItem value="email">邮件通知</SelectItem>
                          <SelectItem value="both">两者都要</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      <Label className="text-amber-700 dark:text-amber-300">通知提示</Label>
                    </div>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      实时通知会在有新内容时立即推送，汇总通知会在指定时间集中发送，有助于减少打扰
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reading" className="space-y-6">
            <div className="space-y-6">
              {/* 界面偏好 */}
              <Card>
                <CardHeader className="p-6">
                  <CardTitle>界面偏好</CardTitle>
                  <CardDescription>
                    自定义界面显示和视觉效果
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div>
                        <Label>深色模式</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          启用深色主题，保护眼睛
                        </p>
                      </div>
                      <Switch 
                        checked={settings.reading.darkMode}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          reading: { ...prev.reading, darkMode: checked }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div>
                        <Label>紧凑视图</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          减少间距，显示更多内容
                        </p>
                      </div>
                      <Switch 
                        checked={settings.reading.compactView}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          reading: { ...prev.reading, compactView: checked }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div>
                        <Label>自动展开摘要</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          默认显示完整的内容摘要
                        </p>
                      </div>
                      <Switch 
                        checked={settings.reading.autoExpandSummary}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          reading: { ...prev.reading, autoExpandSummary: checked }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 内容组织 */}
              <Card>
                <CardHeader className="p-6">
                  <CardTitle>内容组织</CardTitle>
                  <CardDescription>
                    配置内容的排序和分页显示
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>默认排序方式</Label>
                      <Select 
                        value={settings.reading.sortBy}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          reading: { ...prev.reading, sortBy: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">按时间排序</SelectItem>
                          <SelectItem value="priority">按优先级排序</SelectItem>
                          <SelectItem value="relevance">按相关性排序</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>每页显示条数</Label>
                      <Select 
                        value={settings.reading.itemsPerPage}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          reading: { ...prev.reading, itemsPerPage: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10条</SelectItem>
                          <SelectItem value="20">20条</SelectItem>
                          <SelectItem value="50">50条</SelectItem>
                          <SelectItem value="100">100条</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 智能处理 */}
              <Card>
                <CardHeader className="p-6">
                  <CardTitle>智能处理</CardTitle>
                  <CardDescription>
                    配置AI驱动的内容去重和聚合功能
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div>
                        <Label>智能合并相似事件</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          AI自动识别并合并相似的新闻事件
                        </p>
                      </div>
                      <Switch 
                        checked={settings.reading.smartMerge}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          reading: { ...prev.reading, smartMerge: checked }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div>
                        <Label>显示原始多源信息</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          合并事件时保留各数据源的原始链接
                        </p>
                      </div>
                      <Switch 
                        checked={settings.reading.showOriginalSources}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          reading: { ...prev.reading, showOriginalSources: checked }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50/50 dark:bg-green-950/20 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <Label className="text-green-700 dark:text-green-300">智能去重提示</Label>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      启用智能合并后，系统会自动识别同一事件的多个报道，并提供统一的视图，帮助您快速了解事件全貌
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6 min-h-[600px]">
            <Card>
              <CardHeader className="p-8">
                <CardTitle className="text-xl">API 接口配置</CardTitle>
                <CardDescription className="text-base">
                  配置外部服务和数据导出设置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="webhook" className="text-base">Webhook URL</Label>
                    <Input 
                      id="webhook" 
                      placeholder="https://your-app.com/webhook"
                      value={settings.api.webhookUrl}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        api: { ...prev.api, webhookUrl: e.target.value }
                      }))}
                      className="h-12 text-base"
                    />
                    <p className="text-base text-muted-foreground">
                      重要事件将推送到此URL
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="export-format" className="text-base">数据导出格式</Label>
                    <Select 
                      value={settings.api.exportFormat}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        api: { ...prev.api, exportFormat: value }
                      }))}
                    >
                      <SelectTrigger className="h-12 text-base max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-6">
                  <Label className="text-base">API 访问控制</Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-base">启用API访问</span>
                      <Switch 
                        checked={settings.api.enableApi}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          api: { ...prev.api, enableApi: checked }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-base">需要API密钥认证</span>
                      <Switch 
                        checked={settings.api.requireAuth}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          api: { ...prev.api, requireAuth: checked }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


        </div>
      </DialogContent>
    </Dialog>
  )
}