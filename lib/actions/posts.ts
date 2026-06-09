'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import { logAction } from './logs'
import { createNotification } from './notifications'
import type { Post, PostStatus, ApiResponse } from '@/types'

export async function listPosts(filters?: {
  client_id?: string; status?: PostStatus; format?: string
  social_network?: string; priority?: string; search?: string
}): Promise<ApiResponse<Post[]>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  let query = supabase
    .from('posts')
    .select('*, client:clients(id,name,primary_color,logo_url), responsible:profiles!posts_responsible_id_fkey(id,full_name)')
    .order('created_at', { ascending: false })

  if (filters?.client_id) query = query.eq('client_id', filters.client_id)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.format) query = query.eq('format', filters.format)
  if (filters?.social_network) query = query.eq('social_network', filters.social_network)
  if (filters?.priority) query = query.eq('priority', filters.priority)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  const { data, error } = await query
  if (error) return { data: null, error: error.message, success: false }
  return { data: data as Post[], error: null, success: true }
}

export async function getPost(id: string): Promise<ApiResponse<Post>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data, error } = await supabase
    .from('posts')
    .select('*, client:clients(*), responsible:profiles!posts_responsible_id_fkey(id,full_name,avatar_url), files:post_files(*)')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: 'Post não encontrado', success: false }
  return { data: data as Post, error: null, success: true }
}

export async function createPost(input: {
  client_id: string; title: string; format: string; social_network: string
  priority?: string; scheduled_date?: string; approval_deadline?: string
  responsible_id?: string; caption?: string; hashtags?: string; cta?: string; notes?: string
}): Promise<ApiResponse<Post>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }
  if (!input.title?.trim()) return { data: null, error: 'Título é obrigatório', success: false }

  const { data, error } = await supabase
    .from('posts')
    .insert({ ...input, title: input.title.trim(), created_by: user.id, updated_by: user.id })
    .select().single()

  if (error) return { data: null, error: error.message, success: false }

  // Create initial version
  await supabase.from('post_versions').insert({
    post_id: data.id,
    version_num: 1,
    caption: input.caption ?? null,
    hashtags: input.hashtags ?? null,
    cta: input.cta ?? null,
    notes: input.notes ?? null,
    status: 'rascunho',
    created_by: user.id,
  })

  await logAction(supabase, { entity: 'post', entity_id: data.id, action: 'post_criado', user_id: user.id, description: `Post "${data.title}" criado` })
  revalidatePath('/dashboard')
  revalidatePath('/posts')
  return { data: data as Post, error: null, success: true }
}

export async function updatePost(input: { id: string; [key: string]: any }): Promise<ApiResponse<Post>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  const { data: current } = await supabase.from('posts').select('status').eq('id', input.id).single()
  if (current?.status === 'aprovado') return { data: null, error: 'Post aprovado não pode ser editado. Crie nova versão.', success: false }

  const { id, ...rest } = input
  const { data, error } = await supabase.from('posts').update({ ...rest, updated_by: user.id }).eq('id', id).select().single()
  if (error) return { data: null, error: error.message, success: false }

  await logAction(supabase, { entity: 'post', entity_id: id, action: 'post_editado', user_id: user.id, description: `Post "${data.title}" atualizado` })
  revalidatePath('/posts')
  revalidatePath(`/posts/${id}`)
  return { data: data as Post, error: null, success: true }
}

export async function deletePost(id: string): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  const { data: post } = await supabase.from('posts').select('status,title').eq('id', id).single()
  if (post?.status === 'publicado') return { data: null, error: 'Posts publicados não podem ser excluídos', success: false }

  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return { data: null, error: error.message, success: false }

  revalidatePath('/posts')
  revalidatePath('/dashboard')
  return { data: null, error: null, success: true }
}

export async function sendForApproval(postId: string): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: post } = await supabase.from('posts').select('title,status,current_version_num').eq('id', postId).single()
  if (!post) return { data: null, error: 'Post não encontrado', success: false }

  const isResubmit = post.status === 'em_ajuste'
  const newStatus: PostStatus = isResubmit ? 'reenviado_aprovacao' : 'enviado_aprovacao'

  await supabase.from('posts').update({ status: newStatus, updated_by: user.id }).eq('id', postId)
  await supabase.from('post_versions').update({ status: 'enviado' }).eq('post_id', postId).eq('version_num', post.current_version_num)

  await logAction(supabase, { entity: 'post', entity_id: postId, action: 'post_enviado_aprovacao', user_id: user.id, description: `Post "${post.title}" enviado para aprovação` })

  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').eq('is_active', true)
  for (const admin of admins ?? []) {
    await createNotification(supabase, { user_id: admin.id, title: 'Post enviado para aprovação', message: `"${post.title}" aguarda revisão`, type: 'post_enviado_aprovacao', post_id: postId })
  }

  revalidatePath(`/posts/${postId}`)
  revalidatePath('/dashboard')
  return { data: null, error: null, success: true }
}

