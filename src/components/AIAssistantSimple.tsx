import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Bot, X } from 'lucide-react'

interface AIAssistantSimpleProps {
  feedItems?: any[]
  currentFilters?: any
}

export function AIAssistantSimple({ feedItems = [], currentFilters }: AIAssistantSimpleProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  console.log('AIAssistantSimple渲染中, isOpen:', isOpen)

  return (
    <>
      {/* 悬浮按钮 */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <Button
            onClick={() => {
              console.log('简化版AI助手按钮被点击')
              setIsOpen(true)
            }}
            className="h-14 w-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
            size="icon"
          >
            <Bot className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}

      {/* AI对话窗口 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <Card className="w-96 h-[500px] bg-white border shadow-2xl">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b bg-blue-50">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-sm">AI智能助手</h3>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('关闭AI助手')
                  setIsOpen(false)
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* 内容区域 */}
            <div className="p-4">
              <p>这是一个简化版的AI助手测试组件。</p>
              <p>当前状态：{isOpen ? '已打开' : '已关闭'}</p>
              <p>Feed项目数量：{feedItems.length}</p>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}