'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Building2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { addWorkspaceMember, removeWorkspaceMember } from '@/lib/actions/workspaces'
import type { Workspace, WorkspaceMember, Profile, UserRole } from '@/types'
import { ROLE_LABELS, ROLE_COLORS } from '@/types'

interface WorkspaceManagerProps {
  workspaces: (Workspace & { members: WorkspaceMember[] })[]
  allUsers: Profile[]
}

export default function WorkspaceManager({ workspaces, allUsers }: WorkspaceManagerProps) {
  const [expanded, setExpanded] = useState<string | null>(workspaces[0]?.id ?? null)
  const [adding, setAdding] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('client')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleAdd(workspaceId: string) {
    if (!selectedUser) return
    setError('')
    startTransition(async () => {
      const res = await addWorkspaceMember(workspaceId, selectedUser, selectedRole)
      if (res.success) { setAdding(null); setSelectedUser('') }
      else setError(res.error ?? 'Erro ao adicionar')
    })
  }

  function handleRemove(workspaceId: string, userId: string) {
    startTransition(async () => { await removeWorkspaceMember(workspaceId, userId) })
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Building2 size={18} style={{ color: 'var(--color-accent)' }} />
        <div>
          <h2 className="font-semibold text-ink">Workspaces</h2>
          <p className="text-xs text-ink-muted mt-0.5">Cada cliente tem seu próprio workspace isolado</p>
        </div>
      </div>

      {workspaces.length === 0 && (
        <p className="text-sm text-ink-muted text-center py-6">
          Nenhum workspace. Cadastre clientes para gerar automaticamente.
        </p>
      )}

      {workspaces.map(ws => (
        <div key={ws.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-panel transition-colors"
            onClick={() => setExpanded(expanded === ws.id ? null : ws.id)}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: ws.client?.primary_color ?? 'var(--color-accent)' }}
              >
                {ws.client?.name?.[0]?.toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">{ws.name}</p>
                <p className="text-xs text-ink-muted">{ws.members.length} membro{ws.members.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {expanded === ws.id
              ? <ChevronUp size={16} className="text-ink-muted" />
              : <ChevronDown size={16} className="text-ink-muted" />}
          </button>

          {expanded === ws.id && (
            <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="pt-3 space-y-2">
                {ws.members.length === 0 && (
                  <p className="text-xs text-ink-muted py-2">Nenhum membro neste workspace.</p>
                )}
                {ws.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between gap-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                        style={{ background: 'var(--color-accent)' }}
                      >
                        {member.user?.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-ink font-medium">{member.user?.full_name}</p>
                        <p className="text-[11px] text-ink-muted">{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[member.role as UserRole] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[member.role as UserRole] ?? member.role}
                      </span>
                      <button
                        onClick={() => handleRemove(ws.id, member.user_id)}
                        disabled={isPending}
                        className="p-1 rounded-lg text-ink-muted hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {adding === ws.id ? (
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs font-semibold text-ink">Adicionar membro</p>
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={selectedUser}
                        onChange={e => setSelectedUser(e.target.value)}
                        className="h-9 px-3 rounded-lg border border-border bg-base text-sm flex-1 min-w-0"
                      >
                        <option value="">Selecione usuário...</option>
                        {allUsers
                          .filter(u => !ws.members.some(m => m.user_id === u.id))
                          .map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                      </select>
                      <select
                        value={selectedRole}
                        onChange={e => setSelectedRole(e.target.value as UserRole)}
                        className="h-9 px-3 rounded-lg border border-border bg-base text-sm"
                      >
                        <option value="client">Cliente</option>
                        <option value="social_media">Social Media</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdd(ws.id)}
                        disabled={!selectedUser || isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: 'var(--color-accent)' }}
                      >
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        Adicionar
                      </button>
                      <button
                        onClick={() => { setAdding(null); setSelectedUser(''); setError('') }}
                        className="px-3 py-1.5 rounded-lg text-xs border border-border text-ink-muted hover:text-ink"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAdding(ws.id); setSelectedUser(''); setError('') }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed transition-colors hover:bg-panel"
                    style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
                  >
                    <Plus size={12} /> Adicionar membro
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
