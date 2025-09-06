import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Building2, Plus, Sparkles, Github, Twitter, Rss, Globe } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

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

interface CompanyOverviewProps {
  onSettingsClick?: () => void
}

export function CompanyOverview({ onSettingsClick }: CompanyOverviewProps) {
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [loading, setLoading] = useState(true)

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-14895810`

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const response = await fetch(`${serverUrl}/company-profiles`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })

      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const enabledCompanies = companies.filter(c => c.enabled)
  const totalDataSources = enabledCompanies.reduce((sum, c) => sum + c.dataSourceCount, 0)

  return (
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
        {loading ? (
          <div className="text-center py-3 text-muted-foreground text-sm">
            加载中...
          </div>
        ) : companies.length === 0 ? (
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
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div>
                <div className="text-base font-medium">{enabledCompanies.length}</div>
                <div className="text-xs text-muted-foreground">监控公司</div>
              </div>
              <div>
                <div className="text-base font-medium">{totalDataSources}</div>
                <div className="text-xs text-muted-foreground">数据源</div>
              </div>
              <div>
                <div className="text-base font-medium">
                  {companies.reduce((sum, c) => sum + c.github.repositories.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground">GitHub仓库</div>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {companies.slice(0, 8).map(company => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-muted/20"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${company.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium">{company.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {company.github.repositories.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        <Github className="h-2 w-2 mr-1" />
                        {company.github.repositories.length}
                      </Badge>
                    )}
                    {company.twitter.accounts.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        <Twitter className="h-2 w-2 mr-1" />
                        {company.twitter.accounts.length}
                      </Badge>
                    )}
                    {company.rss.feeds.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        <Rss className="h-2 w-2 mr-1" />
                        {company.rss.feeds.length}
                      </Badge>
                    )}
                    {Object.values(company.websites || {}).filter(Boolean).length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        <Globe className="h-2 w-2 mr-1" />
                        网站
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {companies.length > 8 && (
                <div className="text-center py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSettingsClick}
                    className="text-xs h-7"
                  >
                    查看全部 {companies.length} 个公司
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border">
              <div className="flex items-start gap-2">
                <Sparkles className="h-3 w-3 text-blue-500 mt-0.5" />
                <div className="text-xs">
                  <div className="font-medium text-blue-700 dark:text-blue-300">
                    💡 AI智能建议
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">
                    想监控更多AI公司？只需输入公司名称，AI会自动发现所有相关数据源！
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}