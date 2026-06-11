'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import type { ClientApprovalMetrics, MonthlyReport, ApiResponse } from '@/types'

export async function getApprovalMetrics(): Promise<ApiResponse<ClientApprovalMetrics[]>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const canView = profile?.role === 'admin' || profile?.role === 'social_media'
  if (!canView) return { data: null, error: 'Sem permissão', success: false }

  const { data: clients } = await supabase.from('clients').select('id, name, primary_color').eq('is_active', true)
  if (!clients?.length) return { data: [], error: null, success: true }

  const metrics: ClientApprovalMetrics[] = []

  for (const client of clients) {
    // Total de posts do cliente
    const { count: total } = await supabase.from('posts')
      .select('*', { count: 'exact', head: true }).eq('client_id', client.id)

    // Posts aprovados sem solicitação de ajuste (aprovação de primeira)
    const { data: approvedPosts } = await supabase.from('posts')
      .select('id').eq('client_id', client.id).eq('status', 'aprovado')

    const approvedIds = approvedPosts?.map((p: any) => p.id) ?? []
    let approvedFirstTry = 0

    if (approvedIds.length > 0) {
      // Posts que nunca tiveram comentário de ajuste
      const { count: withAdjustments } = await supabase.from('comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', approvedIds)
        .eq('is_system', true)

      approvedFirstTry = approvedIds.length - (withAdjustments ?? 0)
    }

    // Posts com ajustes solicitados
    const { count: adjustments } = await supabase.from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .in('status', ['ajustes_solicitados', 'em_ajuste', 'reenviado_aprovacao'])

    // Tempo médio de aprovação em horas
    const { data: approvals } = await supabase
      .from('approvals')
      .select('approved_at, post:posts!inner(created_at, client_id)')
      .eq('post.client_id', client.id)

    let avgHours: number | null = null
    if (approvals && approvals.length > 0) {
      const hours = approvals.map((a: any) => {
        const created = new Date(a.post.created_at).getTime()
        const approved = new Date(a.approved_at).getTime()
        return (approved - created) / 3600000
      })
      avgHours = Math.round(hours.reduce((a: number, b: number) => a + b, 0) / hours.length)
    }

    const approvalRate = (total ?? 0) > 0
      ? Math.round((approvedFirstTry / (total ?? 1)) * 100)
      : 0

    metrics.push({
      client_id: client.id,
      client_name: client.name,
      client_color: client.primary_color,
      total_posts: total ?? 0,
      approved_first_try: approvedFirstTry,
      requested_adjustments: adjustments ?? 0,
      approval_rate: approvalRate,
      avg_approval_hours: avgHours,
    })
  }

  return { data: metrics, error: null, success: true }
}

export async function getMonthlyReport(clientId: string, month: number, year: number): Promise<ApiResponse<MonthlyReport>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const canView = profile?.role === 'admin' || profile?.role === 'social_media'
  if (!canView) return { data: null, error: 'Sem permissão', success: false }

  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, client:clients(id,name,primary_color,logo_url)')
    .eq('client_id', clientId)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  const allPosts = posts ?? []
  const approved = allPosts.filter((p: any) => ['aprovado', 'publicado'].includes(p.status)).length
  const rejected = allPosts.filter((p: any) => ['ajustes_solicitados', 'em_ajuste'].includes(p.status)).length
  const published = allPosts.filter((p: any) => p.status === 'publicado').length

  // Tempo médio de aprovação
  const { data: approvals } = await supabase
    .from('approvals')
    .select('approved_at, post:posts!inner(created_at, client_id)')
    .eq('post.client_id', clientId)
    .gte('approved_at', start)
    .lte('approved_at', end)

  let avgHours: number | null = null
  if (approvals && approvals.length > 0) {
    const hours = approvals.map((a: any) => {
      const diff = new Date(a.approved_at).getTime() - new Date(a.post.created_at).getTime()
      return diff / 3600000
    })
    avgHours = Math.round(hours.reduce((a: number, b: number) => a + b, 0) / hours.length)
  }

  return {
    data: {
      client_id: clientId,
      client_name: client?.name ?? '',
      month,
      year,
      total_created: allPosts.length,
      total_approved: approved,
      total_rejected: rejected,
      total_published: published,
      avg_approval_hours: avgHours,
      posts: allPosts as any,
    },
    error: null,
    success: true,
  }
}
