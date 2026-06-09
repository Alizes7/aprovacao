// app/(dashboard)/settings/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import SettingsForm from './SettingsForm'
import UserManagement from './UserManagement'

export default async function SettingsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  let users = null
  let clients = null

  if (isAdmin) {
    const [{ data: allUsers }, { data: allClients }] = await Promise.all([
      supabase.from('profiles').select('*, client_users(client_id, role, client:clients(name))').order('full_name'),
      supabase.from('clients').select('id, name').eq('is_active', true).order('name'),
    ])
    users = allUsers
    clients = allClients
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted mt-0.5">Gerencie seu perfil e usuários do sistema</p>
      </div>

      <SettingsForm profile={profile} />

      {isAdmin && users && clients && (
        <UserManagement users={users} clients={clients} />
      )}
    </div>
  )
}
