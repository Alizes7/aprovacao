'use client'

import { useTransition } from 'react'
import { CheckCheck } from 'lucide-react'
import { markAllNotificationsRead } from '@/lib/actions/notifications'

export default function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(async () => { await markAllNotificationsRead() })}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-panel transition-colors disabled:opacity-50"
    >
      <CheckCheck size={14} />
      {isPending ? 'Marcando...' : 'Marcar todas como lidas'}
    </button>
  )
}