export async function approvePost(input: { post_id: string; version_id: string; notes?: string }): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: post } = await supabase.from('posts').select('title,status,client_id,responsible_id').eq('id', input.post_id).single()
  if (!post) return { data: null, error: 'Post não encontrado', success: false }

  const APPROVABLE = ['enviado_aprovacao', 'aguardando_cliente', 'reenviado_aprovacao']
  if (!APPROVABLE.includes(post.status)) return { data: null, error: 'Post não está disponível para aprovação', success: false }

  // Allow admin OR client to approve
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    const { data: cu } = await supabase.from('client_users').select('role').eq('user_id', user.id).eq('client_id', post.client_id).single()
    if (!cu) return { data: null, error: 'Sem permissão para aprovar', success: false }
  }

  await supabase.from('approvals').insert({ post_id: input.post_id, version_id: input.version_id, approved_by: user.id, notes: input.notes ?? null })
  await supabase.from('posts').update({ status: 'aprovado', updated_by: user.id }).eq('id', input.post_id)
  await supabase.from('post_versions').update({ status: 'aprovado' }).eq('id', input.version_id)

  await logAction(supabase, { entity: 'post', entity_id: input.post_id, action: 'conteudo_aprovado', user_id: user.id, description: `Post "${post.title}" aprovado` })

  if (post.responsible_id) {
    await createNotification(supabase, { user_id: post.responsible_id, title: 'Post aprovado!', message: `"${post.title}" foi aprovado pelo cliente`, type: 'post_aprovado', post_id: input.post_id })
  }

  revalidatePath(`/posts/${input.post_id}`)
  revalidatePath('/dashboard')
  return { data: null, error: null, success: true }
}

export async function requestAdjustment(input: { post_id: string; version_id: string; comment: string }): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }
  if (!input.comment?.trim()) return { data: null, error: 'Comentário é obrigatório', success: false }

  const { data: post } = await supabase.from('posts').select('title,client_id,responsible_id').eq('id', input.post_id).single()
  if (!post) return { data: null, error: 'Post não encontrado', success: false }

  await supabase.from('posts').update({ status: 'ajustes_solicitados', updated_by: user.id }).eq('id', input.post_id)
  await supabase.from('post_versions').update({ status: 'ajustes_solicitados' }).eq('id', input.version_id)
  await supabase.from('comments').insert({ post_id: input.post_id, version_id: input.version_id, user_id: user.id, content: input.comment.trim() })

  await logAction(supabase, { entity: 'post', entity_id: input.post_id, action: 'ajuste_solicitado', user_id: user.id, description: `Ajuste solicitado: ${input.comment}` })

  if (post.responsible_id) {
    await createNotification(supabase, { user_id: post.responsible_id, title: 'Ajuste solicitado', message: input.comment.slice(0, 80), type: 'ajuste_solicitado', post_id: input.post_id })
  }

  revalidatePath(`/posts/${input.post_id}`)
  return { data: null, error: null, success: true }
}

export async function markAsPublished(postId: string): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  const { data: post } = await supabase.from('posts').select('title,status').eq('id', postId).single()
  if (!post) return { data: null, error: 'Post não encontrado', success: false }
  if (post.status !== 'aprovado') return { data: null, error: 'Apenas posts aprovados podem ser marcados como publicados', success: false }

  await supabase.from('posts').update({ status: 'publicado', updated_by: user.id }).eq('id', postId)
  await logAction(supabase, { entity: 'post', entity_id: postId, action: 'post_publicado', user_id: user.id, description: `Post "${post.title}" marcado como publicado` })

  revalidatePath(`/posts/${postId}`)
  revalidatePath('/dashboard')
  return { data: null, error: null, success: true }
}

export async function updatePostStatus(postId: string, status: PostStatus): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  const { data: old } = await supabase.from('posts').select('title').eq('id', postId).single()
  await supabase.from('posts').update({ status, updated_by: user.id }).eq('id', postId)
  await logAction(supabase, { entity: 'post', entity_id: postId, action: 'status_alterado', user_id: user.id, description: `Status de "${old?.title}" alterado para ${status}` })

  revalidatePath(`/posts/${postId}`)
  revalidatePath('/dashboard')
  return { data: null, error: null, success: true }
}

export async function getDashboardMetrics() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [a, b, c, d, e, f] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('posts').select('*', { count: 'exact', head: true }).in('status', ['enviado_aprovacao', 'aguardando_cliente', 'reenviado_aprovacao']),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'aprovado'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).in('status', ['ajustes_solicitados', 'em_ajuste']),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'publicado'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const { count: overdue } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("aprovado","publicado","arquivado")')
    .lt('approval_deadline', now.toISOString())

  return {
    data: {
      total_posts_month: a.count ?? 0,
      awaiting_approval: b.count ?? 0,
      approved: c.count ?? 0,
      adjustments_requested: d.count ?? 0,
      published: e.count ?? 0,
      active_clients: f.count ?? 0,
      overdue: overdue ?? 0,
    },
    error: null,
    success: true,
  }
}
