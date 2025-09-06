import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { SourcesSidebar, Company, SourceType } from './components/SourcesSidebar'
import { FeedTimeline, FeedItem } from './components/FeedTimeline'
import { ArticleReader } from './components/ArticleReader'
import { SettingsDialog } from './components/SettingsDialog'
import { RightSidebar } from './components/RightSidebar'
import { AdvancedFilters } from './components/AdvancedFilters'
import { AIAssistant } from './components/AIAssistant'


import { Github, MessageCircle, FileText, Megaphone, Code } from 'lucide-react'
import { projectId, publicAnonKey } from './utils/supabase/info'
import { Toaster } from './components/ui/sonner'

// 模拟数据
const mockCompanies: Company[] = [
  { id: 'openai', name: 'OpenAI', subscribed: true, unreadCount: 12 },
  { id: 'anthropic', name: 'Anthropic', subscribed: true, unreadCount: 8 },
  { id: 'google-ai', name: 'Google AI', subscribed: true, unreadCount: 15 },
  { id: 'microsoft', name: 'Microsoft AI', subscribed: true, unreadCount: 6 },
  { id: 'meta', name: 'Meta AI', subscribed: true, unreadCount: 9 },
  { id: 'xai', name: 'xAI', subscribed: false, unreadCount: 0 },
  { id: 'deepmind', name: 'DeepMind', subscribed: true, unreadCount: 4 },
  { id: 'huggingface', name: 'Hugging Face', subscribed: true, unreadCount: 7 }
]

const mockSourceTypes: SourceType[] = [
  { id: 'announcement', name: '官方公告', icon: <Megaphone className="h-4 w-4" />, enabled: true, count: 23 },
  { id: 'twitter', name: 'X推文', icon: <MessageCircle className="h-4 w-4" />, enabled: true, count: 45 },
  { id: 'blog', name: '博客文章', icon: <FileText className="h-4 w-4" />, enabled: true, count: 18 },
  { id: 'github', name: 'GitHub动态', icon: <Github className="h-4 w-4" />, enabled: true, count: 32 },
  { id: 'docs', name: '开发文档', icon: <Code className="h-4 w-4" />, enabled: false, count: 12 }
]

