'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import { logAction } from './logs'
import { createNotification } from './notifications'
import type { Comment, ApiResponse } from '@/types'

export async function listComments(postId: string): Promise<ApiResponse<Comment[]>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data, error } = await supabase
    .from('comments')
    .select('*, user:profiles(id,full_name,avatar_url,role), version:post_versions(id,version_num)')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .is('parent_id', null)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message, success: false }

  const withReplies = await Promise.all(
    (data ?? []).map(async (comment: any) => {
      const { data: replies } = await supabase
        .from('comments')
        .select('*, user:profiles(id,full_name,avatar_url,role)')
        .eq('parent_id', comment.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
      return { ...comment, replies: replies ?? [] }
    })
  )

  return { data: withReplies as Comment[], error: null, success: true }
}

export async function createComment(input: {
  post_id: string; version_id?: string; content: string; parent_id?: string
}): Promise<ApiResponse<Comment>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'viewer') return { data: null, error: 'Visualizadores não podem comentar', success: false }
  if (!input.content?.trim()) return { data: null, error: 'Comentário vazio', success: false }

  const { data, error } = await supabase
    .from('comments')
    .insert({ ...input, content: input.content.trim(), user_id: user.id })
    .select('*, user:profiles(id,full_name,avatar_url,role)')
    .single()

  if (error) return { data: null, error: error.message, success: false }

  const { data: post } = await supabase.from('posts').select('title,responsible_id').eq('id', input.post_id).single()
  await logAction(supabase, { entity: 'post', entity_id: input.post_id, action: 'comentario_criado', user_id: user.id, description: `Comentário em "${post?.title}"` })

  if (profile?.role === 'client' && post?.responsible_id) {
    await createNotification(supabase, { user_id: post.responsible_id, title: 'Novo comentário do cliente', message: input.content.slice(0, 80), type: 'cliente_comentou', post_id: input.post_id })
  }

  revalidatePath(`/posts/${input.post_id}`)
  return { data: data as Comment, error: null, success: true }
}

export async function deleteComment(commentId: string, postId: string): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: comment } = await supabase.from('comments').select('user_id').eq('id', commentId).single()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (comment?.user_id !== user.id && profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  await supabase.from('comments').update({ is_deleted: true }).eq('id', commentId)
  revalidatePath(`/posts/${postId}`)
  return { data: null, error: null, success: true }
}
