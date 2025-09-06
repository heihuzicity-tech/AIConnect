import { Settings, Bell, BookOpen, PanelRight } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { StatsDialog } from './StatsDialog'

interface HeaderProps {
  unreadCount: number
  onSettingsClick: () => void
  onNotificationsClick: () => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
}

export function Header({ 
  unreadCount, 
  onSettingsClick, 
  onNotificationsClick,
  showRightSidebar,
  onToggleRightSidebar
}: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-7xl flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="font-semibold">AI情报聚合平台</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNotificationsClick}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleRightSidebar}
              className={showRightSidebar ? 'bg-accent' : ''}
            >
              <PanelRight className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}