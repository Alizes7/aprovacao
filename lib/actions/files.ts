'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import { logAction } from './logs'
import type { ApiResponse } from '@/types'

const ALLOWED = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'application/pdf', 'video/mp4']

export async function uploadPostFile(formData: FormData): Promise<ApiResponse<{ url: string; id: string }>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const file = formData.get('file') as File
  const postId = formData.get('post_id') as string
  const versionId = formData.get('version_id') as string | null
  const carouselOrder = parseInt((formData.get('carousel_order') as string) ?? '0')

  if (!file) return { data: null, error: 'Arquivo não encontrado', success: false }
  if (!postId) return { data: null, error: 'post_id obrigatório', success: false }
  if (!ALLOWED.includes(file.type)) return { data: null, error: 'Tipo não permitido', success: false }
  if (file.size > 50 * 1024 * 1024) return { data: null, error: 'Arquivo excede 50MB', success: false }

  const ext = file.name.split('.').pop()
  const path = `posts/${postId}/${Date.now()}.${ext}`

  const { error: upErr } = await supabase.storage.from('post-files').upload(path, file)
  if (upErr) return { data: null, error: upErr.message, success: false }

  const { data: { publicUrl } } = supabase.storage.from('post-files').getPublicUrl(path)

  const { data: fileRecord, error: dbErr } = await supabase
    .from('post_files')
    .insert({ post_id: postId, version_id: versionId || null, original_name: file.name, storage_path: path, public_url: publicUrl, mime_type: file.type, size_bytes: file.size, carousel_order: carouselOrder, uploaded_by: user.id })
    .select().single()

  if (dbErr) return { data: null, error: dbErr.message, success: false }

  await logAction(supabase, { entity: 'post', entity_id: postId, action: 'arquivo_enviado', user_id: user.id, description: `Arquivo "${file.name}" enviado` })
  revalidatePath(`/posts/${postId}`)
  return { data: { url: publicUrl, id: fileRecord.id }, error: null, success: true }
}

export async function deletePostFile(fileId: string): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: file } = await supabase.from('post_files').select('storage_path,post_id,original_name').eq('id', fileId).single()
  if (!file) return { data: null, error: 'Arquivo não encontrado', success: false }

  await supabase.storage.from('post-files').remove([file.storage_path])
  await supabase.from('post_files').delete().eq('id', fileId)

  await logAction(supabase, { entity: 'post', entity_id: file.post_id, action: 'arquivo_excluido', user_id: user.id, description: `Arquivo "${file.original_name}" excluído` })
  revalidatePath(`/posts/${file.post_id}`)
  return { data: null, error: null, success: true }
}
