import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getDashboardMetrics, listPosts } from '@/lib/actions/posts'
import { getApprovalMetrics } from '@/lib/actions/reports'
import DashboardCards from '@/components/dashboard/DashboardCards'
import ApprovalMetrics from '@/components/dashboard/ApprovalMetrics'
import PostsTable from '@/components/posts/PostsTable'
import Link from 'next/link'
import { hasPermission } from '@/types'

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const role = profile?.role ?? 'viewer'
  const isClientRole = role === 'client' || role === 'viewer'
  const canViewReports = hasPermission(role, 'canViewReports')

  // Para client/viewer: descobrir o client_id do workspace automaticamente
  let autoClientId: string | undefined
  let autoClientName: string | undefined

  if (isClientRole) {
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace:workspaces(client:clients(id, name))')
      .eq('user_id', user.id)

    const clientsInWorkspace = memberships
      ?.map((m: any) => m.workspace?.client)
      .filter(Boolean) ?? []

    if (clientsInWorkspace.length === 1) {
      autoClientId = clientsInWorkspace[0].id
      autoClientName = clientsInWorkspace[0].name
    }
  }

  const [metricsResult, postsResult, approvalResult] = await Promise.all([
    getDashboardMetrics(),
    listPosts({ client_id: autoClientId }),
    canViewReports ? getApprovalMetrics() : Promise.resolve({ data: null, error: null, success: true }),
  ])

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          {isClientRole && autoClientName ? autoClientName : 'Dashboard'}
        </h1>
        <p className="text-sm text-ink-muted mt-0.5">
          {isClientRole
            ? `Olá, ${firstName} 👋 — veja abaixo seus posts`
            : `Olá, ${firstName} 👋`}
        </p>
      </div>

      <DashboardCards metrics={metricsResult.data} />

      {canViewReports && approvalResult.data && approvalResult.data.length > 0 && (
        <ApprovalMetrics metrics={approvalResult.data} />
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">
            {isClientRole ? 'Seus posts recentes' : 'Posts recentes'}
          </h2>
          <Link href="/posts" className="text-sm hover:underline" style={{ color: 'var(--color-accent)' }}>
            Ver todos
          </Link>
        </div>
        <PostsTable posts={postsResult.data?.slice(0, 10) ?? []} profile={profile} />
      </div>
    </div>
  )
}
