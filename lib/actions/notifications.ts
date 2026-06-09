'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import type { Notification, NotificationType, ApiResponse } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function createNotification(
  supabase: SupabaseClient,
  input: { user_id: string; title: string; message: string; type: NotificationType; post_id?: string }
) {
  await supabase.from('notifications').insert(input)
}

export async function listNotifications(): Promise<ApiResponse<Notification[]>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data, error } = await supabase
    .from('notifications')
    .select('*, post:posts(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { data: null, error: error.message, success: false }
  return { data: data as Notification[], error: null, success: true }
}

export async function markNotificationRead(id: string): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }
  await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id)
  return { data: null, error: null, success: true }
}

export async function markAllNotificationsRead(): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  return { data: null, error: null, success: true }
}
