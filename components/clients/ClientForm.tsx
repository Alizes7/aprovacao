'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { createNewClient, updateClient, uploadClientLogo } from '@/lib/actions/clients'
import type { Client } from '@/types'

interface ClientFormProps {
  client?: Client
}

const COLORS = [
  '#5B4FE8', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#1C3A5A',
  '#E07830', '#4CAF50', '#0D9488', '#7C3AED',
]

export default function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState(client?.logo_url ?? '')
  const logoRef = useRef<HTMLInputElement>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: client?.name ?? '',
    segment: client?.segment ?? '',
    responsible: client?.responsible ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    notes: client?.notes ?? '',
    primary_color: client?.primary_color ?? '#5B4FE8',
    is_active: client?.is_active ?? true,
  })

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoPreview(URL.createObjectURL(file))

    const targetId = createdId ?? client?.id
    if (!targetId) return

    const fd = new FormData()
    fd.append('file', file)
    await uploadClientLogo(targetId, fd)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Nome é obrigatório.')

    startTransition(async () => {
      if (client) {
        const result = await updateClient({ id: client.id, ...form })
        if (result.success) router.push('/clients')
        else setError(result.error ?? 'Erro ao atualizar cliente')
      } else {
        const result = await createNewClient(form)
        if (result.success && result.data) {
          setCreatedId(result.data.id)
          // Upload logo if selected
          if (logoRef.current?.files?.[0]) {
            const fd = new FormData()
            fd.append('file', logoRef.current.files[0])
            await uploadClientLogo(result.data.id, fd)
          }
          router.push('/clients')
        } else {
          setError(result.error ?? 'Erro ao criar cliente')
        }
      }
    })
  }

  const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-base text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
  const labelCls = "block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-ink">Dados do cliente</h2>

        {/* Logo upload */}
        <div>
          <label className={labelCls}>Logo</label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-accent transition-colors"
              onClick={() => logoRef.current?.click()}
              style={{ background: logoPreview ? undefined : form.primary_color + '20' }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <Upload size={16} className="mx-auto text-ink-muted" />
                  <span className="text-[10px] text-ink-muted">Logo</span>
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="text-sm text-accent hover:underline"
              >
                {logoPreview ? 'Alterar logo' : 'Fazer upload do logo'}
              </button>
              <p className="text-xs text-ink-muted mt-0.5">PNG, JPG ou WEBP — máx. 5MB</p>
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className={labelCls}>Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Nome da empresa ou cliente"
            className={inputCls}
            required
          />
        </div>

        {/* Segment + Responsible */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Segmento</label>
            <input
              type="text"
              value={form.segment}
              onChange={e => set('segment', e.target.value)}
              placeholder="Ex: Advocacia, Alimentação..."
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Responsável</label>
            <input
              type="text"
              value={form.responsible}
              onChange={e => set('responsible', e.target.value)}
              placeholder="Nome do contato"
              className={inputCls}
            />
          </div>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="contato@empresa.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="(11) 99999-0000"
              className={inputCls}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Observações</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Informações adicionais sobre o cliente..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-base text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Color */}
        <div>
          <label className={labelCls}>Cor principal</label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => set('primary_color', color)}
                className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                style={{
                  background: color,
                  outline: form.primary_color === color ? `3px solid ${color}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
            <input
              type="color"
              value={form.primary_color}
              onChange={e => set('primary_color', e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-border"
              title="Cor personalizada"
            />
            <span className="text-xs text-ink-muted font-mono">{form.primary_color}</span>
          </div>
        </div>

        {/* Active toggle */}
        {client && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => set('is_active', !form.is_active)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: form.is_active ? 'var(--color-accent)' : 'var(--color-border-strong)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: form.is_active ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
            <span className="text-sm font-medium text-ink">
              {form.is_active ? 'Cliente ativo' : 'Cliente inativo'}
            </span>
          </div>
        )}
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
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90"
          style={{ background: 'var(--color-accent)' }}
        >
          {isPending
            ? client ? 'Salvando...' : 'Criando...'
            : client ? 'Salvar alterações' : 'Criar cliente'}
        </button>
      </div>
    </form>
  )
}
