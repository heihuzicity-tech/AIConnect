import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Separator } from './ui/separator'
import { 
  Building2, 
  Plus, 
  Trash2, 
  Github, 
  Twitter, 
  Globe, 
  Rss, 
  Sparkles, 
  RefreshCw,
  ExternalLink,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

export interface CompanyProfile {
  id: string
  name: string
  description?: string
  website?: string
  logo?: string
  enabled: boolean
  
  // Data sources
  github: {
    repositories: Array<{
      owner: string
      repo: string
      enabled: boolean
      description?: string
      stars?: number
    }>
  }
  
  twitter: {
    accounts: Array<{
      username: string
      enabled: boolean
      displayName?: string
      followerCount?: number
    }>
  }
  
  rss: {
    feeds: Array<{
      url: string
      title: string
      enabled: boolean
      description?: string
    }>
  }
  
  websites: {
    blog?: string
    docs?: string
    changelog?: string
    status?: string
  }
  
  // Auto-collected info
  lastUpdated?: string
  dataSourceCount?: number
}

interface CompanyManagerProps {
  onCompanyChange?: () => void
}

export function CompanyManager({ onCompanyChange }: CompanyManagerProps) {
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null)
  const [isAddingCompany, setIsAddingCompany] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')

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
      toast.error('加载公司列表失败')
    } finally {
      setLoading(false)
    }
  }

  const aiDiscoverCompany = async (companyName: string): Promise<CompanyProfile | null> => {
    setAiSuggesting(true)
    try {
      const response = await fetch(`${serverUrl}/ai-discover-company`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companyName })
      })

      if (response.ok) {
        const discoveredProfile = await response.json()
        toast.success(`AI已自动发现 ${companyName} 的相关信息源`)
        return discoveredProfile
      } else {
        toast.error('AI发现失败，请手动配置')
        return null
      }
    } catch (error) {
      console.error('AI discovery failed:', error)
      toast.error('AI发现出错，请检查网络连接')
      return null
    } finally {
      setAiSuggesting(false)
    }
  }

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error('请输入公司名称')
      return
    }

    // Check if company already exists
    const exists = companies.some(c => 
      c.name.toLowerCase() === newCompanyName.toLowerCase()
    )

    if (exists) {
      toast.error('该公司已存在')
      return
    }

    setSaving(true)
    
    // Use AI to discover company information
    const aiProfile = await aiDiscoverCompany(newCompanyName)
    
    const newCompany: CompanyProfile = aiProfile || {
      id: newCompanyName.toLowerCase().replace(/\s+/g, '-'),
      name: newCompanyName,
      enabled: true,
      github: { repositories: [] },
      twitter: { accounts: [] },
      rss: { feeds: [] },
      websites: {}
    }

    try {
      const response = await fetch(`${serverUrl}/company-profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCompany)
      })

      if (response.ok) {
        const savedCompany = await response.json()
        setCompanies(prev => [...prev, savedCompany])
        setSelectedCompany(savedCompany)
        setNewCompanyName('')
        setIsAddingCompany(false)
        toast.success('公司添加成功')
        onCompanyChange?.()
      } else {
        toast.error('保存失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCompany = async (updatedCompany: CompanyProfile) => {
    setSaving(true)
    try {
      const response = await fetch(`${serverUrl}/company-profiles/${updatedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedCompany)
      })

      if (response.ok) {
        setCompanies(prev => 
          prev.map(c => c.id === updatedCompany.id ? updatedCompany : c)
        )
        setSelectedCompany(updatedCompany)
        toast.success('公司信息已更新')
        onCompanyChange?.()
      } else {
        toast.error('更新失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('确定要删除这个公司吗？这将同时删除所有相关的数据收集配置。')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${serverUrl}/company-profiles/${companyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })

      if (response.ok) {
        setCompanies(prev => prev.filter(c => c.id !== companyId))
        if (selectedCompany?.id === companyId) {
          setSelectedCompany(null)
        }
        toast.success('公司已删除')
        onCompanyChange?.()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setSaving(false)
    }
  }

  const enhanceWithAI = async (company: CompanyProfile) => {
    setAiSuggesting(true)
    try {
      const enhanced = await aiDiscoverCompany(company.name)
      if (enhanced) {
        // Merge AI suggestions with existing data
        const mergedCompany: CompanyProfile = {
          ...company,
          description: enhanced.description || company.description,
          website: enhanced.website || company.website,
          github: {
            repositories: [
              ...company.github.repositories,
              ...enhanced.github.repositories.filter(newRepo => 
                !company.github.repositories.some(existingRepo => 
                  existingRepo.owner === newRepo.owner && existingRepo.repo === newRepo.repo
                )
              )
            ]
          },
          twitter: {
            accounts: [
              ...company.twitter.accounts,
              ...enhanced.twitter.accounts.filter(newAccount => 
                !company.twitter.accounts.some(existingAccount => 
                  existingAccount.username === newAccount.username
                )
              )
            ]
          },
          rss: {
            feeds: [
              ...company.rss.feeds,
              ...enhanced.rss.feeds.filter(newFeed => 
                !company.rss.feeds.some(existingFeed => 
                  existingFeed.url === newFeed.url
                )
              )
            ]
          },
          websites: {
            ...company.websites,
            ...enhanced.websites
          }
        }
        
        handleUpdateCompany(mergedCompany)
      }
    } finally {
      setAiSuggesting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="h-full">


      {isAddingCompany && (
        <div className="mb-4 p-4 border rounded-lg space-y-3 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <Label>AI智能添加公司</Label>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="输入公司名称，如：OpenAI, Anthropic, Google, Microsoft..."
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCompany()}
              className="flex-1"
            />
            <Button
              onClick={handleAddCompany}
              disabled={saving || aiSuggesting || !newCompanyName.trim()}
            >
              {aiSuggesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  AI发现中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  智能添加
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingCompany(false)
                setNewCompanyName('')
              }}
            >
              取消
            </Button>
          </div>
          <div className="bg-blue-100/50 dark:bg-blue-900/30 p-3 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 AI会自动发现该公司的GitHub仓库、Twitter账号、官方博客、RSS订阅等信息源，一键完成所有配置
            </p>
          </div>
        </div>
      )}

      {/* Main Content - Left-Right Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Company List */}
        <div className="col-span-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Button
                onClick={() => setIsAddingCompany(true)}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                添加公司
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {companies.map(company => (
                <div
                  key={company.id}
                  className={`rounded-lg p-3 hover:bg-muted/50 transition-all cursor-pointer ${
                    selectedCompany?.id === company.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCompany(company)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${company.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <h3 className="font-medium truncate">{company.name}</h3>
                        <Badge variant={company.enabled ? "default" : "secondary"} className="text-xs">
                          {company.enabled ? '启用' : '禁用'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Github className="h-3 w-3" />
                          <span>{company.github.repositories.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Twitter className="h-3 w-3" />
                          <span>{company.twitter.accounts.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Rss className="h-3 w-3" />
                          <span>{company.rss.feeds.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>{Object.values(company.websites || {}).filter(Boolean).length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          enhanceWithAI(company)
                        }}
                        disabled={aiSuggesting}
                        className="h-6 w-6 p-0"
                      >
                        {aiSuggesting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCompany(company.id)
                        }}
                        className="text-destructive hover:text-destructive h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {companies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <h3 className="font-medium mb-2">暂无监控公司</h3>
                  <p className="text-sm mb-3">点击上方按钮添加公司</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingCompany(true)}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4" />
                    立即添加
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Company Detail Editor */}
        <div className="col-span-7">
          {selectedCompany ? (
            <CompanyDetailEditor
              company={selectedCompany}
              onSave={handleUpdateCompany}
              onClose={() => setSelectedCompany(null)}
              saving={saving}
              aiSuggesting={aiSuggesting}
              onAIEnhance={() => enhanceWithAI(selectedCompany)}
            />
          ) : (
            <div className="flex items-center justify-center text-center text-muted-foreground py-12">
              <div>
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">选择一个公司</h3>
                <p className="text-sm">
                  请从左侧列表中选择一个公司来查看和编辑其数据源配置
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CompanyDetailEditorProps {
  company: CompanyProfile
  onSave: (company: CompanyProfile) => void
  onClose: () => void
  saving: boolean
  aiSuggesting: boolean
  onAIEnhance: () => void
}

function CompanyDetailEditor({ 
  company, 
  onSave, 
  onClose, 
  saving, 
  aiSuggesting,
  onAIEnhance 
}: CompanyDetailEditorProps) {
  const [editedCompany, setEditedCompany] = useState<CompanyProfile>(company)

  useEffect(() => {
    setEditedCompany(company)
  }, [company])

  return (
    <div>
      <div className="p-6">
        <Tabs defaultValue="basic" className="w-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="github">GitHub 仓库</TabsTrigger>
            <TabsTrigger value="twitter">Twitter 账号</TabsTrigger>
            <TabsTrigger value="rss">RSS 订阅</TabsTrigger>
            <TabsTrigger value="websites">相关网站</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="flex flex-col">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">公司名称</Label>
                  <Input
                    id="company-name"
                    value={editedCompany.name}
                    onChange={(e) => setEditedCompany(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：OpenAI, Anthropic..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-website">官方网站</Label>
                  <Input
                    id="company-website"
                    value={editedCompany.website || ''}
                    onChange={(e) => setEditedCompany(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-description">公司描述</Label>
                <Textarea
                  id="company-description"
                  value={editedCompany.description || ''}
                  onChange={(e) => setEditedCompany(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入公司简介和主要业务..."
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Switch
                  checked={editedCompany.enabled}
                  onCheckedChange={(checked) => setEditedCompany(prev => ({ ...prev, enabled: checked }))}
                />
                <div>
                  <Label>启用监控</Label>
                  <p className="text-sm text-muted-foreground">
                    启用后将开始收集该公司的所有配置数据源
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onAIEnhance}
                disabled={aiSuggesting}
                className="flex items-center gap-2"
              >
                {aiSuggesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                AI增强
              </Button>
              <Button size="sm" onClick={() => onSave(editedCompany)} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="github" className="flex flex-col">
            <div className="space-y-4">
              <div className="space-y-3">
                {editedCompany.github.repositories.map((repo, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        placeholder="github-owner"
                        value={repo.owner}
                        onChange={(e) => {
                          const newRepos = [...editedCompany.github.repositories]
                          newRepos[index] = { ...repo, owner: e.target.value }
                          setEditedCompany(prev => ({ ...prev, github: { repositories: newRepos } }))
                        }}
                        className="w-40"
                      />
                      <span className="text-muted-foreground text-lg">/</span>
                      <Input
                        placeholder="repository-name"
                        value={repo.repo}
                        onChange={(e) => {
                          const newRepos = [...editedCompany.github.repositories]
                          newRepos[index] = { ...repo, repo: e.target.value }
                          setEditedCompany(prev => ({ ...prev, github: { repositories: newRepos } }))
                        }}
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {repo.description && (
                        <span className="text-xs text-muted-foreground max-w-32 truncate">
                          {repo.description}
                        </span>
                      )}
                      <Switch
                        checked={repo.enabled}
                        onCheckedChange={(checked) => {
                          const newRepos = [...editedCompany.github.repositories]
                          newRepos[index] = { ...repo, enabled: checked }
                          setEditedCompany(prev => ({ ...prev, github: { repositories: newRepos } }))
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRepos = editedCompany.github.repositories.filter((_, i) => i !== index)
                          setEditedCompany(prev => ({ ...prev, github: { repositories: newRepos } }))
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {editedCompany.github.repositories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Github className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>暂无 GitHub 仓库</p>
                    <p className="text-xs">点击"添加仓库"开始配置</p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => {
                  const newRepo = { owner: '', repo: '', enabled: true }
                  setEditedCompany(prev => ({
                    ...prev,
                    github: {
                      repositories: [...prev.github.repositories, newRepo]
                    }
                  }))
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                添加仓库
              </Button>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onAIEnhance}
                disabled={aiSuggesting}
                className="flex items-center gap-2"
              >
                {aiSuggesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                AI增强
              </Button>
              <Button size="sm" onClick={() => onSave(editedCompany)} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="twitter" className="flex flex-col">
            <div className="space-y-4">
              <div className="space-y-3">
                {editedCompany.twitter.accounts.map((account, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-muted-foreground">@</span>
                      <Input
                        placeholder="用户名"
                        value={account.username}
                        onChange={(e) => {
                          const newAccounts = [...editedCompany.twitter.accounts]
                          newAccounts[index] = { ...account, username: e.target.value }
                          setEditedCompany(prev => ({ ...prev, twitter: { accounts: newAccounts } }))
                        }}
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {account.displayName && (
                        <span className="text-xs text-muted-foreground max-w-32 truncate">
                          {account.displayName}
                        </span>
                      )}
                      <Switch
                        checked={account.enabled}
                        onCheckedChange={(checked) => {
                          const newAccounts = [...editedCompany.twitter.accounts]
                          newAccounts[index] = { ...account, enabled: checked }
                          setEditedCompany(prev => ({ ...prev, twitter: { accounts: newAccounts } }))
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newAccounts = editedCompany.twitter.accounts.filter((_, i) => i !== index)
                          setEditedCompany(prev => ({ ...prev, twitter: { accounts: newAccounts } }))
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {editedCompany.twitter.accounts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Twitter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>暂无 Twitter 账号</p>
                    <p className="text-xs">点击"添加账号"开始配置</p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => {
                  const newAccount = { username: '', enabled: true }
                  setEditedCompany(prev => ({
                    ...prev,
                    twitter: {
                      accounts: [...prev.twitter.accounts, newAccount]
                    }
                  }))
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                添加账号
              </Button>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onAIEnhance}
                disabled={aiSuggesting}
                className="flex items-center gap-2"
              >
                {aiSuggesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                AI增强
              </Button>
              <Button size="sm" onClick={() => onSave(editedCompany)} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="rss" className="flex flex-col">
            <div className="space-y-4">
              <div className="space-y-3">
                {editedCompany.rss.feeds.map((feed, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="RSS 订阅地址 (https://...)"
                        value={feed.url}
                        onChange={(e) => {
                          const newFeeds = [...editedCompany.rss.feeds]
                          newFeeds[index] = { ...feed, url: e.target.value }
                          setEditedCompany(prev => ({ ...prev, rss: { feeds: newFeeds } }))
                        }}
                      />
                      <Input
                        placeholder="订阅源名称"
                        value={feed.title}
                        onChange={(e) => {
                          const newFeeds = [...editedCompany.rss.feeds]
                          newFeeds[index] = { ...feed, title: e.target.value }
                          setEditedCompany(prev => ({ ...prev, rss: { feeds: newFeeds } }))
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={feed.enabled}
                        onCheckedChange={(checked) => {
                          const newFeeds = [...editedCompany.rss.feeds]
                          newFeeds[index] = { ...feed, enabled: checked }
                          setEditedCompany(prev => ({ ...prev, rss: { feeds: newFeeds } }))
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFeeds = editedCompany.rss.feeds.filter((_, i) => i !== index)
                          setEditedCompany(prev => ({ ...prev, rss: { feeds: newFeeds } }))
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {editedCompany.rss.feeds.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Rss className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>暂无 RSS 订阅</p>
                    <p className="text-xs">点击"添加订阅"开始配置</p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => {
                  const newFeed = { url: '', title: '', enabled: true }
                  setEditedCompany(prev => ({
                    ...prev,
                    rss: {
                      feeds: [...prev.rss.feeds, newFeed]
                    }
                  }))
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                添加订阅
              </Button>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onAIEnhance}
                disabled={aiSuggesting}
                className="flex items-center gap-2"
              >
                {aiSuggesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                AI增强
              </Button>
              <Button size="sm" onClick={() => onSave(editedCompany)} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="websites" className="flex flex-col">
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website-blog">官方博客</Label>
                  <Input
                    id="website-blog"
                    value={editedCompany.websites.blog || ''}
                    onChange={(e) => setEditedCompany(prev => ({ 
                      ...prev, 
                      websites: { ...prev.websites, blog: e.target.value }
                    }))}
                    placeholder="https://blog.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website-docs">开发者文档</Label>
                  <Input
                    id="website-docs"
                    value={editedCompany.websites.docs || ''}
                    onChange={(e) => setEditedCompany(prev => ({ 
                      ...prev, 
                      websites: { ...prev.websites, docs: e.target.value }
                    }))}
                    placeholder="https://docs.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website-changelog">更新日志</Label>
                  <Input
                    id="website-changelog"
                    value={editedCompany.websites.changelog || ''}
                    onChange={(e) => setEditedCompany(prev => ({ 
                      ...prev, 
                      websites: { ...prev.websites, changelog: e.target.value }
                    }))}
                    placeholder="https://changelog.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website-status">服务状态</Label>
                  <Input
                    id="website-status"
                    value={editedCompany.websites.status || ''}
                    onChange={(e) => setEditedCompany(prev => ({ 
                      ...prev, 
                      websites: { ...prev.websites, status: e.target.value }
                    }))}
                    placeholder="https://status.example.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onAIEnhance}
                disabled={aiSuggesting}
                className="flex items-center gap-2"
              >
                {aiSuggesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                AI增强
              </Button>
              <Button size="sm" onClick={() => onSave(editedCompany)} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}