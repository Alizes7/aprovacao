import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import NotificationSound from '@/components/layout/NotificationSound'
import RealtimeNotifications from '@/components/layout/RealtimeNotifications'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, notifRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
  ])

  const profile = profileRes.data

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar profile={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar profile={profile} unreadCount={notifRes.count ?? 0} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Realtime: som + toast de notificação */}
      <NotificationSound userId={user.id} />
      <RealtimeNotifications userId={user.id} />
    </div>
  )
}
