import { createSupabaseServer } from '@/lib/supabase/server'
import SettingsForm from './SettingsForm'
import UserRoleManager from '@/components/settings/UserRoleManager'
import WorkspaceManager from '@/components/settings/WorkspaceManager'
import MonthlyReportPDF from '@/components/reports/MonthlyReportPDF'
import { listUsers } from '@/lib/actions/users'
import { listWorkspaces, getWorkspaceMembers } from '@/lib/actions/workspaces'

export default async function SettingsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'
  const canViewReports = isAdmin || profile?.role === 'social_media'

  let users = null
  let workspacesWithMembers = null
  let clients = null

  if (isAdmin) {
    const [usersRes, wsRes, clientsRes] = await Promise.all([
      listUsers(),
      listWorkspaces(),
      supabase.from('clients').select('id, name').eq('is_active', true).order('name'),
    ])

    users = usersRes.data

    // Para cada workspace, buscar membros
    if (wsRes.data) {
      workspacesWithMembers = await Promise.all(
        wsRes.data.map(async (ws) => {
          const membersRes = await getWorkspaceMembers(ws.id)
          return { ...ws, members: membersRes.data ?? [] }
        })
      )
    }

    clients = clientsRes.data
  } else if (canViewReports) {
    const clientsRes = await supabase.from('clients').select('id, name').eq('is_active', true).order('name')
    clients = clientsRes.data
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted mt-0.5">Gerencie seu perfil, usuários e workspaces</p>
      </div>

      <SettingsForm profile={profile} />

      {canViewReports && clients && clients.length > 0 && (
        <MonthlyReportPDF clients={clients} />
      )}

      {isAdmin && workspacesWithMembers && users && (
        <WorkspaceManager workspaces={workspacesWithMembers} allUsers={users} />
      )}

      {isAdmin && users && (
        <UserRoleManager users={users} currentUserId={user!.id} />
      )}
    </div>
  )
}
