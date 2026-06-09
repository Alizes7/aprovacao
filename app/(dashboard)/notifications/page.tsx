// app/(dashboard)/notifications/page.tsx
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { Bell, CheckCheck } from 'lucide-react'
import { listNotifications } from '@/lib/actions/notifications'
import MarkAllReadButton from '@/components/notifications/MarkAllReadButton'

const TYPE_ICONS: Record<string, string> = {
  post_enviado_aprovacao: '📤',
  cliente_comentou: '💬',
  ajuste_solicitado: '⚠️',
  post_aprovado: '✅',
  prazo_proximo: '⏰',
  prazo_vencido: '🔴',
  nova_versao_enviada: '🔄',
  post_publicado: '🚀',
}

export default async function NotificationsPage() {
  const { data: notifications } = await listNotifications()

  const unread = notifications?.filter(n => !n.is_read) ?? []
  const read = notifications?.filter(n => n.is_read) ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Notificações</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {unread.length} não lida{unread.length !== 1 ? 's' : ''}
          </p>
        </div>
        {unread.length > 0 && <MarkAllReadButton />}
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div className="card p-12 text-center">
          <Bell size={32} className="mx-auto text-ink-faint mb-3" />
          <p className="font-medium text-ink">Tudo em dia!</p>
          <p className="text-sm text-ink-muted mt-1">Você não tem notificações no momento</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Unread */}
          {unread.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide px-1">
                Não lidas
              </p>
              {unread.map(n => (
                <NotificationCard key={n.id} notification={n} isUnread />
              ))}
            </div>
          )}

          {/* Read */}
          {read.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide px-1">
                Anteriores
              </p>
              {read.map(n => (
                <NotificationCard key={n.id} notification={n} isUnread={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationCard({ notification, isUnread }: { notification: any; isUnread: boolean }) {
  const icon = TYPE_ICONS[notification.type] ?? '🔔'

  return (
    <Link
      href={notification.post_id ? `/posts/${notification.post_id}` : '/notifications'}
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-sm ${
        isUnread
          ? 'bg-base border-accent/20 shadow-sm'
          : 'bg-base border-border opacity-70'
      }`}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${isUnread ? 'text-ink' : 'text-ink-soft'}`}>
            {notification.title}
          </p>
          {isUnread && (
            <div
              className="w-2 h-2 rounded-full shrink-0 mt-1.5"
              style={{ background: 'var(--color-accent)' }}
            />
          )}
        </div>
        <p className="text-sm text-ink-muted mt-0.5 leading-snug">{notification.message}</p>
        <p className="text-xs text-ink-faint mt-1.5">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
    </Link>
  )
}
