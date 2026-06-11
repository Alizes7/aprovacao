'use client'

import { useState, useTransition } from 'react'
import { Loader2, Shield, Check, Power } from 'lucide-react'
import { updateUserRole, toggleUserActive } from '@/lib/actions/users'
import type { Profile, UserRole } from '@/types'
import { ROLE_LABELS, ROLE_COLORS } from '@/types'

interface UserRoleManagerProps {
  users: Profile[]
  currentUserId: string
}

const ROLE_OPTIONS: { value: UserRole; description: string }[] = [
  { value: 'admin', description: 'Acesso total, incluindo excluir e gerenciar usuários' },
  { value: 'social_media', description: 'Cria, edita e envia posts — não pode excluir' },
  { value: 'client', description: 'Aprova ou reprova posts com comentários' },
  { value: 'viewer', description: 'Apenas visualiza, sem nenhuma ação' },
]

export default function UserRoleManager({ users, currentUserId }: UserRoleManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState<string | null>(null)

  function startEdit(user: Profile) {
    setEditingId(user.id)
    setSelectedRole(user.role)
    setError('')
  }

  function handleSave(userId: string) {
    setError('')
    startTransition(async () => {
      const res = await updateUserRole(userId, selectedRole)
      if (res.success) {
        setEditingId(null)
        setSuccessId(userId)
        setTimeout(() => setSuccessId(null), 2000)
      } else {
        setError(res.error ?? 'Erro ao atualizar')
      }
    })
  }

  function handleToggleActive(userId: string, current: boolean) {
    startTransition(async () => { await toggleUserActive(userId, !current) })
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <Shield size={18} style={{ color: 'var(--color-accent)' }} />
        <div>
          <h2 className="font-semibold text-ink">Permissões de Usuários</h2>
          <p className="text-xs text-ink-muted mt-0.5">Gerencie o nível de acesso de cada pessoa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {ROLE_OPTIONS.map(r => (
          <div key={r.value} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--color-panel)' }}>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 ${ROLE_COLORS[r.value]}`}>
              {ROLE_LABELS[r.value]}
            </span>
            <p className="text-xs text-ink-muted leading-relaxed">{r.description}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {users.map(user => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: editingId === user.id ? 'var(--color-panel)' : undefined,
              border: '1px solid var(--color-border)',
              opacity: user.is_active ? 1 : 0.5,
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ background: 'var(--color-accent)' }}
            >
              {user.full_name?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-ink truncate">{user.full_name}</p>
                {user.id === currentUserId && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}>Você</span>
                )}
                {!user.is_active && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-semibold">Inativo</span>
                )}
              </div>
              <p className="text-xs text-ink-muted truncate">{user.email}</p>
            </div>

            {editingId === user.id ? (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as UserRole)}
                  className="h-8 px-2 rounded-lg border border-border bg-base text-xs"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{ROLE_LABELS[r.value]}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleSave(user.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Salvar
                </button>
                <button onClick={() => { setEditingId(null); setError('') }} className="px-2 py-1.5 rounded-lg text-xs border border-border text-ink-muted hover:text-ink">
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                {successId === user.id && (
                  <span className="text-[11px] text-green-600 font-semibold flex items-center gap-1">
                    <Check size={11} /> Salvo
                  </span>
                )}
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
                {user.id !== currentUserId && (
                  <>
                    <button onClick={() => startEdit(user)} className="text-xs text-ink-muted hover:text-accent transition-colors underline underline-offset-2">
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      disabled={isPending}
                      className={`p-1 rounded-lg transition-colors ${user.is_active ? 'text-ink-muted hover:text-red-500' : 'text-green-600 hover:text-green-700'}`}
                      title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                    >
                      <Power size={13} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
    </div>
  )
}
