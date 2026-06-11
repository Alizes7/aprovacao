import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase/server'
import { listPosts } from '@/lib/actions/posts'
import PostsTable from '@/components/posts/PostsTable'
import PostFilters from '@/components/posts/PostFilters'
import { hasPermission } from '@/types'

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
    .select('*')
    .eq('id', user!.id)
    .single()

  const role = profile?.role ?? 'viewer'
  const isClientRole = role === 'client' || role === 'viewer'

  // Descobrir clientes acessíveis
  let clients: { id: string; name: string }[] = []
  if (isClientRole) {
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace:workspaces(client:clients(id, name))')
      .eq('user_id', user!.id)
    clients = memberships
      ?.map((m: any) => m.workspace?.client)
      .filter(Boolean) ?? []
  } else {
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    clients = allClients ?? []
  }

  // Se cliente tem só 1 workspace → força o filtro automaticamente
  // sem precisar ele clicar em nada
  const autoClientId = isClientRole && clients.length === 1
    ? clients[0].id
    : params.client_id

  const { data: posts } = await listPosts({
    client_id: autoClientId,
    status: params.status as any,
    format: params.format,
    social_network: params.social_network,
    priority: params.priority,
    search: params.search,
  })

  // Título da página: nome do cliente se for filtrado automaticamente
  const autoClientName = isClientRole && clients.length === 1
    ? clients[0].name
    : null

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Posts</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {autoClientName
              ? `${autoClientName} · ${posts?.length ?? 0} posts`
              : `${posts?.length ?? 0} posts encontrados`}
          </p>
        </div>
        {hasPermission(role, 'canCreatePost') && (
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

      {/* Filtro de clientes: oculto se cliente tem só 1 workspace */}
      <PostFilters
        clients={clients.length > 1 ? clients : []}
        currentParams={params}
      />

      <div className="card p-6">
        <PostsTable posts={posts ?? []} profile={profile} />
      </div>
    </div>
  )
}
