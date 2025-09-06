import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { X, ExternalLink, Share, BookmarkPlus, Clock, Tag, Users, ArrowLeft } from 'lucide-react'
import { FeedItem } from './FeedTimeline'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface ArticleReaderProps {
  item: FeedItem | null
  onClose: () => void
}

export function ArticleReader({ item, onClose }: ArticleReaderProps) {
  if (!item) return null

  const formatMetrics = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const sourceConfig: Record<string, { color: string; label: string }> = {
    announcement: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: '公告' },
    twitter: { color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', label: 'X' },
    blog: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: '博客' },
    github: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300', label: 'GitHub' },
    docs: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: '文档' }
  }

  const sourceConf = sourceConfig[item.sourceType] || sourceConfig.announcement

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 animate-in fade-in-0 duration-300">
      <div className="h-full flex flex-col">
        {/* 紧凑的顶部栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            
            <div className="h-4 w-px bg-border" />
            
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {item.company.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium">{item.company}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <BookmarkPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto px-6 py-6">
              {/* 紧凑的文章头部 */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${sourceConf.color}`}>
                    {sourceConf.label}
                  </div>
                  
                  {item.priority === 'high' && (
                    <span className="text-sm" title="高优先级">🔥</span>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(item.publishedAt, { 
                      addSuffix: true, 
                      locale: zhCN 
                    })}
                  </div>
                  
                  {item.metrics && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                      {item.metrics.stars && (
                        <span>⭐ {formatMetrics(item.metrics.stars)}</span>
                      )}
                      {item.metrics.retweets && (
                        <span>🔄 {formatMetrics(item.metrics.retweets)}</span>
                      )}
                      {item.metrics.views && (
                        <span>👁 {formatMetrics(item.metrics.views)}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <h1 className="text-2xl font-semibold leading-tight mb-3">{item.title}</h1>
                
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-muted/60 text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 文章正文 */}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="text-lg leading-relaxed text-muted-foreground mb-8 p-4 bg-muted/30 rounded-lg border-l-4 border-primary/20">
                  {item.summary}
                </div>
                
                <div className="space-y-6">
                  <section>
                    <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border/50">详细内容</h2>
                    <div className="space-y-4 text-base leading-relaxed">
                      <p>
                        这里显示从原始源获取的完整内容。在实际应用中，这些内容将通过API或RSS feed获取，
                        并进行智能解析和格式化以提供最佳的阅读体验。
                      </p>
                      <p>
                        系统会自动识别文章的结构，提取关键信息，并以最适合阅读的格式呈现。
                        这包括但不限于代码块的语法高亮、图片的优化展示、以及重要段落的突出显示。
                      </p>
                    </div>
                  </section>
                  
                  <section>
                    <h3 className="text-lg font-semibold mb-3">关键信息提取</h3>
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        <div>
                          <p className="font-medium text-sm">技术要点</p>
                          <p className="text-sm text-muted-foreground">自动提取关键技术点和更新内容</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                        <div>
                          <p className="font-medium text-sm">时间节点</p>
                          <p className="text-sm text-muted-foreground">识别重要的时间节点和里程碑</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                        <div>
                          <p className="font-medium text-sm">关联分析</p>
                          <p className="text-sm text-muted-foreground">检测与其他事件的关联性</p>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <section>
                    <h3 className="text-lg font-semibold mb-3">影响分析</h3>
                    <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200/20 dark:border-purple-800/20">
                      <p className="leading-relaxed">
                        系统会自动分析这些信息对整个AI行业的潜在影响，包括技术趋势、
                        市场动向和竞争格局的变化。这种分析基于大量历史数据和机器学习模型，
                        能够提供有价值的洞察和预测。
                      </p>
                    </div>
                  </section>
                </div>
                
                {item.relatedEvents && item.relatedEvents.length > 0 && (
                  <>
                    <Separator className="my-8" />
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">相关事件</h3>
                        <Badge variant="secondary" className="text-xs">
                          {item.relatedEvents.length}
                        </Badge>
                      </div>
                      <div className="grid gap-3">
                        {item.relatedEvents.map((eventId, index) => (
                          <div key={eventId} className="p-4 border rounded-lg hover:bg-muted/20 transition-colors cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium">相关事件 #{index + 1}</span>
                              <Badge variant="outline" className="text-xs">
                                来自同源
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              这是一个与当前事件相关的信息，可能来自相同的公司或涉及相似的技术话题。
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
              
              {/* 底部操作区 */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    数据来源已验证 • 实时更新
                  </div>
                  <Button asChild className="gap-2">
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      查看原文
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}