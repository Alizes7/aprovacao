// app/(dashboard)/posts/new/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase/server'
import NewPostForm from '@/components/posts/NewPostForm'

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') redirect('/posts')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, primary_color, logo_url')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <Link href="/posts" className="p-1.5 rounded-lg hover:bg-panel transition-colors">
          <ChevronLeft size={18} className="text-ink-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink">Novo post</h1>
          <p className="text-sm text-ink-muted mt-0.5">Preencha as informações e faça upload dos arquivos</p>
        </div>
      </div>

      <NewPostForm
        clients={clients ?? []}
        defaultClientId={params.client_id}
        userId={user!.id}
      />
    </div>
  )
}
