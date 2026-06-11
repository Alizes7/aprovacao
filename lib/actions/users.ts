'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { Profile, UserRole, ApiResponse } from '@/types'

export async function listUsers(): Promise<ApiResponse<Profile[]>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  if (error) return { data: null, error: error.message, success: false }
  return { data: data as Profile[], error: null, success: true }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }
  if (userId === user.id) return { data: null, error: 'Você não pode alterar seu próprio role', success: false }

  const { error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', userId)
  if (error) return { data: null, error: error.message, success: false }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { data: null, error: null, success: true }
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }
  if (userId === user.id) return { data: null, error: 'Você não pode desativar sua própria conta', success: false }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return { data: null, error: error.message, success: false }
  revalidatePath('/settings')
  return { data: null, error: null, success: true }
}
