import { useState } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { FeedItem } from './FeedTimeline'
import { 
  TrendingUp, 
  Clock, 
  Tag, 
  Bookmark, 
  Share2, 
  Download,
  Activity,
  Users,
  FileText,
  AlertCircle,
  Search
} from 'lucide-react'

interface RightSidebarProps {
  feedItems: FeedItem[]
  selectedItem: FeedItem | null
  onTagClick: (tag: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  lastCollectionResult?: {
    timestamp?: string
    result?: any
    error?: string
  } | null
  backendConnected: boolean
}

export function RightSidebar({ 
  feedItems, 
  selectedItem, 
  onTagClick, 
  searchQuery,
  onSearchChange,
  lastCollectionResult, 
  backendConnected 
}: RightSidebarProps) {
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set())

  // 计算统计数据
  const stats = {
    totalItems: feedItems.length,
    companies: new Set(feedItems.map(item => item.company)).size,
    todayItems: feedItems.filter(item => {
      const today = new Date()
      const itemDate = new Date(item.publishedAt)
      return itemDate.toDateString() === today.toDateString()
    }).length,
    highPriorityItems: feedItems.filter(item => item.priority === 'high').length
  }

  // 公司活跃度统计
  const companyActivity = feedItems.reduce((acc, item) => {
    acc[item.company] = (acc[item.company] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCompanies = Object.entries(companyActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // 信息源分布
  const sourceDistribution = feedItems.reduce((acc, item) => {
    acc[item.sourceType] = (acc[item.sourceType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 热门标签
  const allTags = feedItems.flatMap(item => item.tags)
  const tagFrequency = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const popularTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)

  // 相关推荐（基于选中项目）
  const getRelatedItems = () => {
    if (!selectedItem) return []
    
    return feedItems
      .filter(item => 
        item.id !== selectedItem.id && 
        (item.company === selectedItem.company || 
         item.tags.some(tag => selectedItem.tags.includes(tag)))
      )
      .slice(0, 3)
  }

  const relatedItems = getRelatedItems()

  const handleBookmark = (itemId: string) => {
    setBookmarkedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleShare = (item: FeedItem) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.summary,
        url: item.sourceUrl
      })
    } else {
      navigator.clipboard.writeText(`${item.title}\n${item.sourceUrl}`)
    }
  }

  const handleExport = () => {
    const data = feedItems.map(item => ({
      title: item.title,
      company: item.company,
      sourceType: item.sourceType,
      publishedAt: item.publishedAt,
      sourceUrl: item.sourceUrl,
      tags: item.tags.join(', ')
    }))
    
    const csv = [
      'Title,Company,Source Type,Published At,URL,Tags',
      ...data.map(item => 
        `"${item.title}","${item.company}","${item.sourceType}","${item.publishedAt}","${item.sourceUrl}","${item.tags}"`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-news-feed.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-80 flex flex-col h-full">
      {/* 搜索框 - 固定在顶部 */}
      <div className="px-4 pt-4 pb-3 bg-background border-b border-border/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索公司、事件、关键词..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-input-background border-border/50 focus:border-border focus:bg-background"
          />
        </div>
      </div>

      {/* 滚动内容区域 */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-auto hide-scrollbar">
        {/* 数据概览 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4" />
          <h3 className="font-medium">数据概览</h3>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.totalItems}</div>
              <div className="text-xs text-muted-foreground">总信息数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.todayItems}</div>
              <div className="text-xs text-muted-foreground">今日新增</div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.companies}</div>
              <div className="text-xs text-muted-foreground">关注公司</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.highPriorityItems}</div>
              <div className="text-xs text-muted-foreground">高优先级</div>
            </div>
          </div>
        </div>
      </Card>

      {/* 公司活跃度 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4" />
          <h3 className="font-medium">公司活跃度</h3>
        </div>
        
        <div className="space-y-2">
          {topCompanies.map(([company, count]) => (
            <div key={company} className="flex items-center justify-between">
              <span className="text-sm truncate flex-1">{company}</span>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-16 bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ 
                      width: `${(count / Math.max(...Object.values(companyActivity))) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 热门标签 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4" />
          <h3 className="font-medium">热门标签</h3>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {popularTags.map(([tag, count]) => (
            <Badge 
              key={tag}
              variant="secondary" 
              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onTagClick(tag)}
            >
              {tag} ({count})
            </Badge>
          ))}
        </div>
      </Card>

      {/* 相关推荐 */}
      {selectedItem && relatedItems.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4" />
            <h3 className="font-medium">相关推荐</h3>
          </div>
          
          <div className="space-y-3">
            {relatedItems.map(item => (
              <div key={item.id} className="p-2 bg-muted/50 rounded-md">
                <div className="text-sm font-medium line-clamp-2 mb-1">{item.title}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.company}</span>
                  <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 快速操作 */}
      {selectedItem && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">快速操作</h3>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleBookmark(selectedItem.id)}
            >
              <Bookmark className={`h-4 w-4 mr-2 ${bookmarkedItems.has(selectedItem.id) ? 'fill-current' : ''}`} />
              {bookmarkedItems.has(selectedItem.id) ? '取消收藏' : '收藏'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleShare(selectedItem)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </Button>
          </div>
        </Card>
      )}

        {/* 数据导出 */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">数据导出</h3>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            导出 CSV
          </Button>
        </Card>
      </div>
    </div>
  )
}