'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, CheckCheck } from 'lucide-react'
import Link from 'next/link'

interface ToastNotification {
  id: string
  title: string
  message: string
  type: string
  post_id: string | null
}

interface RealtimeNotificationsProps {
  userId: string
}

export default function RealtimeNotifications({ userId }: RealtimeNotificationsProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`realtime-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as ToastNotification
          const toast: ToastNotification = {
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            post_id: n.post_id,
          }
          setToasts(prev => [toast, ...prev].slice(0, 4))
          // Auto-remove após 6s
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id))
          }, 6000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[320px] sm:w-[360px]">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-start gap-3 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-4 duration-300"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid rgba(91,79,232,0.25)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-accent-dim)' }}
          >
            <Bell size={16} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink leading-tight">{toast.title}</p>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{toast.message}</p>
            {toast.post_id && (
              <Link
                href={`/posts/${toast.post_id}`}
                className="text-xs font-semibold mt-1.5 inline-block"
                style={{ color: 'var(--color-accent)' }}
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              >
                Ver post →
              </Link>
            )}
          </div>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="text-ink-muted hover:text-ink transition-colors shrink-0 mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
