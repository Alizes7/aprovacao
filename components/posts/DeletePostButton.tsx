'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react'
import { deletePost } from '@/lib/actions/posts'

interface DeletePostButtonProps {
  postId: string
  postTitle: string
  postStatus: string
}

// Posts publicados não podem ser excluídos (regra do backend também)
const UNDELETABLE = ['publicado']

export default function DeletePostButton({ postId, postTitle, postStatus }: DeletePostButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  if (UNDELETABLE.includes(postStatus)) return null

  function handleDelete() {
    setError('')
    startTransition(async () => {
      const res = await deletePost(postId)
      if (res.success) {
        setShowModal(false)
        router.push('/posts')
        router.refresh()
      } else {
        setError(res.error ?? 'Erro ao excluir post')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-50"
        style={{ borderColor: '#EF444440', color: '#EF4444' }}
      >
        <Trash2 size={14} />
        Excluir post
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-ink-muted hover:text-ink transition-colors"
            >
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
              Você está prestes a excluir permanentemente o post{' '}
              <span className="font-semibold text-ink">"{postTitle}"</span>{' '}
              e todos os seus arquivos, comentários e histórico.
            </p>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg text-sm text-red-400 bg-red-500/10 border border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#EF4444' }}
              >
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
