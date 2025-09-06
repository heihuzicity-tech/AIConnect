import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Github, MessageCircle, FileText, Megaphone, Code, ExternalLink, Star, GitBranch, Eye, ArrowUpRight, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { getCompanyLogo } from '../utils/company-logos'

export interface FeedItem {
  id: string
  company: string
  companyLogo?: string
  title: string
  summary: string
  sourceType: 'announcement' | 'twitter' | 'blog' | 'github' | 'docs'
  sourceUrl: string
  publishedAt: Date
  priority: 'high' | 'medium' | 'low'
  tags: string[]
  metrics?: {
    stars?: number
    retweets?: number
    views?: number
    commits?: number
  }
  relatedEvents?: string[]
}

interface FeedTimelineProps {
  items: FeedItem[]
  onItemClick: (item: FeedItem) => void
}

const sourceConfig = {
  announcement: { 
    icon: <Megaphone className="h-3 w-3" />, 
    label: '公告', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  twitter: { 
    icon: <MessageCircle className="h-3 w-3" />, 
    label: 'X', 
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    iconColor: 'text-sky-600 dark:text-sky-400'
  },
  blog: { 
    icon: <FileText className="h-3 w-3" />, 
    label: '博客', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  github: { 
    icon: <Github className="h-3 w-3" />, 
    label: 'GitHub', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
    iconColor: 'text-gray-600 dark:text-gray-400'
  },
  docs: { 
    icon: <Code className="h-3 w-3" />, 
    label: '文档', 
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    iconColor: 'text-purple-600 dark:text-purple-400'
  }
}

const priorityIndicators = {
  high: '🔥',
  medium: '📌',
  low: '📝'
}

function formatMetrics(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

export function FeedTimeline({ items, onItemClick }: FeedTimelineProps) {
  // 不按日期分组，直接显示为连续流
  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const sourceConf = sourceConfig[item.sourceType]
        const timeAgo = formatDistanceToNow(item.publishedAt, { 
          addSuffix: true, 
          locale: zhCN 
        })
        
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/20 active:scale-[0.995] ${
                item.priority === 'high' ? 'ring-1 ring-orange-200 dark:ring-orange-800' : ''
              }`}
              onClick={() => onItemClick(item)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {/* 公司图标 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center overflow-hidden">
                    {getCompanyLogo(item.company) ? (
                      <ImageWithFallback
                        src={getCompanyLogo(item.company)!}
                        alt={`${item.company} logo`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {item.company.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* 主要内容 */}
                  <div className="flex-1 min-w-0">
                    {/* 头部信息行 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm text-foreground truncate">{item.company}</span>
                      
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${sourceConf.color}`}>
                        <span className={sourceConf.iconColor}>{sourceConf.icon}</span>
                        {sourceConf.label}
                      </div>
                      
                      {item.priority === 'high' && (
                        <span className="text-sm" title="高优先级">🔥</span>
                      )}
                      
                      <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{timeAgo}</span>
                    </div>
                    
                    {/* 标题 */}
                    <h3 className="font-semibold text-base leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    
                    {/* 摘要 */}
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                      {item.summary}
                    </p>
                    
                    {/* 底部信息 */}
                    <div className="flex items-center justify-between">
                      {/* 标签 */}
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-muted/60 text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                        )}
                      </div>
                      
                      {/* 指标和操作 */}
                      <div className="flex items-center gap-3 ml-4">
                        {item.metrics && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {item.metrics.stars && (
                              <div className="flex items-center gap-1" title="Stars">
                                <Star className="h-3 w-3" />
                                <span>{formatMetrics(item.metrics.stars)}</span>
                              </div>
                            )}
                            {item.metrics.retweets && (
                              <div className="flex items-center gap-1" title="转发">
                                <TrendingUp className="h-3 w-3" />
                                <span>{formatMetrics(item.metrics.retweets)}</span>
                              </div>
                            )}
                            {item.metrics.views && (
                              <div className="flex items-center gap-1" title="浏览">
                                <Eye className="h-3 w-3" />
                                <span>{formatMetrics(item.metrics.views)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <button 
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(item.sourceUrl, '_blank', 'noopener,noreferrer')
                          }}
                          title="查看原文"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 相关事件指示器 */}
                    {item.relatedEvents && item.relatedEvents.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-muted/50">
                        <span className="text-xs text-muted-foreground">
                          🔗 {item.relatedEvents.length} 个相关事件
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
      
      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">暂无信息</h3>
          <p className="text-sm text-muted-foreground">请调整筛选条件或等待数据更新</p>
        </div>
      )}
    </div>
  )
}