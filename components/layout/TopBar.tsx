'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import type { Profile } from '@/types'

interface TopBarProps {
  profile: Profile | null
  unreadCount: number
}

export default function TopBar({ profile, unreadCount }: TopBarProps) {
  return (
    <header
      className="flex items-center justify-between px-6 py-3 bg-base shrink-0"
      style={{ borderBottom: '1px solid var(--color-border)', height: 56 }}
    >
      <div />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-panel transition-colors focus-ring">
          <Bell size={18} className="text-ink-muted" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
              style={{ background: 'var(--color-accent)', lineHeight: 1 }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--color-accent)' }}
          title={profile?.full_name}
        >
          {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  )
}
