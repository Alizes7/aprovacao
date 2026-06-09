'use client'

import { useState, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Send, CornerDownRight, Trash2 } from 'lucide-react'
import { createComment, deleteComment } from '@/lib/actions/comments'
import type { Comment, Profile } from '@/types'

interface CommentsSectionProps {
  postId: string
  versionId?: string
  comments: Comment[]
  profile: Profile
}

export default function CommentsSection({ postId, versionId, comments, profile }: CommentsSectionProps) {
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const canComment = profile.role !== 'viewer'

  function handleSubmit() {
    if (!content.trim()) return
    startTransition(async () => {
      await createComment({ post_id: postId, version_id: versionId, content })
      setContent('')
    })
  }

  function handleReply(parentId: string) {
    if (!replyContent.trim()) return
    startTransition(async () => {
      await createComment({ post_id: postId, version_id: versionId, content: replyContent, parent_id: parentId })
      setReplyContent('')
      setReplyTo(null)
    })
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId, postId)
    })
  }

  return (
    <div className="space-y-4">
      {/* New comment box */}
      {canComment && (
        <div className="flex gap-3">
          <Avatar name={profile.full_name} size="sm" />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
              }}
              placeholder="Escreva um comentário… (Ctrl+Enter para enviar)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-base text-ink resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-ink-muted">Ctrl+Enter para enviar</span>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-accent)' }}
              >
                <Send size={12} />
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-6">Nenhum comentário ainda.</p>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={profile.id}
              isAdmin={profile.role === 'admin'}
              canComment={canComment}
              replyTo={replyTo}
              replyContent={replyContent}
              isPending={isPending}
              onReplyToggle={id => {
                setReplyTo(replyTo === id ? null : id)
                setReplyContent('')
              }}
              onReplyChange={setReplyContent}
              onReplySubmit={handleReply}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  currentUserId: string
  isAdmin: boolean
  canComment: boolean
  replyTo: string | null
  replyContent: string
  isPending: boolean
  onReplyToggle: (id: string) => void
  onReplyChange: (v: string) => void
  onReplySubmit: (parentId: string) => void
  onDelete: (id: string) => void
}

function CommentItem({
  comment, currentUserId, isAdmin, canComment,
  replyTo, replyContent, isPending,
  onReplyToggle, onReplyChange, onReplySubmit, onDelete,
}: CommentItemProps) {
  const isOwn = comment.user_id === currentUserId
  const canDelete = isOwn || isAdmin

  return (
    <div className="flex gap-3">
      <Avatar name={comment.user?.full_name ?? '?'} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink">{comment.user?.full_name}</span>
            {comment.user?.role === 'client' && (
              <span className="badge bg-blue-50 text-blue-600 text-[10px]">Cliente</span>
            )}
            {comment.is_system && (
              <span className="badge bg-amber-50 text-amber-600 text-[10px]">Ajuste solicitado</span>
            )}
            {comment.version && (
              <span className="text-[10px] text-ink-muted">v{comment.version.version_num}</span>
            )}
          </div>
          <span className="text-[11px] text-ink-muted whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>

        <p className={`text-sm mt-1 leading-relaxed ${comment.is_system ? 'text-amber-700 bg-amber-50 px-3 py-2 rounded-lg' : 'text-ink-soft'}`}>
          {comment.content}
        </p>

        <div className="flex items-center gap-3 mt-1.5">
          {canComment && (
            <button
              onClick={() => onReplyToggle(comment.id)}
              className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-accent transition-colors"
            >
              <CornerDownRight size={11} />
              Responder
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-danger transition-colors"
            >
              <Trash2 size={11} />
              Excluir
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyTo === comment.id && canComment && (
          <div className="mt-2 flex gap-2">
            <textarea
              value={replyContent}
              onChange={e => onReplyChange(e.target.value)}
              placeholder="Escreva uma resposta..."
              rows={2}
              autoFocus
              className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-base text-ink resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => onReplySubmit(comment.id)}
                disabled={!replyContent.trim() || isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--color-accent)' }}
              >
                <Send size={12} />
              </button>
              <button
                onClick={() => onReplyToggle(comment.id)}
                className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-panel"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
            {comment.replies.map(reply => (
              <div key={reply.id} className="flex gap-2">
                <Avatar name={reply.user?.full_name ?? '?'} size="xs" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink">{reply.user?.full_name}</span>
                    <span className="text-[10px] text-ink-muted">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft mt-0.5 leading-relaxed">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'xs' | 'sm' }) {
  const dim = size === 'xs' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ background: stringToColor(name) }}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#5B4FE8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899']
  return colors[Math.abs(hash) % colors.length]
}
