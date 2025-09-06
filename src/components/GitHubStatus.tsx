import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Github, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface GitHubStatusProps {
  onRefresh?: () => void
}

export function GitHubStatus({ onRefresh }: GitHubStatusProps) {
  const [status, setStatus] = useState<{
    tokenConfigured: boolean
    tokenValid: boolean | null
    lastCollection: string | null
    rateLimit: { remaining: number; limit: number } | null
    error: string | null
    loading: boolean
  }>({
    tokenConfigured: false,
    tokenValid: null,
    lastCollection: null,
    rateLimit: null,
    error: null,
    loading: true
  })

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-14895810`

  const checkGitHubStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Check if token is configured by trying to get stats
      const response = await fetch(`${serverUrl}/github-status`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStatus(prev => ({
          ...prev,
          tokenConfigured: data.tokenConfigured,
          tokenValid: data.tokenValid,
          lastCollection: data.lastCollection,
          rateLimit: data.rateLimit,
          loading: false
        }))
      } else {
        setStatus(prev => ({
          ...prev,
          error: '无法获取GitHub状态',
          loading: false
        }))
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: '网络错误',
        loading: false
      }))
    }
  }

  useEffect(() => {
    checkGitHubStatus()
    // Auto refresh every 30 seconds
    const interval = setInterval(checkGitHubStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    checkGitHubStatus()
    onRefresh?.()
  }

  const getStatusColor = () => {
    if (status.loading) return 'bg-blue-500'
    if (status.error) return 'bg-red-500'
    if (!status.tokenConfigured) return 'bg-yellow-500'
    if (status.tokenValid === false) return 'bg-red-500'
    if (status.tokenValid === true) return 'bg-green-500'
    return 'bg-gray-500'
  }

  const getStatusText = () => {
    if (status.loading) return '检查中...'
    if (status.error) return status.error
    if (!status.tokenConfigured) return '未配置令牌'
    if (status.tokenValid === false) return '令牌无效'
    if (status.tokenValid === true) return '正常运行'
    return '状态未知'
  }

  const getStatusIcon = () => {
    if (status.loading) return <Clock className="h-4 w-4 animate-pulse" />
    if (status.error || status.tokenValid === false) return <XCircle className="h-4 w-4" />
    if (status.tokenValid === true) return <CheckCircle className="h-4 w-4" />
    return <Github className="h-4 w-4" />
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            <CardTitle className="text-sm">GitHub 数据源</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={status.loading}
          >
            <RefreshCw className={`h-3 w-3 ${status.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription className="text-xs">
          实时监控GitHub API连接状态
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium">{getStatusText()}</span>
          {getStatusIcon()}
        </div>
        
        {status.rateLimit && (
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>API 限制:</span>
              <span>{status.rateLimit.remaining}/{status.rateLimit.limit}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1 mt-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all"
                style={{ 
                  width: `${(status.rateLimit.remaining / status.rateLimit.limit) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
        
        {status.lastCollection && (
          <div className="text-xs text-muted-foreground">
            上次收集: {new Date(status.lastCollection).toLocaleString()}
          </div>
        )}
        
        <div className="flex gap-1">
          <Badge 
            variant={status.tokenConfigured ? "default" : "secondary"} 
            className="text-xs"
          >
            {status.tokenConfigured ? "已配置" : "未配置"}
          </Badge>
          {status.tokenValid !== null && (
            <Badge 
              variant={status.tokenValid ? "default" : "destructive"} 
              className="text-xs"
            >
              {status.tokenValid ? "有效" : "无效"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}