const mockFeedItems: FeedItem[] = [
  {
    id: '1',
    company: 'OpenAI',
    title: 'GPT-4 Turbo 现已支持视觉功能',
    summary: 'OpenAI 宣布 GPT-4 Turbo 现在可以处理图像输入，支持图像分析、OCR 和视觉推理等功能。这一更新大大扩展了模型的应用场景。',
    sourceType: 'announcement',
    sourceUrl: 'https://openai.com/blog/gpt-4-turbo-vision',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
    priority: 'high',
    tags: ['GPT-4', '视觉AI', '多模态', '更新'],
    metrics: { views: 15420, retweets: 892 },
    relatedEvents: ['related-1', 'related-2']
  },
  {
    id: '2',
    company: 'Anthropic',
    title: 'Claude 3 在代码生成任务中表现显著提升',
    summary: '最新基准测试显示，Claude 3 在 HumanEval 和 MBPP 等编程评测中的得分较前版本提升了 30%，特别是在复杂算法实现方面表现出色。',
    sourceType: 'blog',
    sourceUrl: 'https://anthropic.com/claude-3-coding',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
    priority: 'medium',
    tags: ['Claude', '代码生成', '基准测试', '性能优化'],
    metrics: { views: 8930 }
  },
  {
    id: '3',
    company: 'Google AI',
    title: 'Gemini Pro API 降价 50%，支持更长上下文',
    summary: 'Google 宣布 Gemini Pro API 价格下调 50%，同时上下文长度扩展至 2M token，为开发者提供更经济高效的解决方案。',
    sourceType: 'twitter',
    sourceUrl: 'https://twitter.com/googleai/status/xxx',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前
    priority: 'high',
    tags: ['Gemini', 'API', '价格调整', '上下文长度'],
    metrics: { retweets: 1240, views: 23400 }
  },
  {
    id: '4',
    company: 'Meta AI',
    title: 'Llama 2 在 GitHub 上获得 10 万 Star',
    summary: 'Meta 开源的 Llama 2 模型在 GitHub 上的关注度持续攀升，目前已获得 10 万个 Star，社区贡献度活跃，已有超过 2000 个 Fork。',
    sourceType: 'github',
    sourceUrl: 'https://github.com/facebookresearch/llama',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12小时前
    priority: 'medium',
    tags: ['Llama', '开源', 'GitHub', '里程碑'],
    metrics: { stars: 100000, views: 5600 }
  },
  {
    id: '5',
    company: 'Microsoft AI',
    title: 'Azure OpenAI 服务新增 GPT-4 Vision 支持',
    summary: 'Microsoft Azure OpenAI 服务现已集成 GPT-4 Vision 功能，企业用户可以通过 API 调用实现图像理解和分析功能。',
    sourceType: 'announcement',
    sourceUrl: 'https://azure.microsoft.com/updates/gpt4-vision',
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18小时前
    priority: 'medium',
    tags: ['Azure', 'GPT-4', '企业服务', 'API'],
    metrics: { views: 12300 }
  },
  {
    id: '6',
    company: 'xAI',
    title: 'Grok 模型训练完成，即将开放测试',
    summary: 'Elon Musk 的 xAI 公司宣布其首个大语言模型 Grok 已完成训练，将在未来几周内向 X Premium 用户开放早期访问权限。',
    sourceType: 'twitter',
    sourceUrl: 'https://twitter.com/elonmusk/status/xxx',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
    priority: 'high',
    tags: ['xAI', 'Grok', '新模型', '测试版本'],
    metrics: { retweets: 3400, views: 45600 },
    relatedEvents: ['related-3']
  }
]

