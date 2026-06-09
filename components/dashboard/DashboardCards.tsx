'use client'

import { Clock, CheckCircle, AlertTriangle, XCircle, Send, Users, FileText } from 'lucide-react'
import type { DashboardMetrics } from '@/types'

interface DashboardCardsProps {
  metrics: DashboardMetrics | null
}

const CARDS = [
  {
    key: 'total_posts_month' as keyof DashboardMetrics,
    label: 'Posts no mês',
    icon: FileText,
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-dim)',
  },
  {
    key: 'awaiting_approval' as keyof DashboardMetrics,
    label: 'Aguardando aprovação',
    icon: Clock,
    color: 'var(--color-info)',
    bg: '#EFF6FF',
  },
  {
    key: 'approved' as keyof DashboardMetrics,
    label: 'Aprovados',
    icon: CheckCircle,
    color: 'var(--color-success)',
    bg: '#F0FDF4',
  },
  {
    key: 'adjustments_requested' as keyof DashboardMetrics,
    label: 'Com ajustes',
    icon: AlertTriangle,
    color: 'var(--color-warning)',
    bg: '#FFFBEB',
  },
  {
    key: 'overdue' as keyof DashboardMetrics,
    label: 'Atrasados',
    icon: XCircle,
    color: 'var(--color-danger)',
    bg: '#FEF2F2',
  },
  {
    key: 'published' as keyof DashboardMetrics,
    label: 'Publicados',
    icon: Send,
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    key: 'active_clients' as keyof DashboardMetrics,
    label: 'Clientes ativos',
    icon: Users,
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
]

export default function DashboardCards({ metrics }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, icon: Icon, color, bg }) => (
        <div key={key} className="card p-5 flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: bg }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-ink leading-none">
              {metrics ? metrics[key] : <span className="skeleton w-8 h-6 inline-block" />}
            </p>
            <p className="text-xs text-ink-muted mt-1 leading-tight">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
