// app/(dashboard)/clients/new/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase/server'
import ClientForm from '@/components/clients/ClientForm'

export default async function NewClientPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="p-1.5 rounded-lg hover:bg-panel transition-colors">
          <ChevronLeft size={18} className="text-ink-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink">Novo cliente</h1>
          <p className="text-sm text-ink-muted mt-0.5">Preencha as informações do cliente</p>
        </div>
      </div>
      <ClientForm />
    </div>
  )
}
