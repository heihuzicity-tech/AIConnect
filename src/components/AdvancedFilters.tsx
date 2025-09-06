import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Slider } from './ui/slider'
import { DatePickerWithRange } from './ui/date-picker'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { Filter, Clock, Target, Tag, Calendar, SlidersHorizontal } from 'lucide-react'

interface FilterOptions {
  priority: ('high' | 'medium' | 'low')[]
  timeRange: 'all' | 'today' | 'week' | 'month' | 'custom'
  customDateRange?: { from: Date; to: Date }
  companies: string[]
  sourceTypes: string[]
  tags: string[]
  metrics: {
    minViews?: number
    minStars?: number
    minRetweets?: number
  }
}

interface AdvancedFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableCompanies: string[]
  availableSourceTypes: string[]
  availableTags: string[]
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableCompanies,
  availableSourceTypes,
  availableTags
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const activeFiltersCount = [
    filters.priority.length > 0 && filters.priority.length < 3,
    filters.timeRange !== 'all',
    filters.companies.length > 0,
    filters.sourceTypes.length > 0 && filters.sourceTypes.length < availableSourceTypes.length,
    filters.tags.length > 0,
    filters.metrics.minViews && filters.metrics.minViews > 0,
    filters.metrics.minStars && filters.metrics.minStars > 0,
    filters.metrics.minRetweets && filters.metrics.minRetweets > 0
  ].filter(Boolean).length

  const clearAllFilters = () => {
    onFiltersChange({
      priority: [],
      timeRange: 'all',
      companies: [],
      sourceTypes: [],
      tags: [],
      metrics: {}
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          高级筛选
          {activeFiltersCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>高级筛选选项</SheetTitle>
          <SheetDescription>
            设置详细的筛选条件来精确定位所需信息
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* 优先级筛选 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                优先级
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { value: 'high' as const, label: '高优先级', color: 'destructive' },
                { value: 'medium' as const, label: '中优先级', color: 'default' },
                { value: 'low' as const, label: '低优先级', color: 'secondary' }
              ].map((priority) => (
                <div key={priority.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority.value}`}
                    checked={filters.priority.includes(priority.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilter('priority', [...filters.priority, priority.value])
                      } else {
                        updateFilter('priority', filters.priority.filter(p => p !== priority.value))
                      }
                    }}
                  />
                  <label 
                    htmlFor={`priority-${priority.value}`}
                    className="text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Badge variant={priority.color as any} className="text-xs">
                      {priority.label}
                    </Badge>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 时间范围 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                时间范围
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={filters.timeRange}
                onValueChange={(value) => updateFilter('timeRange', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部时间</SelectItem>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">最近一周</SelectItem>
                  <SelectItem value="month">最近一月</SelectItem>
                  <SelectItem value="custom">自定义范围</SelectItem>
                </SelectContent>
              </Select>
              
              {filters.timeRange === 'custom' && (
                <div>
                  <DatePickerWithRange
                    date={filters.customDateRange}
                    onDateChange={(range) => updateFilter('customDateRange', range)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 公司筛选 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                公司选择
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-40 overflow-y-auto">
              {availableCompanies.map((company) => (
                <div key={company} className="flex items-center space-x-2">
                  <Checkbox
                    id={`company-${company}`}
                    checked={filters.companies.includes(company)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilter('companies', [...filters.companies, company])
                      } else {
                        updateFilter('companies', filters.companies.filter(c => c !== company))
                      }
                    }}
                  />
                  <label 
                    htmlFor={`company-${company}`}
                    className="text-sm cursor-pointer"
                  >
                    {company}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 热门标签 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                热门标签
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 15).map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      if (filters.tags.includes(tag)) {
                        updateFilter('tags', filters.tags.filter(t => t !== tag))
                      } else {
                        updateFilter('tags', [...filters.tags, tag])
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 指标筛选 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                热度指标筛选
              </CardTitle>
              <CardDescription className="text-xs">
                根据浏览量、点赞数等指标筛选热门内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  最小浏览量: {filters.metrics.minViews || 0}
                </label>
                <Slider
                  value={[filters.metrics.minViews || 0]}
                  onValueChange={([value]) => 
                    updateFilter('metrics', { ...filters.metrics, minViews: value })
                  }
                  max={50000}
                  step={1000}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  最小Star数: {filters.metrics.minStars || 0}
                </label>
                <Slider
                  value={[filters.metrics.minStars || 0]}
                  onValueChange={([value]) => 
                    updateFilter('metrics', { ...filters.metrics, minStars: value })
                  }
                  max={10000}
                  step={100}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={clearAllFilters}
              className="flex-1"
            >
              清除筛选
            </Button>
            <Button 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              应用筛选
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}