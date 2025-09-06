import { useEffect } from 'react'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Switch } from './ui/switch'
import { Checkbox } from './ui/checkbox'
import { Github, MessageCircle, FileText, Megaphone, Code } from 'lucide-react'

export interface Company {
  id: string
  name: string
  subscribed: boolean
  unreadCount: number
}

export interface SourceType {
  id: string
  name: string
  icon: React.ReactNode
  enabled: boolean
  count: number
}

interface SourcesSidebarProps {
  companies: Company[]
  sourceTypes: SourceType[]
  onCompanyToggle: (companyId: string) => void
  onSourceTypeToggle: (sourceTypeId: string) => void
  onAllSourceTypesToggle: (enabled: boolean) => void
  onAllCompaniesToggle: (subscribed: boolean) => void
}

export function SourcesSidebar({ 
  companies, 
  sourceTypes, 
  onCompanyToggle, 
  onSourceTypeToggle,
  onAllSourceTypesToggle,
  onAllCompaniesToggle
}: SourcesSidebarProps) {
  // 计算信息源类型的选择状态
  const enabledSourceTypesCount = sourceTypes.filter(s => s.enabled).length
  const sourceTypesSelectState = enabledSourceTypesCount === 0 
    ? 'none' 
    : enabledSourceTypesCount === sourceTypes.length 
    ? 'all' 
    : 'partial'

  // 计算公司订阅的选择状态
  const subscribedCompaniesCount = companies.filter(c => c.subscribed).length
  const companiesSelectState = subscribedCompaniesCount === 0 
    ? 'none' 
    : subscribedCompaniesCount === companies.length 
    ? 'all' 
    : 'partial'

  const handleSourceTypesCheckboxChange = (checked: boolean) => {
    onAllSourceTypesToggle(checked)
  }

  const handleCompaniesCheckboxChange = (checked: boolean) => {
    onAllCompaniesToggle(checked)
  }

  // Set indeterminate state using useEffect and data attributes
  useEffect(() => {
    const sourceTypesCheckbox = document.querySelector('[data-source-types-checkbox]')
    if (sourceTypesCheckbox && sourceTypesCheckbox instanceof HTMLButtonElement) {
      sourceTypesCheckbox.indeterminate = sourceTypesSelectState === 'partial'
    }

    const companiesCheckbox = document.querySelector('[data-companies-checkbox]')
    if (companiesCheckbox && companiesCheckbox instanceof HTMLButtonElement) {
      companiesCheckbox.indeterminate = companiesSelectState === 'partial'
    }
  }, [sourceTypesSelectState, companiesSelectState])

  return (
    <div className="w-64 px-4 py-4 space-y-4 overflow-auto hide-scrollbar">
      {/* 信息源类型过滤 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <h3 className="font-medium">信息源类型</h3>
          </div>
          <div className="flex items-center gap-1">
            <Checkbox
              checked={sourceTypesSelectState === 'all'}
              onCheckedChange={handleSourceTypesCheckboxChange}
              className="h-4 w-4"
              data-source-types-checkbox=""
            />
            <span className="text-xs text-muted-foreground select-none">
              {enabledSourceTypesCount}/{sourceTypes.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          
          {sourceTypes.map((source) => (
            <div key={source.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {source.icon}
                </div>
                <span className="text-sm truncate">{source.name}</span>
                <Badge variant="secondary" className="text-xs h-5 px-1.5 flex-shrink-0">
                  {source.count}
                </Badge>
              </div>
              <Switch
                checked={source.enabled}
                onCheckedChange={() => onSourceTypeToggle(source.id)}
                className="ml-2 flex-shrink-0"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* 公司订阅管理 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <h3 className="font-medium">订阅公司</h3>
          </div>
          <div className="flex items-center gap-1">
            <Checkbox
              checked={companiesSelectState === 'all'}
              onCheckedChange={handleCompaniesCheckboxChange}
              className="h-4 w-4"
              data-companies-checkbox=""
            />
            <span className="text-xs text-muted-foreground select-none">
              {subscribedCompaniesCount}/{companies.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          
          {companies.map((company) => (
            <div key={company.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm truncate">{company.name}</span>
                {company.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs h-5 px-1.5 flex-shrink-0">
                    {company.unreadCount}
                  </Badge>
                )}
              </div>
              <Switch
                checked={company.subscribed}
                onCheckedChange={() => onCompanyToggle(company.id)}
                className="ml-2 flex-shrink-0"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}