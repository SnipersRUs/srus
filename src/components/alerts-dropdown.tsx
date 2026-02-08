'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Notification = {
  id: string
  type: 'entry' | 'exit' | 'tp' | 'sl' | 'alert'
  symbol: string
  message: string
  timestamp: string
  read: boolean
}

export function AlertsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('zoid_notifications')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setNotifications(parsed)
          setUnreadCount(parsed.filter((n: Notification) => !n.read).length)
        }
      }
    } catch (e) {
      console.error('Error loading notifications:', e)
    }
  }, [])

  // Save notifications to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('zoid_notifications', JSON.stringify(notifications))
      setUnreadCount(notifications.filter(n => !n.read).length)
    } catch (e) {
      console.error('Error saving notifications:', e)
    }
  }, [notifications])

  // Listen for new notifications from signals-view
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zoid_notifications') {
        try {
          const saved = localStorage.getItem('zoid_notifications')
          if (saved) {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed)) {
              setNotifications(parsed)
              setUnreadCount(parsed.filter((n: Notification) => !n.read).length)
            }
          }
        } catch (e) {
          console.error('Error parsing notifications from storage:', e)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'entry': return <TrendingUp className="w-3 h-3 text-emerald-500" />
      case 'exit': return <TrendingDown className="w-3 h-3 text-red-500" />
      case 'tp': return <Target className="w-3 h-3 text-emerald-500" />
      case 'sl': return <AlertTriangle className="w-3 h-3 text-red-500" />
      default: return <Bell className="w-3 h-3 text-amber-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-full mt-2 w-80 z-50 border-white/10 bg-[#0a0a0a] shadow-2xl">
            <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between border-b border-white/5">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-500" />
                Alerts
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] bg-red-500/20 text-red-400">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-[10px] h-7 px-2"
                  >
                    Mark all read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAll}
                  className="text-[10px] h-7 px-2 text-red-400"
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No alerts yet</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Set price alerts on signals to get notified
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.slice(0, 20).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-white/5 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-purple-500/5' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        {getIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold truncate">
                              {notification.symbol}
                            </span>
                            <span className="text-[10px] text-gray-500 shrink-0">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
