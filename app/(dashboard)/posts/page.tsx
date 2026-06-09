// app/(dashboard)/posts/page.tsx
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase/server'
import { listPosts } from '@/lib/actions/posts'
import PostsTable from '@/components/posts/PostsTable'
import PostFilters from '@/components/posts/PostFilters'

type SearchParams = {
  client_id?: string
  status?: string
  format?: string
  social_network?: string
  priority?: string
  search?: string
  [key: string]: string | undefined
}

export default async function PostsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const { data: posts } = await listPosts({
    client_id: params.client_id,
    status: params.status as any,
    format: params.format,
    social_network: params.social_network,
    priority: params.priority,
    search: params.search,
  })

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Posts</h1>
          <p className="text-sm text-ink-muted mt-0.5">{posts?.length ?? 0} posts encontrados</p>
        </div>
        {isAdmin && (
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-accent)' }}
          >
            <Plus size={16} />
            Novo post
          </Link>
        )}
      </div>

      <PostFilters clients={clients ?? []} currentParams={params} />

      <div className="card p-6">
        <PostsTable posts={posts ?? []} />
      </div>
    </div>
  )
}
