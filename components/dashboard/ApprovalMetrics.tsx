'use client'

import type { ClientApprovalMetrics } from '@/types'
import { TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react'

interface ApprovalMetricsProps {
  metrics: ClientApprovalMetrics[]
}

export default function ApprovalMetrics({ metrics }: ApprovalMetricsProps) {
  if (!metrics.length) return null

  const sorted = [...metrics].sort((a, b) => b.total_posts - a.total_posts).slice(0, 6)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-ink">Taxa de Aprovação por Cliente</h2>
          <p className="text-xs text-ink-muted mt-0.5">Posts aprovados de primeira vs. com ajustes</p>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map(m => (
          <ClientMetricRow key={m.client_id} metric={m} />
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
        <SummaryCard
          label="Média geral"
          value={`${Math.round(metrics.reduce((a, b) => a + b.approval_rate, 0) / metrics.length)}%`}
          icon={<TrendingUp size={14} />}
          color="text-green-600"
        />
        <SummaryCard
          label="Total de posts"
          value={String(metrics.reduce((a, b) => a + b.total_posts, 0))}
          icon={<RefreshCw size={14} />}
          color="text-accent"
        />
        <SummaryCard
          label="Tempo médio"
          value={formatAvgHours(
            metrics.filter(m => m.avg_approval_hours !== null).reduce((a, b) => a + (b.avg_approval_hours ?? 0), 0) /
            (metrics.filter(m => m.avg_approval_hours !== null).length || 1)
          )}
          icon={<Clock size={14} />}
          color="text-amber-600"
        />
      </div>
    </div>
  )
}

function ClientMetricRow({ metric }: { metric: ClientApprovalMetrics }) {
  const rate = metric.approval_rate
  const isGood = rate >= 60

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: metric.client_color || 'var(--color-accent)' }}
          />
          <span className="text-sm font-medium text-ink truncate max-w-[160px]">{metric.client_name}</span>
          <span className="text-[11px] text-ink-muted">{metric.total_posts} posts</span>
        </div>
        <div className="flex items-center gap-2">
          {metric.avg_approval_hours !== null && (
            <span className="text-[11px] text-ink-muted flex items-center gap-1">
              <Clock size={10} />
              {formatAvgHours(metric.avg_approval_hours)}
            </span>
          )}
          <span className={`text-sm font-bold flex items-center gap-1 ${isGood ? 'text-green-600' : 'text-orange-500'}`}>
            {isGood ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {rate}%
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-panel)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${rate}%`,
            background: isGood
              ? 'linear-gradient(90deg, #22B573, #10B981)'
              : 'linear-gradient(90deg, #F59E0B, #EF4444)',
          }}
        />
      </div>

      <div className="flex gap-3 text-[11px] text-ink-muted">
        <span className="text-green-600">✓ {metric.approved_first_try} aprovados de primeira</span>
        {metric.requested_adjustments > 0 && (
          <span className="text-orange-500">↩ {metric.requested_adjustments} com ajustes</span>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div>
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
        {icon}
        <span className="font-bold text-base">{value}</span>
      </div>
      <p className="text-[11px] text-ink-muted">{label}</p>
    </div>
  )
}

function formatAvgHours(hours: number): string {
  if (hours < 1) return '< 1h'
  if (hours < 24) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}
