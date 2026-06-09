// app/(dashboard)/settings/UserManagement.tsx
'use client'

import { useState, useTransition } from 'react'
import { UserCheck, UserX, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types'

interface UserWithRelations extends Profile {
  client_users?: { client_id: string; role: string; client: { name: string } | null }[]
}

interface UserManagementProps {
  users: UserWithRelations[]
  clients: { id: string; name: string }[]
}

export default function UserManagement({ users, clients }: UserManagementProps) {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(null)
  const [newClientId, setNewClientId] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('client')

  async function updateRole(userId: string, role: UserRole) {
    startTransition(async () => {
      await supabase.from('profiles').update({ role }).eq('id', userId)
    })
  }

  async function toggleActive(userId: string, isActive: boolean) {
    startTransition(async () => {
      await supabase.from('profiles').update({ is_active: !isActive }).eq('id', userId)
    })
  }

  async function addClientLink() {
    if (!selectedUser || !newClientId) return
    startTransition(async () => {
      await supabase.from('client_users').upsert({
        user_id: selectedUser.id,
        client_id: newClientId,
        role: newRole,
      }, { onConflict: 'client_id,user_id' })
      setNewClientId('')
    })
  }

  async function removeClientLink(userId: string, clientId: string) {
    startTransition(async () => {
      await supabase.from('client_users')
        .delete()
        .eq('user_id', userId)
        .eq('client_id', clientId)
    })
  }

  return (
    <div className="card p-6 space-y-5">
      <h2 className="font-semibold text-ink">Gerenciar usuários</h2>
      <p className="text-sm text-ink-muted -mt-3">
        Defina os perfis de acesso e vincule usuários a clientes
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Usuário', 'E-mail', 'Perfil', 'Ativo', 'Clientes', 'Ações'].map(h => (
                <th key={h} className="text-left px-2 py-2 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border hover:bg-surface transition-colors">
                <td className="px-2 py-3 font-medium text-ink">{u.full_name}</td>
                <td className="px-2 py-3 text-ink-muted">{u.email}</td>
                <td className="px-2 py-3">
                  <select
                    defaultValue={u.role}
                    onChange={e => updateRole(u.id, e.target.value as UserRole)}
                    className="h-8 px-2 rounded-lg border border-border bg-base text-xs text-ink cursor-pointer"
                    disabled={isPending}
                  >
                    <option value="admin">Admin</option>
                    <option value="client">Cliente</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </td>
                <td className="px-2 py-3">
                  <button
                    onClick={() => toggleActive(u.id, u.is_active)}
                    disabled={isPending}
                    className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-success hover:bg-green-50' : 'text-ink-muted hover:bg-panel'}`}
                    title={u.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {u.is_active ? <UserCheck size={15} /> : <UserX size={15} />}
                  </button>
                </td>
                <td className="px-2 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.client_users?.map(cu => (
                      <span
                        key={cu.client_id}
                        className="inline-flex items-center gap-1 badge bg-panel text-ink-soft text-[10px]"
                      >
                        {cu.client?.name}
                        <button
                          onClick={() => removeClientLink(u.id, cu.client_id)}
                          className="hover:text-danger"
                        >
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <button
                    onClick={() => setSelectedUser(u === selectedUser ? null : u)}
                    className="text-xs text-accent hover:underline"
                  >
                    + Vincular
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Link client modal */}
      {selectedUser && (
        <div className="border border-accent/30 rounded-xl p-4 bg-accent-dim space-y-3">
          <p className="text-sm font-semibold text-ink">
            Vincular cliente a <span className="text-accent">{selectedUser.full_name}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            <select
              value={newClientId}
              onChange={e => setNewClientId(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-base text-sm flex-1"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as UserRole)}
              className="h-9 px-3 rounded-lg border border-border bg-base text-sm"
            >
              <option value="client">Cliente (pode aprovar)</option>
              <option value="viewer">Visualizador (só vê)</option>
            </select>
            <button
              onClick={addClientLink}
              disabled={!newClientId || isPending}
              className="h-9 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: 'var(--color-accent)' }}
            >
              <Plus size={14} />
              Vincular
            </button>
            <button
              onClick={() => setSelectedUser(null)}
              className="h-9 px-3 rounded-lg text-sm border border-border hover:bg-panel"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
