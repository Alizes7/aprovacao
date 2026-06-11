'use client'

import { useState, useTransition } from 'react'
import { FileDown, Loader2, Calendar } from 'lucide-react'
import { getMonthlyReport } from '@/lib/actions/reports'
import type { MonthlyReport } from '@/types'
import { POST_STATUS_LABELS } from '@/types'

interface MonthlyReportPDFProps {
  clients: { id: string; name: string }[]
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function statusBg(status: string): string {
  const map: Record<string,string> = { aprovado:'#dcfce7',publicado:'#d1fae5',rascunho:'#f4f4f5',ajustes_solicitados:'#ffedd5',em_ajuste:'#fef9c3',enviado_aprovacao:'#dbeafe',arquivado:'#f3f4f6' }
  return map[status] ?? '#f3f4f6'
}
function statusColor(status: string): string {
  const map: Record<string,string> = { aprovado:'#15803d',publicado:'#065f46',rascunho:'#52525b',ajustes_solicitados:'#c2410c',em_ajuste:'#a16207',enviado_aprovacao:'#1d4ed8',arquivado:'#6b7280' }
  return map[status] ?? '#374151'
}

export default function MonthlyReportPDF({ clients }: MonthlyReportPDFProps) {
  const now = new Date()
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function generateHTML(report: MonthlyReport) {
    const monthName = MONTHS[report.month - 1]
    const postRows = report.posts.map(p => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:8px 12px;font-size:13px">${p.title}</td>
        <td style="padding:8px 12px;font-size:13px;color:#666">${new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
        <td style="padding:8px 12px"><span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;background:${statusBg(p.status)};color:${statusColor(p.status)}">${POST_STATUS_LABELS[p.status]}</span></td>
      </tr>`).join('')

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório ${monthName} ${year} — ${report.client_name}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff}.header{background:linear-gradient(135deg,#5B4FE8,#7B71F0);padding:40px 48px;color:white}.header h1{font-size:28px;font-weight:700;margin-bottom:4px}.header p{opacity:.8;font-size:15px}.meta{margin-top:20px;display:flex;gap:32px;flex-wrap:wrap}.meta span{font-size:13px;opacity:.9}.body{padding:40px 48px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:40px}.card{background:#f8f9ff;border:1px solid #e8eaf6;border-radius:12px;padding:20px;text-align:center}.card .num{font-size:32px;font-weight:800;color:#5B4FE8}.card .lbl{font-size:12px;color:#666;margin-top:4px}.section-title{font-size:16px;font-weight:700;margin-bottom:16px;color:#1a1a2e;border-bottom:2px solid #5B4FE8;padding-bottom:8px}table{width:100%;border-collapse:collapse}thead tr{background:#f3f4ff}th{padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#888}.highlight{background:#fff8e1;border-left:3px solid #F59E0B;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:32px;font-size:14px}.footer{margin-top:48px;padding-top:24px;border-top:1px solid #eee;text-align:center;color:#999;font-size:12px}</style></head>
<body><div class="header"><h1>Relatório Mensal</h1><p>${report.client_name} · ${monthName} ${report.year}</p>
<div class="meta"><span>📅 Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</span><span>🏢 Bescheiben Digital Agency</span></div></div>
<div class="body"><div class="cards">
<div class="card"><div class="num">${report.total_created}</div><div class="lbl">Posts criados</div></div>
<div class="card"><div class="num" style="color:#22B573">${report.total_approved}</div><div class="lbl">Aprovados</div></div>
<div class="card"><div class="num" style="color:#F59E0B">${report.total_rejected}</div><div class="lbl">Com ajustes</div></div>
<div class="card"><div class="num" style="color:#10B981">${report.total_published}</div><div class="lbl">Publicados</div></div>
</div>
${report.avg_approval_hours !== null ? `<div class="highlight">⏱ <strong>Tempo médio de aprovação:</strong> ${report.avg_approval_hours < 24 ? report.avg_approval_hours + ' horas' : Math.round(report.avg_approval_hours/24) + ' dias'}</div>` : ''}
<div class="section-title">Detalhamento dos Posts</div>
${report.posts.length > 0 ? `<table><thead><tr><th>Título</th><th>Criado em</th><th>Status</th></tr></thead><tbody>${postRows}</tbody></table>` : '<p style="color:#999;font-size:14px">Nenhum post no período.</p>'}
<div class="footer"><strong>Bescheiben Digital Agency</strong><br>Relatório gerado automaticamente pelo Portal de Aprovação</div></div></body></html>`
  }

  function handleGenerate() {
    if (!clientId) return
    setError('')
    startTransition(async () => {
      const res = await getMonthlyReport(clientId, month, year)
      if (res.success && res.data) {
        const html = generateHTML(res.data)
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const monthName = MONTHS[month - 1].toLowerCase()
        a.href = url
        a.download = `relatorio-${res.data.client_name.toLowerCase().replace(/\s+/g,'-')}-${monthName}-${year}.html`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        setError(res.error ?? 'Erro ao gerar relatório')
      }
    })
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-dim)' }}>
          <Calendar size={18} style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <h2 className="font-semibold text-ink">Relatório Mensal</h2>
          <p className="text-xs text-ink-muted mt-0.5">Exporte o relatório do cliente em HTML (abrível no navegador)</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <select value={clientId} onChange={e => setClientId(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-base text-sm text-ink">
          <option value="">Selecione o cliente...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="h-10 px-3 rounded-lg border border-border bg-base text-sm text-ink">
          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="h-10 px-3 rounded-lg border border-border bg-base text-sm text-ink">
          {[now.getFullYear(), now.getFullYear()-1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <button onClick={handleGenerate} disabled={!clientId || isPending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'var(--color-accent)' }}>
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
        {isPending ? 'Gerando...' : 'Gerar relatório'}
      </button>
    </div>
  )
}
