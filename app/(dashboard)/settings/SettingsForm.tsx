// app/(dashboard)/settings/SettingsForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface SettingsFormProps {
  profile: Profile | null
}

export default function SettingsForm({ profile }: SettingsFormProps) {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    startTransition(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone || null })
        .eq('id', profile!.id)
      if (error) setError(error.message)
      else setSuccess(true)
    })
  }

  const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-base text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
  const labelCls = "block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5"

  return (
    <div className="card p-6 space-y-5">
      <h2 className="font-semibold text-ink">Meu perfil</h2>
      {success && (
        <div className="px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          Perfil atualizado com sucesso!
        </div>
      )}
      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-0000"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input
            type="email"
            value={profile?.email ?? ''}
            disabled
            className={`${inputCls} opacity-50 cursor-not-allowed`}
          />
          <p className="text-xs text-ink-muted mt-1">O e-mail não pode ser alterado aqui.</p>
        </div>
        <div>
          <label className={labelCls}>Perfil de acesso</label>
          <div className="h-10 px-3 rounded-lg border border-border bg-panel flex items-center text-sm text-ink-soft">
            {profile?.role === 'admin' ? '🔑 Administrador' : profile?.role === 'client' ? '👤 Cliente' : '👁 Visualizador'}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90"
            style={{ background: 'var(--color-accent)' }}
          >
            {isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
