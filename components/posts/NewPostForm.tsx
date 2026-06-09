'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ImageIcon, FileText, Film, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { createPost } from '@/lib/actions/posts'
import { uploadPostFile, deletePostFile } from '@/lib/actions/files'
import type { PostFormat, SocialNetwork, PostPriority } from '@/types'
import { POST_FORMAT_LABELS, SOCIAL_NETWORK_LABELS, POST_PRIORITY_LABELS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/types'

type ClientOption = { id: string; name: string; primary_color: string; logo_url: string | null }

interface NewPostFormProps {
  clients: ClientOption[]
  defaultClientId?: string
  userId: string
}

interface UploadedFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  preview?: string
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <ImageIcon size={15} className="text-blue-400" />
  if (type.startsWith('video/')) return <Film size={15} className="text-purple-400" />
  return <FileText size={15} className="text-red-400" />
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function NewPostForm({ clients, defaultClientId, userId }: NewPostFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [createdPostId, setCreatedPostId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    client_id: defaultClientId ?? '',
    title: '',
    format: 'post_unico' as PostFormat,
    social_network: 'instagram' as SocialNetwork,
    priority: 'media' as PostPriority,
    scheduled_date: '',
    approval_deadline: '',
    caption: '',
    hashtags: '',
    cta: '',
    notes: '',
    responsible_id: userId,
  })

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const processFile = useCallback(async (file: File, postId: string, idx: number) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'error', error: 'Tipo não permitido' } : f))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'error', error: 'Arquivo excede 50MB' } : f))
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('post_id', postId)
    formData.append('carousel_order', String(idx))
    const result = await uploadPostFile(formData)
    setFiles(prev => prev.map((f, i) => i === idx
      ? result.success
        ? { ...f, status: 'done', id: result.data!.id, url: result.data!.url }
        : { ...f, status: 'error', error: result.error ?? 'Erro no upload' }
      : f
    ))
  }, [])

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return
    const newFiles: UploadedFile[] = Array.from(incoming).map(file => ({
      id: '',
      name: file.name,
      url: '',
      type: file.type,
      size: file.size,
      status: 'uploading' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    setFiles(prev => {
      const startIdx = prev.length
      if (createdPostId) {
        Array.from(incoming).forEach((file, i) => processFile(file, createdPostId, startIdx + i))
      }
      return [...prev, ...newFiles]
    })
  }, [createdPostId, processFile])

  const handleRemove = async (idx: number) => {
    const file = files[idx]
    if (file.id) await deletePostFile(file.id)
    if (file.preview) URL.revokeObjectURL(file.preview)
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  // Step 1: create post → Step 2: upload files → Step 3: navigate
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.client_id) return setError('Selecione um cliente.')
    if (!form.title.trim()) return setError('Título é obrigatório.')

    startTransition(async () => {
      // Create post first
      const result = await createPost({
        client_id: form.client_id,
        title: form.title,
        format: form.format,
        social_network: form.social_network,
        priority: form.priority,
        scheduled_date: form.scheduled_date || undefined,
        approval_deadline: form.approval_deadline || undefined,
        caption: form.caption || undefined,
        hashtags: form.hashtags || undefined,
        cta: form.cta || undefined,
        notes: form.notes || undefined,
        responsible_id: userId,
      })

      if (!result.success || !result.data) {
        setError(result.error ?? 'Erro ao criar post')
        return
      }

      const postId = result.data.id
      setCreatedPostId(postId)

      // Upload pending files (if user dropped before saving)
      const pendingFiles = files.filter(f => f.status === 'uploading' && !f.id)
      if (pendingFiles.length > 0) {
        // Re-trigger uploads with real postId
        const allFiles = Array.from(inputRef.current?.files ?? [])
        await Promise.all(
          allFiles.map((file, i) => processFile(file, postId, i))
        )
      }

      router.push(`/posts/${postId}`)
    })
  }

  const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-base text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
  const selectCls = inputCls + " cursor-pointer"
  const labelCls = "block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Informações básicas ── */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-ink">Informações básicas</h2>

        <div>
          <label className={labelCls}>Cliente *</label>
          <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className={selectCls} required>
            <option value="">Selecione um cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Título interno *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Ex: Post de lançamento - Coleção Verão 2025"
            className={inputCls}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Formato</label>
            <select value={form.format} onChange={e => set('format', e.target.value as PostFormat)} className={selectCls}>
              {Object.entries(POST_FORMAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Rede social</label>
            <select value={form.social_network} onChange={e => set('social_network', e.target.value as SocialNetwork)} className={selectCls}>
              {Object.entries(SOCIAL_NETWORK_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Prioridade</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value as PostPriority)} className={selectCls}>
              {Object.entries(POST_PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Data de publicação</label>
            <input type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Prazo de aprovação</label>
            <input type="datetime-local" value={form.approval_deadline} onChange={e => set('approval_deadline', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Arquivos / Imagens ── */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-ink">Arquivos do post</h2>
          <p className="text-xs text-ink-muted mt-0.5">Imagens, vídeos ou PDFs que serão apresentados ao cliente para aprovação</p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
          style={{
            borderColor: isDragging ? 'var(--color-accent)' : 'var(--color-border)',
            background: isDragging ? 'var(--color-accent-dim)' : 'var(--color-surface)',
          }}
        >
          <Upload size={24} className="mx-auto mb-2 text-ink-muted" />
          <p className="text-sm font-medium text-ink">
            {isDragging ? 'Solte os arquivos aqui' : 'Clique ou arraste arquivos aqui'}
          </p>
          <p className="text-xs text-ink-muted mt-1">PNG, JPG, WEBP, PDF, MP4 — máx. 50MB cada</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={e => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Preview grid for images */}
        {files.some(f => f.preview) && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {files.filter(f => f.preview).map((file, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-panel">
                <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleRemove(files.indexOf(file)) }}
                    className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
                <div className="absolute bottom-1 right-1">
                  {file.status === 'uploading' && <Loader2 size={14} className="text-white animate-spin" />}
                  {file.status === 'done' && <CheckCircle size={14} className="text-green-400" />}
                  {file.status === 'error' && <AlertCircle size={14} className="text-red-400" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Non-image file list */}
        {files.filter(f => !f.preview).length > 0 && (
          <div className="space-y-2">
            {files.filter(f => !f.preview).map((file, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-surface">
                <div className="w-9 h-9 rounded bg-panel flex items-center justify-center shrink-0">
                  <FileIcon type={file.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{file.name}</p>
                  <p className="text-xs text-ink-muted">{formatSize(file.size)}</p>
                  {file.error && <p className="text-xs text-red-500">{file.error}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {file.status === 'uploading' && <Loader2 size={15} className="text-accent animate-spin" />}
                  {file.status === 'done' && <CheckCircle size={15} className="text-green-500" />}
                  {file.status === 'error' && <AlertCircle size={15} className="text-red-500" />}
                  <button type="button" onClick={() => handleRemove(files.indexOf(file))} className="p-1 rounded hover:bg-panel">
                    <X size={13} className="text-ink-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length === 0 && (
          <p className="text-xs text-ink-muted text-center">Nenhum arquivo selecionado — você também pode adicionar depois.</p>
        )}
      </div>

      {/* ── Conteúdo ── */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-ink">Conteúdo</h2>

        <div>
          <label className={labelCls}>Legenda</label>
          <textarea
            value={form.caption}
            onChange={e => set('caption', e.target.value)}
            placeholder="Texto completo da legenda do post..."
            rows={5}
            className="w-full px-3 py-2 rounded-lg border border-border bg-base text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className={labelCls}>Hashtags</label>
          <input
            type="text"
            value={form.hashtags}
            onChange={e => set('hashtags', e.target.value)}
            placeholder="#marketing #digital #instagram"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>CTA (Call to Action)</label>
          <input
            type="text"
            value={form.cta}
            onChange={e => set('cta', e.target.value)}
            placeholder="Ex: Clique no link da bio para saber mais!"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Observações internas</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Notas internas para a equipe..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-base text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted">
          {files.some(f => f.status === 'uploading')
            ? '⏳ Fazendo upload dos arquivos...'
            : files.filter(f => f.status === 'done').length > 0
            ? `✅ ${files.filter(f => f.status === 'done').length} arquivo(s) prontos`
            : ''}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-panel transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 flex items-center gap-2"
            style={{ background: 'var(--color-accent)' }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? 'Criando...' : 'Criar post'}
          </button>
        </div>
      </div>
    </form>
  )
}
