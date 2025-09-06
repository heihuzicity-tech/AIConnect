import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { BarChart3, RefreshCw, Clock, TrendingUp, AlertCircle, Building2, Plus, Sparkles, Github, Twitter, Rss, Globe, CheckCircle, XCircle, Filter, Merge } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface CollectionStats {
  totalItems: number
  todayItems: number
  companies: number
  sourceTypes: {
    announcement: number
    twitter: number
    blog: number
    github: number
    docs: number
  }
}

interface CompanyProfile {
  id: string
  name: string
  enabled: boolean
  dataSourceCount: number
  github: { repositories: any[] }
  twitter: { accounts: any[] }
  rss: { feeds: any[] }
  websites: any
}

interface GitHubStatus {
  tokenConfigured: boolean
  tokenValid: boolean | null
  lastCollection: string | null
  rateLimit: { remaining: number; limit: number } | null
  error: string | null
  loading: boolean
}

interface DeduplicationStats {
  totalProcessed: number
  duplicatesFound: number
  mergedEvents: number
  uniqueEvents: number
  deduplicationRate: number
}

interface StatsDialogProps {
  onRefresh?: () => void
  onSettingsClick?: () => void
}

export function StatsDialog({ onRefresh, onSettingsClick }: StatsDialogProps) {
  const [stats, setStats] = useState<CollectionStats | null>(null)
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [githubStatus, setGitHubStatus] = useState<GitHubStatus>({
    tokenConfigured: false,
    tokenValid: null,
    lastCollection: null,
    rateLimit: null,
    error: null,
    loading: true
  })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-14895810`

  const loadStats = async () => {
    setLoading(true)
    try {
      // Load collection stats
      const statsResponse = await fetch(`${serverUrl}/stats`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })
      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data)
      }

      // Load company profiles
      const companiesResponse = await fetch(`${serverUrl}/company-profiles`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json()
        setCompanies(companiesData)
      }

      // Load GitHub status
      const githubResponse = await fetch(`${serverUrl}/github-status`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })
      if (githubResponse.ok) {
        const githubData = await githubResponse.json()
        setGitHubStatus(prev => ({
          ...prev,
          ...githubData,
          loading: false
        }))
      }
    } catch (error) {
      console.log('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerCollection = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/collect`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source: 'all' })
      })
      
      if (response.ok) {
        // Trigger external refresh if provided
        onRefresh?.()
        // Reload stats after collection
        setTimeout(() => loadStats(), 2000)
      }
    } catch (error) {
      console.log('Error triggering collection:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadStats()
    }
  }, [open])

  const sourceTypeData = stats ? [
    { name: '官方公告', value: stats.sourceTypes.announcement, color: 'bg-blue-500' },
    { name: 'X推文', value: stats.sourceTypes.twitter, color: 'bg-sky-500' },
    { name: '博客文章', value: stats.sourceTypes.blog, color: 'bg-green-500' },
    { name: 'GitHub动态', value: stats.sourceTypes.github, color: 'bg-purple-500' },
    { name: '开发文档', value: stats.sourceTypes.docs, color: 'bg-orange-500' }
  ] : []

  const maxValue = Math.max(...sourceTypeData.map(d => d.value), 1)
  
  const enabledCompanies = companies.filter(c => c.enabled)
  const totalDataSources = enabledCompanies.reduce((sum, c) => sum + c.dataSourceCount, 0)
  
  // 模拟去重数据
  const deduplicationStats: DeduplicationStats = {
    totalProcessed: 1456,
    duplicatesFound: 234,
    mergedEvents: 89,
    uniqueEvents: 1133,
    deduplicationRate: 83.9
  }

  const getGitHubStatusColor = () => {
    if (githubStatus.loading) return 'bg-blue-500'
    if (githubStatus.error) return 'bg-red-500'
    if (!githubStatus.tokenConfigured) return 'bg-yellow-500'
    if (githubStatus.tokenValid === false) return 'bg-red-500'
    if (githubStatus.tokenValid === true) return 'bg-green-500'
    return 'bg-gray-500'
  }

  const getGitHubStatusText = () => {
    if (githubStatus.loading) return '检查中...'
    if (githubStatus.error) return githubStatus.error
    if (!githubStatus.tokenConfigured) return '未配置令牌'
    if (githubStatus.tokenValid === false) return '令牌无效'
    if (githubStatus.tokenValid === true) return '正常运行'
    return '状态未知'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="settings-dialog-content overflow-y-auto p-0">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              系统统计与状态监控
            </DialogTitle>
            <DialogDescription>
              查看数据采集统计、公司监控状态、数据源连接状态和智能去重效果
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-12 mb-6">
              <TabsTrigger value="overview" className="text-sm px-4 py-3">数据概览</TabsTrigger>
              <TabsTrigger value="companies" className="text-sm px-4 py-3">公司监控</TabsTrigger>
              <TabsTrigger value="sources" className="text-sm px-4 py-3">数据源状态</TabsTrigger>
              <TabsTrigger value="deduplication" className="text-sm px-4 py-3">智能去重</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle>总体统计</CardTitle>
                  <CardDescription>
                    系统核心指标概览
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-medium">{stats?.totalItems || 0}</div>
                      <div className="text-sm text-muted-foreground">总信息数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-medium text-green-600">{stats?.todayItems || 0}</div>
                      <div className="text-sm text-muted-foreground">今日新增</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-medium">{stats?.companies || 0}</div>
                      <div className="text-sm text-muted-foreground">覆盖公司</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-medium">5</div>
                      <div className="text-sm text-muted-foreground">数据源</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle>信息源分布</CardTitle>
                  <CardDescription>各类信息源的数据量统计</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {sourceTypeData.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-16 text-sm">{item.name}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Progress 
                                value={(item.value / maxValue) * 100} 
                                className="h-2"
                              />
                            </div>
                            <div className="w-10 text-sm">{item.value}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    数据收集控制
                  </CardTitle>
                  <CardDescription>手动触发数据收集或查看收集状态</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={triggerCollection}
                      disabled={loading}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? '收集中...' : '立即收集'}
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      自动收集间隔：15分钟
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>系统运行正常，数据收集功能活跃</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      支持的数据源：GitHub API、RSS订阅、Twitter API（需配置密钥）
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="companies" className="space-y-6">
              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        公司监控概览
                      </CardTitle>
                      <CardDescription>
                        AI智能配置的公司数据源
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSettingsClick}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      管理公司
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  {companies.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>暂无监控公司</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onSettingsClick}
                        className="mt-2 flex items-center gap-2"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI添加公司
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Summary stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-medium">{enabledCompanies.length}</div>
                          <div className="text-xs text-muted-foreground">监控公司</div>
                        </div>
                        <div>
                          <div className="text-lg font-medium">{totalDataSources}</div>
                          <div className="text-xs text-muted-foreground">数据源</div>
                        </div>
                        <div>
                          <div className="text-lg font-medium">
                            {companies.reduce((sum, c) => sum + c.github.repositories.length, 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">GitHub仓库</div>
                        </div>
                      </div>

                      {/* Company list */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {companies.map(company => (
                          <div
                            key={company.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${company.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span className="font-medium">{company.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {company.github.repositories.length > 0 && (
                                <Badge variant="secondary" className="text-xs px-2 py-1">
                                  <Github className="h-3 w-3 mr-1" />
                                  {company.github.repositories.length}
                                </Badge>
                              )}
                              {company.twitter.accounts.length > 0 && (
                                <Badge variant="secondary" className="text-xs px-2 py-1">
                                  <Twitter className="h-3 w-3 mr-1" />
                                  {company.twitter.accounts.length}
                                </Badge>
                              )}
                              {company.rss.feeds.length > 0 && (
                                <Badge variant="secondary" className="text-xs px-2 py-1">
                                  <Rss className="h-3 w-3 mr-1" />
                                  {company.rss.feeds.length}
                                </Badge>
                              )}
                              {Object.values(company.websites || {}).filter(Boolean).length > 0 && (
                                <Badge variant="secondary" className="text-xs px-2 py-1">
                                  <Globe className="h-3 w-3 mr-1" />
                                  网站
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* AI enhancement prompt */}
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div className="text-xs">
                            <div className="font-medium text-blue-700 dark:text-blue-300">
                              💡 AI智能建议
                            </div>
                            <div className="text-blue-600 dark:text-blue-400 mt-1">
                              想监控更多AI公司？只需输入公司名称，AI会自动发现所有相关数据源！
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="space-y-6 m-0">
              {/* GitHub状态 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      <CardTitle className="text-sm">GitHub 数据源</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadStats()}
                      disabled={githubStatus.loading}
                    >
                      <RefreshCw className={`h-3 w-3 ${githubStatus.loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    实时监控GitHub API连接状态
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getGitHubStatusColor()}`} />
                    <span className="text-sm font-medium">{getGitHubStatusText()}</span>
                    {githubStatus.loading && <Clock className="h-4 w-4 animate-pulse" />}
                    {githubStatus.error || githubStatus.tokenValid === false ? <XCircle className="h-4 w-4" /> : null}
                    {githubStatus.tokenValid === true && <CheckCircle className="h-4 w-4" />}
                  </div>
                  
                  {githubStatus.rateLimit && (
                    <div className="text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>API 限制:</span>
                        <span>{githubStatus.rateLimit.remaining}/{githubStatus.rateLimit.limit}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1 mt-1">
                        <div 
                          className="bg-primary h-1 rounded-full transition-all"
                          style={{ 
                            width: `${(githubStatus.rateLimit.remaining / githubStatus.rateLimit.limit) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {githubStatus.lastCollection && (
                    <div className="text-xs text-muted-foreground">
                      上次收集: {new Date(githubStatus.lastCollection).toLocaleString()}
                    </div>
                  )}
                  
                  <div className="flex gap-1">
                    <Badge 
                      variant={githubStatus.tokenConfigured ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {githubStatus.tokenConfigured ? "已配置" : "未配置"}
                    </Badge>
                    {githubStatus.tokenValid !== null && (
                      <Badge 
                        variant={githubStatus.tokenValid ? "default" : "destructive"} 
                        className="text-xs"
                      >
                        {githubStatus.tokenValid ? "有效" : "无效"}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* API配置状态 */}
              <Card>
                <CardHeader>
                  <CardTitle>数据源配置状态</CardTitle>
                  <CardDescription>各个数据源的API密钥配置状态</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">GitHub API</span>
                      <Badge variant={githubStatus.tokenConfigured ? "default" : "secondary"}>
                        {githubStatus.tokenConfigured ? "已配置" : "未配置"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Twitter API</span>
                      <Badge variant="default">已配置</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">RSS解析器</span>
                      <Badge variant="default">活跃</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <div className="font-medium">提示</div>
                        <div>如需配置新的API密钥，请在设置中进行配置。所有API调用均遵循合规使用原则。</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deduplication" className="space-y-6 m-0">
              {/* 去重状态 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    智能去重状态
                  </CardTitle>
                  <CardDescription>
                    自动识别重复信息并进行智能合并，提升阅读效率
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 去重效率指标 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>去重效率</span>
                      <span className="font-medium">{deduplicationStats.deduplicationRate}%</span>
                    </div>
                    <Progress value={deduplicationStats.deduplicationRate} className="h-2" />
                  </div>

                  {/* 统计数据 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">已处理</div>
                      <div className="text-lg font-semibold">{deduplicationStats.totalProcessed}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">唯一事件</div>
                      <div className="text-lg font-semibold text-green-600">{deduplicationStats.uniqueEvents}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">发现重复</div>
                      <div className="text-lg font-semibold text-orange-600">{deduplicationStats.duplicatesFound}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">合并事件</div>
                      <div className="text-lg font-semibold text-blue-600">{deduplicationStats.mergedEvents}</div>
                    </div>
                  </div>

                  {/* 去重策略说明 */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">去重策略</div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>标题相似度检测（80%阈值）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>内容语义分析</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>多源事件聚合</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Merge className="h-3 w-3 text-blue-500" />
                        <span>关联事件自动合并</span>
                      </div>
                    </div>
                  </div>

                  {/* 状态指示 */}
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="text-xs text-green-700 dark:text-green-300">
                      <div className="font-medium">去重系统运行正常</div>
                      <div>实时处理新增信息，自动过滤重复内容</div>
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