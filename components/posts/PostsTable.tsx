'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge, PriorityBadge, NetworkBadge } from '@/components/ui/Badge'
import { ExternalLink } from 'lucide-react'
import type { Post } from '@/types'
import { POST_FORMAT_LABELS } from '@/types'

interface PostsTableProps {
  posts: Post[]
}

export default function PostsTable({ posts }: PostsTableProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-muted text-sm">Nenhum post encontrado.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Título', 'Cliente', 'Formato', 'Rede', 'Status', 'Prioridade', 'Prazo', 'Ações'].map(h => (
              <th key={h} className="text-left px-2 py-2 text-xs font-semibold text-ink-muted uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr
              key={post.id}
              className="border-b border-border hover:bg-surface transition-colors"
            >
              <td className="px-2 py-3 max-w-[200px]">
                <p className="font-medium text-ink truncate">{post.title}</p>
              </td>
              <td className="px-2 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {post.client?.logo_url ? (
                    <img src={post.client.logo_url} alt="" className="w-5 h-5 rounded object-contain" />
                  ) : (
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: post.client?.primary_color ?? 'var(--color-accent)' }}
                    >
                      {post.client?.name?.[0]}
                    </div>
                  )}
                  <span className="text-ink-soft truncate max-w-[100px]">{post.client?.name}</span>
                </div>
              </td>
              <td className="px-2 py-3 whitespace-nowrap text-ink-muted">
                {POST_FORMAT_LABELS[post.format]}
              </td>
              <td className="px-2 py-3">
                <NetworkBadge network={post.social_network} />
              </td>
              <td className="px-2 py-3">
                <StatusBadge status={post.status} />
              </td>
              <td className="px-2 py-3">
                <PriorityBadge priority={post.priority} />
              </td>
              <td className="px-2 py-3 whitespace-nowrap text-ink-muted">
                {post.approval_deadline
                  ? formatDistanceToNow(new Date(post.approval_deadline), { addSuffix: true, locale: ptBR })
                  : '—'}
              </td>
              <td className="px-2 py-3">
                <Link
                  href={`/posts/${post.id}`}
                  className="inline-flex items-center gap-1 text-accent hover:underline text-xs font-medium"
                >
                  Ver <ExternalLink size={11} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
