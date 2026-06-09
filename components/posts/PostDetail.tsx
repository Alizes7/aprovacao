'use client'

import { useState, useTransition } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCircle, AlertTriangle, Download, Copy, ChevronLeft, ChevronRight,
  Clock, User, Tag, Send, FileText, History, MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { StatusBadge, PriorityBadge, NetworkBadge } from '@/components/ui/Badge'
import CommentsSection from '@/components/comments/CommentsSection'
import FileUpload from '@/components/files/FileUpload'
import { approvePost, requestAdjustment, sendForApproval, updatePostStatus } from '@/lib/actions/posts'
import { POST_FORMAT_LABELS, POST_STATUS_LABELS } from '@/types'
import type { Post, Profile, Comment, PostVersion, Approval, ActionLog } from '@/types'

interface PostDetailProps {
  post: Post
  profile: Profile & { client_users?: { client_id: string; role: string }[] }
  comments: Comment[]
  versions: PostVersion[]
  approvals: Approval[]
  logs: ActionLog[]
}

export default function PostDetail({ post, profile, comments, versions, approvals, logs }: PostDetailProps) {
  const [currentFileIdx, setCurrentFileIdx] = useState(0)
  const [adjustmentComment, setAdjustmentComment] = useState('')
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'comments' | 'versions' | 'approvals' | 'logs'>('comments')
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const isAdmin = profile.role === 'admin'
  const isClient = profile.client_users?.some(
    cu => cu.client_id === post.client_id && cu.role === 'client'
  )

  const canApprove = isClient && ['enviado_aprovacao', 'aguardando_cliente', 'reenviado_aprovacao'].includes(post.status)
  const canSendForApproval = isAdmin && ['rascunho', 'em_ajuste', 'ajustes_solicitados'].includes(post.status)

  const files = post.files ?? []
  const currentFile = files[currentFileIdx]
  const isImage = currentFile?.mime_type?.startsWith('image/')
  const isVideo = currentFile?.mime_type?.startsWith('video/')
  const isPdf = currentFile?.mime_type === 'application/pdf'

  const currentVersion = versions[0]

  function handleCopyCaption() {
    const text = `${post.caption ?? ''}\n\n${post.hashtags ?? ''}`
    navigator.clipboard.writeText(text.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleApprove() {
    if (!currentVersion) return
    startTransition(async () => {
      await approvePost({ post_id: post.id, version_id: currentVersion.id })
    })
  }

  function handleAdjustment() {
    if (!adjustmentComment.trim() || !currentVersion) return
    startTransition(async () => {
      await requestAdjustment({
        post_id: post.id,
        version_id: currentVersion.id,
        comment: adjustmentComment,
      })
      setShowAdjustmentModal(false)
      setAdjustmentComment('')
    })
  }

  function handleSendForApproval() {
    startTransition(async () => {
      await sendForApproval(post.id)
    })
  }

  const TABS = [
    { id: 'comments' as const, label: 'Comentários', icon: MessageSquare, count: comments.length },
    { id: 'versions' as const, label: 'Versões', icon: History, count: versions.length },
    { id: 'approvals' as const, label: 'Aprovações', icon: CheckCircle, count: approvals.length },
    { id: 'logs' as const, label: 'Histórico', icon: FileText, count: logs.length },
  ]

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/posts" className="p-1.5 rounded-lg hover:bg-panel transition-colors">
          <ChevronLeft size={18} className="text-ink-muted" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-ink truncate">{post.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={post.status} />
            <PriorityBadge priority={post.priority} />
            <NetworkBadge network={post.social_network} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: File Preview ────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card overflow-hidden">
            {/* Main preview */}
            <div
              className="flex items-center justify-center bg-panel"
              style={{ minHeight: 320 }}
            >
              {currentFile ? (
                <>
                  {isImage && (
                    <img
                      src={currentFile.public_url}
                      alt={currentFile.original_name}
                      className="max-h-[480px] max-w-full object-contain"
                    />
                  )}
                  {isVideo && (
                    <video
                      src={currentFile.public_url}
                      controls
                      className="max-h-[480px] max-w-full"
                    />
                  )}
                  {isPdf && (
                    <div className="text-center p-8">
                      <FileText size={40} className="mx-auto text-ink-muted mb-3" />
                      <p className="font-medium text-ink">{currentFile.original_name}</p>
                      <a
                        href={currentFile.public_url}
                        target="_blank"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                      >
                        Abrir PDF <Download size={13} />
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8">
                  <p className="text-ink-muted text-sm">Nenhum arquivo anexado</p>
                </div>
              )}
            </div>

            {/* Carousel navigation */}
            {files.length > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 border-t border-border">
                <button
                  onClick={() => setCurrentFileIdx(i => Math.max(0, i - 1))}
                  disabled={currentFileIdx === 0}
                  className="p-1 rounded disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {files.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentFileIdx(i)}
                      className="w-2 h-2 rounded-full transition-colors"
                      style={{ background: i === currentFileIdx ? 'var(--color-accent)' : 'var(--color-border-strong)' }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentFileIdx(i => Math.min(files.length - 1, i + 1))}
                  disabled={currentFileIdx === files.length - 1}
                  className="p-1 rounded disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="text-xs text-ink-muted ml-2">
                  {currentFileIdx + 1} / {files.length}
                </span>
              </div>
            )}

            {/* Download */}
            {currentFile && (
              <div className="px-4 pb-4 pt-2 border-t border-border">
                <a
                  href={currentFile.public_url}
                  download={currentFile.original_name}
                  className="inline-flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  <Download size={13} />
                  Baixar {currentFile.original_name}
                </a>
              </div>
            )}
          </div>

          {/* File upload (admin) */}
          {isAdmin && (
            <FileUpload postId={post.id} versionId={currentVersion?.id} />
          )}
        </div>

        {/* ── Right: Post Info ───────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 space-y-4">
            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <MetaItem icon={User} label="Cliente" value={post.client?.name} />
              <MetaItem icon={Tag} label="Formato" value={POST_FORMAT_LABELS[post.format]} />
              {post.scheduled_date && (
                <MetaItem
                  icon={Clock}
                  label="Data prevista"
                  value={format(new Date(post.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                />
              )}
              {post.approval_deadline && (
                <MetaItem
                  icon={Clock}
                  label="Prazo"
                  value={formatDistanceToNow(new Date(post.approval_deadline), { addSuffix: true, locale: ptBR })}
                />
              )}
            </div>

            <hr style={{ borderColor: 'var(--color-border)' }} />

            {/* Caption */}
            {post.caption && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Legenda</p>
                <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{post.caption}</p>
              </div>
            )}

            {post.hashtags && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Hashtags</p>
                <p className="text-sm text-accent font-mono">{post.hashtags}</p>
              </div>
            )}

            {post.cta && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">CTA</p>
                <p className="text-sm text-ink">{post.cta}</p>
              </div>
            )}

            {/* Copy caption button */}
            <button
              onClick={handleCopyCaption}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border border-border hover:bg-panel transition-colors"
            >
              <Copy size={14} />
              {copied ? 'Copiado!' : 'Copiar legenda'}
            </button>
          </div>

          {/* Action buttons */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Ações</p>

            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-success)' }}
              >
                <CheckCircle size={15} />
                Aprovar conteúdo
              </button>
            )}

            {canApprove && (
              <button
                onClick={() => setShowAdjustmentModal(true)}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                <AlertTriangle size={15} />
                Solicitar ajuste
              </button>
            )}

            {canSendForApproval && (
              <button
                onClick={handleSendForApproval}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-accent)' }}
              >
                <Send size={15} />
                Enviar para aprovação
              </button>
            )}

            {isAdmin && (
              <div>
                <p className="text-xs font-medium text-ink-muted mb-1.5 mt-2">Alterar status manualmente:</p>
                <select
                  className="w-full h-9 px-3 rounded-lg text-sm bg-base border border-border text-ink"
                  value={post.status}
                  onChange={e => {
                    startTransition(async () => {
                      await updatePostStatus(post.id, e.target.value as any)
                    })
                  }}
                >
                  {Object.entries(POST_STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Tabs ─────────────────────────────── */}
      <div className="card">
        <div className="flex border-b border-border px-4 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 py-3.5 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap mr-2 ${
                activeTab === id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <Icon size={14} />
              {label}
              <span className="badge bg-panel text-ink-muted text-[10px] px-1.5 py-0">{count}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'comments' && (
            <CommentsSection
              postId={post.id}
              versionId={currentVersion?.id}
              comments={comments}
              profile={profile}
            />
          )}

          {activeTab === 'versions' && (
            <div className="space-y-3">
              {versions.map(v => (
                <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    v{v.version_num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-ink">Versão {v.version_num}</span>
                      <span className={`badge ${
                        v.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                        v.status === 'ajustes_solicitados' ? 'bg-orange-100 text-orange-700' :
                        'bg-panel text-ink-muted'
                      }`}>
                        {v.status}
                      </span>
                      {v.version_num === post.current_version_num && (
                        <span className="badge bg-accent-dim text-accent">Atual</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      por {(v as any).created_by_profile?.full_name ?? 'Sistema'} —{' '}
                      {format(new Date(v.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {v.notes && <p className="text-xs text-ink-soft mt-1">{v.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-3">
              {approvals.length === 0 ? (
                <p className="text-sm text-ink-muted">Nenhuma aprovação registrada.</p>
              ) : approvals.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                  <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      Aprovado por {(a as any).approved_by_profile?.full_name}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Versão {(a as any).version?.version_num} —{' '}
                      {format(new Date(a.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {a.notes && <p className="text-xs text-ink-soft mt-1">{a.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-2 text-sm py-2 border-b border-border last:border-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: 'var(--color-accent)' }}
                  />
                  <div className="flex-1">
                    <span className="text-ink-soft">{log.description}</span>
                    <span className="text-ink-muted text-xs ml-2">
                      — {(log as any).user?.full_name ?? 'Sistema'},{' '}
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 w-full max-w-md animate-in">
            <h3 className="text-lg font-bold text-ink mb-1">Solicitar ajuste</h3>
            <p className="text-sm text-ink-muted mb-4">Descreva o que precisa ser ajustado. Este comentário será enviado para a equipe.</p>
            <textarea
              value={adjustmentComment}
              onChange={e => setAdjustmentComment(e.target.value)}
              placeholder="Ex: Alterar a cor do texto no slide 2, revisar legenda..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-base text-ink resize-none focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAdjustment}
                disabled={!adjustmentComment.trim() || isPending}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--color-accent)' }}
              >
                Enviar solicitação
              </button>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-panel"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetaItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <Icon size={12} className="text-ink-muted shrink-0" />
        <span className="text-sm text-ink truncate">{value}</span>
      </div>
    </div>
  )
}
