import { getDashboardMetrics, listPosts } from '@/lib/actions/posts'
import DashboardCards from '@/components/dashboard/DashboardCards'
import PostsTable from '@/components/posts/PostsTable'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const [metricsResult, postsResult, profileResult] = await Promise.all([
    getDashboardMetrics(),
    listPosts(),
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
  ])

  const profile = profileResult.data

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted mt-0.5">Visão geral de todos os posts e aprovações</p>
      </div>
      <DashboardCards metrics={metricsResult.data} />
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">Posts Recentes</h2>
          <Link href="/posts" className="text-sm text-accent hover:underline">Ver todos</Link>
        </div>
        <PostsTable posts={postsResult.data?.slice(0, 10) ?? []} profile={profile} />
      </div>
    </div>
  )
}
