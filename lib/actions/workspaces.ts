'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { Workspace, WorkspaceMember, ApiResponse, UserRole } from '@/types'

// Garante que todo cliente tem um workspace — cria se não existir
export async function ensureWorkspace(clientId: string, clientName: string): Promise<string> {
  const supabase = await createSupabaseServer()
  const slug = clientName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data: existing } = await supabase
    .from('workspaces')
    .select('id')
    .eq('client_id', clientId)
    .single()

  if (existing) return existing.id

  const { data } = await supabase
    .from('workspaces')
    .insert({ client_id: clientId, name: clientName, slug: `${slug}-${clientId.slice(0, 6)}`, is_active: true })
    .select('id')
    .single()

  return data?.id ?? ''
}

export async function listWorkspaces(): Promise<ApiResponse<Workspace[]>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  let query = supabase.from('workspaces').select('*, client:clients(*)').eq('is_active', true).order('name')

  if (profile?.role !== 'admin' && profile?.role !== 'social_media') {
    const { data: members } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id)
    const ids = members?.map((m: any) => m.workspace_id) ?? []
    if (ids.length === 0) return { data: [], error: null, success: true }
    query = query.in('id', ids)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message, success: false }
  return { data: data as Workspace[], error: null, success: true }
}

export async function getWorkspaceMembers(workspaceId: string): Promise<ApiResponse<WorkspaceMember[]>> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*, user:profiles(*)')
    .eq('workspace_id', workspaceId)
  if (error) return { data: null, error: error.message, success: false }
  return { data: data as WorkspaceMember[], error: null, success: true }
}

export async function addWorkspaceMember(workspaceId: string, userId: string, role: UserRole): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  const { error } = await supabase.from('workspace_members')
    .upsert({ workspace_id: workspaceId, user_id: userId, role }, { onConflict: 'workspace_id,user_id' })

  if (error) return { data: null, error: error.message, success: false }
  revalidatePath('/settings')
  return { data: null, error: null, success: true }
}

export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  const { error } = await supabase.from('workspace_members')
    .delete().eq('workspace_id', workspaceId).eq('user_id', userId)

  if (error) return { data: null, error: error.message, success: false }
  revalidatePath('/settings')
  return { data: null, error: null, success: true }
}
