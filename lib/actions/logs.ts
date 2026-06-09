'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionType, ActionLog, ApiResponse } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function logAction(
  supabase: SupabaseClient,
  input: {
    entity: string
    entity_id: string
    action: ActionType
    user_id: string
    description?: string
    old_data?: Record<string, unknown>
    new_data?: Record<string, unknown>
  }
) {
  await supabase.from('action_logs').insert(input)
}

export async function getActionLogs(entityId: string): Promise<ApiResponse<ActionLog[]>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data, error } = await supabase
    .from('action_logs')
    .select('*, user:profiles(id, full_name, avatar_url)')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message, success: false }
  return { data: data as ActionLog[], error: null, success: true }
}
