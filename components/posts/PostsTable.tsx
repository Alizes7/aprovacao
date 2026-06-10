'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge, PriorityBadge, NetworkBadge } from '@/components/ui/Badge'
import { ExternalLink, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletePost } from '@/lib/actions/posts'
import type { Post, Profile } from '@/types'
import { POST_FORMAT_LABELS } from '@/types'

interface PostsTableProps {
  posts: Post[]
  profile?: Profile | null
}

function DeleteInlineButton({ post }: { post: Post }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  if (post.status === 'publicado') return null

  function handleDelete() {
    setError('')
    startTransition(async () => {
      const res = await deletePost(post.id)
      if (res.success) {
        setShowModal(false)
        router.refresh()
      } else {
        setError(res.error ?? 'Erro ao excluir')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
        title="Excluir post"
        style={{ color: '#EF4444', opacity: 0.7 }}
      >
        <Trash2 size={13} />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-1 rounded-lg text-ink-muted hover:text-ink transition-colors">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#EF444420' }}>
                <AlertTriangle size={20} style={{ color: '#EF4444' }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Excluir post?</h3>
                <p className="text-xs text-ink-muted mt-0.5">Essa ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-ink-soft mb-5">
              Excluir permanentemente{' '}
              <span className="font-semibold text-ink">"{post.title}"</span>{' '}
              e todos os seus arquivos, comentários e histórico?
            </p>
            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg text-sm text-red-400 bg-red-500/10 border border-red-500/20">{error}</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#EF4444' }}>
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function PostsTable({ posts, profile }: PostsTableProps) {
  const isAdmin = profile?.role === 'admin'

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
                <div className="flex items-center gap-1">
                  <Link
                    href={`/posts/${post.id}`}
                    className="inline-flex items-center gap-1 text-accent hover:underline text-xs font-medium p-1.5 rounded-lg hover:bg-panel transition-colors"
                  >
                    Ver <ExternalLink size={11} />
                  </Link>
                  {isAdmin && <DeleteInlineButton post={post} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