export default function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [companies, setCompanies] = useState(mockCompanies)
  const [sourceTypes, setSourceTypes] = useState(mockSourceTypes)
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [feedItems, setFeedItems] = useState<FeedItem[]>(mockFeedItems)
  const [loading, setLoading] = useState(false)
  const [backendConnected, setBackendConnected] = useState(false)
  const [lastCollectionResult, setLastCollectionResult] = useState<{
    timestamp?: string
    result?: any
    error?: string
  } | null>(null)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [advancedFilters, setAdvancedFilters] = useState({
    priority: [] as ('high' | 'medium' | 'low')[],
    timeRange: 'all' as const,
    customDateRange: undefined as { from: Date; to: Date } | undefined,
    companies: [] as string[],
    sourceTypes: [] as string[],
    tags: [] as string[],
    metrics: {} as { minViews?: number; minStars?: number; minRetweets?: number }
  })

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-14895810`

  // Load data from backend
  useEffect(() => {
    checkBackendHealth()
    loadData()
  }, [])

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${serverUrl}/health`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })
      setBackendConnected(response.ok)
    } catch (error) {
      setBackendConnected(false)
      console.log('Backend health check failed:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load companies
      try {
        const companiesResponse = await fetch(`${serverUrl}/companies`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json()
          if (companiesData.length > 0) {
            setCompanies(companiesData)
          }
        }
      } catch (error) {
        console.log('Error loading companies from backend:', error)
      }

      // Load source types
      try {
        const sourceTypesResponse = await fetch(`${serverUrl}/source-types`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
        if (sourceTypesResponse.ok) {
          const sourceTypesData = await sourceTypesResponse.json()
          if (sourceTypesData.length > 0) {
            setSourceTypes(sourceTypesData)
          }
        }
      } catch (error) {
        console.log('Error loading source types from backend:', error)
      }

      // Load feed items
      try {
        const feedResponse = await fetch(`${serverUrl}/feed?limit=50`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
        if (feedResponse.ok) {
          const feedData = await feedResponse.json()
          if (feedData.items && feedData.items.length > 0) {
            setFeedItems(feedData.items.map((item: any) => ({
              ...item,
              publishedAt: new Date(item.publishedAt)
            })))
          }
        }
      } catch (error) {
        console.log('Error loading feed from backend:', error)
      }
    } catch (error) {
      console.log('General error loading data from backend:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerDataCollection = async () => {
    setLoading(true)
    setLastCollectionResult(null)
    
    try {
      console.log('开始手动数据收集...')
      const response = await fetch(`${serverUrl}/collect`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source: 'all' })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('数据收集成功:', result)
        setLastCollectionResult({
          timestamp: result.timestamp,
          result: result.result
        })
        // Reload feed after collection
        setTimeout(() => loadData(), 2000)
      } else {
        console.error('数据收集失败:', result)
        setLastCollectionResult({
          error: result.error || '数据收集失败'
        })
      }
    } catch (error) {
      console.error('数据收集出错:', error)
      setLastCollectionResult({
        error: '网络错误或服务器无响应'
      })
    } finally {
      setLoading(false)
    }
  }

  // 过滤和搜索逻辑
  const filteredItems = feedItems.filter(item => {
    // 按公司过滤
    const company = companies.find(c => c.name === item.company)
    if (!company?.subscribed) return false

    // 按源类型过滤
    const sourceType = sourceTypes.find(s => s.id === item.sourceType)
    if (!sourceType?.enabled) return false

    // 高级筛选 - 优先级
    if (advancedFilters.priority.length > 0 && !advancedFilters.priority.includes(item.priority)) {
      return false
    }

    // 高级筛选 - 公司
    if (advancedFilters.companies.length > 0 && !advancedFilters.companies.includes(item.company)) {
      return false
    }

    // 高级筛选 - 源类型
    if (advancedFilters.sourceTypes.length > 0 && !advancedFilters.sourceTypes.includes(item.sourceType)) {
      return false
    }

    // 高级筛选 - 标签
    if (advancedFilters.tags.length > 0 && !advancedFilters.tags.some(tag => item.tags.includes(tag))) {
      return false
    }

    // 高级筛选 - 时间范围
    if (advancedFilters.timeRange !== 'all') {
      const now = new Date()
      const itemDate = item.publishedAt
      let cutoff: Date

      switch (advancedFilters.timeRange) {
        case 'today':
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'custom':
          if (advancedFilters.customDateRange?.from) {
            cutoff = advancedFilters.customDateRange.from
            const endDate = advancedFilters.customDateRange.to || now
            if (itemDate > endDate) return false
          } else {
            cutoff = new Date(0)
          }
          break
        default:
          cutoff = new Date(0)
      }
      
      if (itemDate < cutoff) return false
    }

    // 高级筛选 - 指标
    if (advancedFilters.metrics.minViews && item.metrics?.views && item.metrics.views < advancedFilters.metrics.minViews) {
      return false
    }
    if (advancedFilters.metrics.minStars && item.metrics?.stars && item.metrics.stars < advancedFilters.metrics.minStars) {
      return false
    }
    if (advancedFilters.metrics.minRetweets && item.metrics?.retweets && item.metrics.retweets < advancedFilters.metrics.minRetweets) {
      return false
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.company.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return true
  })

  // 获取可用的筛选选项
  const availableCompanies = [...new Set(feedItems.map(item => item.company))]
  const availableSourceTypes = [...new Set(feedItems.map(item => item.sourceType))]
  const availableTags = [...new Set(feedItems.flatMap(item => item.tags))]

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag)
  }

  const handleCompanyToggle = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (!company) return

    const newSubscribed = !company.subscribed
    
    // Update local state immediately
    setCompanies(prev => 
      prev.map(c => 
        c.id === companyId 
          ? { ...c, subscribed: newSubscribed }
          : c
      )
    )

    // Update backend
    try {
      await fetch(`${serverUrl}/companies/${companyId}/subscribe`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscribed: newSubscribed })
      })
    } catch (error) {
      console.log('Error updating company subscription:', error)
      // Revert on error
      setCompanies(prev => 
        prev.map(c => 
          c.id === companyId 
            ? { ...c, subscribed: !newSubscribed }
            : c
        )
      )
    }
  }

  const handleSourceTypeToggle = async (sourceTypeId: string) => {
    const sourceType = sourceTypes.find(s => s.id === sourceTypeId)
    if (!sourceType) return

    const newEnabled = !sourceType.enabled
    
    // Update local state immediately
    setSourceTypes(prev => 
      prev.map(s => 
        s.id === sourceTypeId 
          ? { ...s, enabled: newEnabled }
          : s
      )
    )

    // Update backend
    try {
      await fetch(`${serverUrl}/source-types/${sourceTypeId}/toggle`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: newEnabled })
      })
    } catch (error) {
      console.log('Error updating source type:', error)
      // Revert on error
      setSourceTypes(prev => 
        prev.map(s => 
          s.id === sourceTypeId 
            ? { ...s, enabled: !newEnabled }
            : s
        )
      )
    }
  }

  const handleAllSourceTypesToggle = async (enabled: boolean) => {
    // Update local state immediately
    setSourceTypes(prev => 
      prev.map(s => ({ ...s, enabled }))
    )

    // Update backend for all source types
    try {
      await Promise.all(
        sourceTypes.map(sourceType =>
          fetch(`${serverUrl}/source-types/${sourceType.id}/toggle`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled })
          })
        )
      )
    } catch (error) {
      console.log('Error updating all source types:', error)
      // Revert on error
      setSourceTypes(prev => 
        prev.map(s => ({ ...s, enabled: !enabled }))
      )
    }
  }

  const handleAllCompaniesToggle = async (subscribed: boolean) => {
    // Update local state immediately
    setCompanies(prev => 
      prev.map(c => ({ ...c, subscribed }))
    )

    // Update backend for all companies
    try {
      await Promise.all(
        companies.map(company =>
          fetch(`${serverUrl}/companies/${company.id}/subscribe`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subscribed })
          })
        )
      )
    } catch (error) {
      console.log('Error updating all companies:', error)
      // Revert on error
      setCompanies(prev => 
        prev.map(c => ({ ...c, subscribed: !subscribed }))
      )
    }
  }

  const totalUnreadCount = companies
    .filter(c => c.subscribed)
    .reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="h-screen flex flex-col">
      <Header
        unreadCount={totalUnreadCount}
        onSettingsClick={() => setShowSettings(true)}
        onNotificationsClick={triggerDataCollection}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={() => setShowRightSidebar(!showRightSidebar)}
      />
      
      <div className="flex-1 overflow-auto bg-background hide-scrollbar">
        <div className="flex justify-center min-h-full">
          <div className="flex w-full max-w-7xl">
            <div className="bg-background flex-shrink-0 sticky top-0 self-start">
              <SourcesSidebar
                companies={companies}
                sourceTypes={sourceTypes}
                onCompanyToggle={handleCompanyToggle}
                onSourceTypeToggle={handleSourceTypeToggle}
                onAllSourceTypesToggle={handleAllSourceTypesToggle}
                onAllCompaniesToggle={handleAllCompaniesToggle}
              />
            </div>
            
            <main className="flex-1 min-w-0 bg-background">
              <div className="px-4 py-4">
                <FeedTimeline
                  items={filteredItems}
                  onItemClick={setSelectedItem}
                />
              </div>
            </main>

            {showRightSidebar && (
              <div className="bg-background flex-shrink-0 sticky top-0 self-start h-[calc(100vh-4rem)]">
                <RightSidebar
                  feedItems={filteredItems}
                  selectedItem={selectedItem}
                  onTagClick={handleTagClick}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  lastCollectionResult={lastCollectionResult}
                  backendConnected={backendConnected}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ArticleReader
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      <AIAssistant 
        feedItems={filteredItems}
        currentFilters={advancedFilters}
      />

      <Toaster />
    </div>
  )
}