import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Trash2, Plus, Github, ExternalLink, RefreshCw } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

export interface GitHubRepo {
  id: string
  owner: string
  repo: string
  company: string
  enabled: boolean
  lastCollected?: string
  stars?: number
  description?: string
}

interface GitHubRepoManagerProps {
  onRepoChange?: () => void
}

export function GitHubRepoManager({ onRepoChange }: GitHubRepoManagerProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newRepo, setNewRepo] = useState({
    owner: '',
    repo: '',
    company: ''
  })
  const [validating, setValidating] = useState(false)

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-14895810`

  const companies = [
    'OpenAI',
    'Anthropic', 
    'Google AI',
    'Microsoft AI',
    'Meta AI',
    'xAI',
    'DeepMind',
    'Hugging Face',
    'Stability AI',
    'Cohere',
    'Inflection AI'
  ]

  useEffect(() => {
    loadRepos()
  }, [])

  const loadRepos = async () => {
    try {
      const response = await fetch(`${serverUrl}/github-repos`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })

      if (response.ok) {
        const data = await response.json()
        setRepos(data)
      } else {
        console.error('Failed to load GitHub repos')
      }
    } catch (error) {
      console.error('Error loading GitHub repos:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateRepo = async (owner: string, repo: string) => {
    if (!owner || !repo) return false

    setValidating(true)
    try {
      const response = await fetch(`${serverUrl}/validate-github-repo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ owner, repo })
      })

      const result = await response.json()
      return response.ok && result.valid
    } catch (error) {
      return false
    } finally {
      setValidating(false)
    }
  }

  const addRepo = async () => {
    if (!newRepo.owner || !newRepo.repo || !newRepo.company) {
      toast.error('请填写完整的仓库信息')
      return
    }

    // Check if repo already exists
    const exists = repos.some(r => 
      r.owner.toLowerCase() === newRepo.owner.toLowerCase() && 
      r.repo.toLowerCase() === newRepo.repo.toLowerCase()
    )

    if (exists) {
      toast.error('该仓库已存在')
      return
    }

    // Validate repo exists
    const isValid = await validateRepo(newRepo.owner, newRepo.repo)
    if (!isValid) {
      toast.error('仓库不存在或无法访问')
      return
    }

    setSaving(true)
    try {
      const repoData: GitHubRepo = {
        id: `${newRepo.owner}/${newRepo.repo}`,
        owner: newRepo.owner,
        repo: newRepo.repo,
        company: newRepo.company,
        enabled: true
      }

      const response = await fetch(`${serverUrl}/github-repos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(repoData)
      })

      if (response.ok) {
        const savedRepo = await response.json()
        setRepos(prev => [...prev, savedRepo])
        setNewRepo({ owner: '', repo: '', company: '' })
        toast.success('仓库添加成功')
        onRepoChange?.()
      } else {
        toast.error('保存失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setSaving(false)
    }
  }

  const removeRepo = async (repoId: string) => {
    setSaving(true)
    try {
      const response = await fetch(`${serverUrl}/github-repos/${repoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })

      if (response.ok) {
        setRepos(prev => prev.filter(r => r.id !== repoId))
        toast.success('仓库移除成功')
        onRepoChange?.()
      } else {
        toast.error('移除失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setSaving(false)
    }
  }

  const toggleRepo = async (repoId: string) => {
    const repo = repos.find(r => r.id === repoId)
    if (!repo) return

    const newEnabled = !repo.enabled
    
    // Optimistic update
    setRepos(prev => prev.map(r => 
      r.id === repoId ? { ...r, enabled: newEnabled } : r
    ))

    try {
      const response = await fetch(`${serverUrl}/github-repos/${repoId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: newEnabled })
      })

      if (!response.ok) {
        // Revert on error
        setRepos(prev => prev.map(r => 
          r.id === repoId ? { ...r, enabled: !newEnabled } : r
        ))
        toast.error('更新失败')
      } else {
        onRepoChange?.()
      }
    } catch (error) {
      // Revert on error
      setRepos(prev => prev.map(r => 
        r.id === repoId ? { ...r, enabled: !newEnabled } : r
      ))
      toast.error('网络错误')
    }
  }

  const refreshRepoInfo = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${serverUrl}/refresh-github-repos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })

      if (response.ok) {
        await loadRepos()
        toast.success('仓库信息已更新')
      } else {
        toast.error('刷新失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub 仓库管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            加载中...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub 仓库管理
            </CardTitle>
            <CardDescription>
              配置要监控的 GitHub 仓库，获取发布和更新信息
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshRepoInfo}
            disabled={saving}
          >
            <RefreshCw className={`h-3 w-3 ${saving ? 'animate-spin' : ''}`} />
            刷新信息
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="h-3 w-3" />
            <h4 className="text-sm font-medium">添加新仓库</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="owner" className="text-xs">仓库所有者</Label>
              <Input
                id="owner"
                placeholder="openai"
                value={newRepo.owner}
                onChange={(e) => setNewRepo(prev => ({ ...prev, owner: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="repo" className="text-xs">仓库名称</Label>
              <Input
                id="repo"
                placeholder="openai-python"
                value={newRepo.repo}
                onChange={(e) => setNewRepo(prev => ({ ...prev, repo: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company" className="text-xs">归属公司</Label>
              <Select 
                value={newRepo.company} 
                onValueChange={(value) => setNewRepo(prev => ({ ...prev, company: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择公司" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addRepo} 
                disabled={saving || validating || !newRepo.owner || !newRepo.repo || !newRepo.company}
                size="sm"
                className="w-full h-9"
              >
                {validating ? '验证中...' : saving ? '添加中...' : '添加'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">监控仓库 ({repos.length})</h4>
            <div className="text-xs text-muted-foreground">
              活跃: {repos.filter(r => r.enabled).length} / {repos.length}
            </div>
          </div>
          
          {repos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
              <Github className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无监控仓库</p>
              <p className="text-xs">请添加要监控的 GitHub 仓库</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {repos.map(repo => (
                <div key={repo.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${repo.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{repo.owner}/{repo.repo}</span>
                        <Badge variant="secondary" className="text-xs px-1 py-0 flex-shrink-0">
                          {repo.company}
                        </Badge>
                        <a
                          href={`https://github.com/${repo.owner}/${repo.repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        >
                          <ExternalLink className="h-2 w-2" />
                        </a>
                      </div>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {repo.stars !== undefined && (
                          <span>⭐ {repo.stars.toLocaleString()}</span>
                        )}
                        {repo.lastCollected && (
                          <span>
                            {new Date(repo.lastCollected).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRepo(repo.id)}
                      className="h-7 px-2 text-xs"
                    >
                      {repo.enabled ? '禁用' : '启用'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeRepo(repo.id)}
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}