'use client'

import { POST_STATUS_LABELS, POST_STATUS_COLORS, POST_PRIORITY_LABELS, POST_PRIORITY_COLORS } from '@/types'
import type { PostStatus, PostPriority } from '@/types'

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span className={`badge ${POST_STATUS_COLORS[status]}`}>
      {POST_STATUS_LABELS[status]}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: PostPriority }) {
  return (
    <span className={`badge ${POST_PRIORITY_COLORS[priority]}`}>
      {POST_PRIORITY_LABELS[priority]}
    </span>
  )
}

export function NetworkBadge({ network }: { network: string }) {
  const ICONS: Record<string, string> = {
    instagram: '📸',
    linkedin: '💼',
    facebook: '👤',
    tiktok: '🎵',
    youtube_shorts: '▶️',
    outra: '🌐',
  }
  const LABELS: Record<string, string> = {
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    youtube_shorts: 'YT Shorts',
    outra: 'Outra',
  }
  return (
    <span className="badge bg-panel text-ink-soft">
      {ICONS[network] ?? '🌐'} {LABELS[network] ?? network}
    </span>
  )
}
