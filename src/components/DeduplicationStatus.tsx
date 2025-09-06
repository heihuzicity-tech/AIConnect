import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { CheckCircle, AlertTriangle, Merge, Filter } from 'lucide-react'

interface DeduplicationStats {
  totalProcessed: number
  duplicatesFound: number
  mergedEvents: number
  uniqueEvents: number
  deduplicationRate: number
}

interface DeduplicationStatusProps {
  stats?: DeduplicationStats
}

export function DeduplicationStatus({ stats }: DeduplicationStatusProps) {
  // 模拟数据，实际应从API获取
  const defaultStats: DeduplicationStats = {
    totalProcessed: 1456,
    duplicatesFound: 234,
    mergedEvents: 89,
    uniqueEvents: 1133,
    deduplicationRate: 83.9
  }

  const data = stats || defaultStats

  return (
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
            <span className="font-medium">{data.deduplicationRate}%</span>
          </div>
          <Progress value={data.deduplicationRate} className="h-2" />
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">已处理</div>
            <div className="text-lg font-semibold">{data.totalProcessed}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">唯一事件</div>
            <div className="text-lg font-semibold text-green-600">{data.uniqueEvents}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">发现重复</div>
            <div className="text-lg font-semibold text-orange-600">{data.duplicatesFound}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">合并事件</div>
            <div className="text-lg font-semibold text-blue-600">{data.mergedEvents}</div>
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
  )
}