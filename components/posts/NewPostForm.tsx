'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPost } from '@/lib/actions/posts'
import type { PostFormat, SocialNetwork, PostPriority } from '@/types'
import {
  POST_FORMAT_LABELS, SOCIAL_NETWORK_LABELS, POST_PRIORITY_LABELS
} from '@/types'

type ClientOption = { id: string; name: string; primary_color: string; logo_url: string | null }

interface NewPostFormProps {
  clients: ClientOption[]
  defaultClientId?: string
  userId: string
}

export default function NewPostForm({ clients, defaultClientId, userId }: NewPostFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.client_id) return setError('Selecione um cliente.')
    if (!form.title.trim()) return setError('Título é obrigatório.')

    startTransition(async () => {
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
      if (result.success && result.data) {
        router.push(`/posts/${result.data.id}`)
      } else {
        setError(result.error ?? 'Erro ao criar post')
      }
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

      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-ink">Informações básicas</h2>

        {/* Client */}
        <div>
          <label className={labelCls}>Cliente *</label>
          <select
            value={form.client_id}
            onChange={e => set('client_id', e.target.value)}
            className={selectCls}
            required
          >
            <option value="">Selecione um cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Title */}
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

        {/* Format + Network */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Formato</label>
            <select value={form.format} onChange={e => set('format', e.target.value as PostFormat)} className={selectCls}>
              {Object.entries(POST_FORMAT_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Rede social</label>
            <select value={form.social_network} onChange={e => set('social_network', e.target.value as SocialNetwork)} className={selectCls}>
              {Object.entries(SOCIAL_NETWORK_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority + Dates */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Prioridade</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value as PostPriority)} className={selectCls}>
              {Object.entries(POST_PRIORITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Data de publicação</label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={e => set('scheduled_date', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Prazo de aprovação</label>
            <input
              type="datetime-local"
              value={form.approval_deadline}
              onChange={e => set('approval_deadline', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

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

      <div className="flex items-center justify-end gap-3">
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
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-accent)' }}
        >
          {isPending ? 'Criando...' : 'Criar post'}
        </button>
      </div>
    </form>
  )
}
