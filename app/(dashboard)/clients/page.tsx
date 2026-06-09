// app/(dashboard)/clients/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Building2, Mail, Phone, Pencil } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase/server'
import { listClients } from '@/lib/actions/clients'
import DeleteClientButton from '@/components/clients/DeleteClientButton'

interface SearchParams { search?: string; segment?: string }

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: clients } = await listClients({
    search: params.search,
    segment: params.segment,
  })

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Clientes</h1>
          <p className="text-sm text-ink-muted mt-0.5">{clients?.length ?? 0} clientes cadastrados</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90"
          style={{ background: 'var(--color-accent)' }}
        >
          <Plus size={16} />
          Novo cliente
        </Link>
      </div>

      {/* Search bar */}
      <div className="card p-4">
        <form className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Buscar clientes..."
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-base text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <input
            name="segment"
            defaultValue={params.segment}
            placeholder="Segmento"
            className="h-9 px-3 rounded-lg border border-border bg-base text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent w-36"
          />
          <button
            type="submit"
            className="h-9 px-4 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Clients grid */}
      {!clients || clients.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={32} className="mx-auto text-ink-faint mb-3" />
          <p className="font-medium text-ink">Nenhum cliente encontrado</p>
          <p className="text-sm text-ink-muted mt-1">Comece criando seu primeiro cliente</p>
          <Link
            href="/clients/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: 'var(--color-accent)' }}
          >
            <Plus size={15} />
            Criar cliente
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <div key={client.id} className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ background: client.primary_color ?? 'var(--color-accent)' }}
                >
                  {client.logo_url ? (
                    <img src={client.logo_url} alt="" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    client.name[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink truncate">{client.name}</h3>
                  {client.segment && (
                    <span className="badge bg-panel text-ink-muted text-[10px] mt-0.5">
                      {client.segment}
                    </span>
                  )}
                </div>
                <div
                  className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${client.is_active ? 'bg-green-400' : 'bg-gray-300'}`}
                  title={client.is_active ? 'Ativo' : 'Inativo'}
                />
              </div>

              {/* Contact */}
              <div className="space-y-1.5 text-xs text-ink-muted">
                {client.responsible && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-ink-soft">{client.responsible}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={11} />
                    <a href={`mailto:${client.email}`} className="hover:text-accent transition-colors truncate">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={11} />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <Link
                  href={`/posts?client_id=${client.id}`}
                  className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium bg-panel text-ink-soft hover:bg-accent hover:text-white transition-all"
                >
                  Ver posts
                </Link>
                <Link
                  href={`/clients/${client.id}`}
                  className="p-1.5 rounded-lg hover:bg-panel transition-colors"
                  title="Editar"
                >
                  <Pencil size={14} className="text-ink-muted" />
                </Link>
                <DeleteClientButton clientId={client.id} clientName={client.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
