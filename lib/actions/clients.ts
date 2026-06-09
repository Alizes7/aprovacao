'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import { logAction } from './logs'
import type { Client, ApiResponse } from '@/types'

export async function listClients(opts?: { search?: string; segment?: string }): Promise<ApiResponse<Client[]>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  let query = supabase.from('clients').select('*').order('name')

  if (profile?.role !== 'admin') {
    const { data: cu } = await supabase.from('client_users').select('client_id').eq('user_id', user.id)
    const ids = cu?.map((c: any) => c.client_id) ?? []
    if (ids.length === 0) return { data: [], error: null, success: true }
    query = query.in('id', ids)
  }

  if (opts?.search) query = query.ilike('name', `%${opts.search}%`)
  if (opts?.segment) query = query.eq('segment', opts.segment)

  const { data, error } = await query
  if (error) return { data: null, error: error.message, success: false }
  return { data: data as Client[], error: null, success: true }
}

export async function getClient(id: string): Promise<ApiResponse<Client>> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
  if (error) return { data: null, error: 'Cliente não encontrado', success: false }
  return { data: data as Client, error: null, success: true }
}

export async function createNewClient(input: {
  name: string; segment?: string; responsible?: string
  email?: string; phone?: string; notes?: string; primary_color?: string
}): Promise<ApiResponse<Client>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }
  if (!input.name?.trim()) return { data: null, error: 'Nome é obrigatório', success: false }

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...input, name: input.name.trim(), created_by: user.id })
    .select().single()

  if (error) return { data: null, error: error.message, success: false }

  await logAction(supabase, { entity: 'client', entity_id: data.id, action: 'cliente_criado', user_id: user.id, description: `Cliente "${data.name}" criado` })
  revalidatePath('/clients')
  return { data: data as Client, error: null, success: true }
}

export async function updateClient(input: { id: string; [key: string]: any }): Promise<ApiResponse<Client>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  const { id, ...rest } = input
  const { data, error } = await supabase.from('clients').update(rest).eq('id', id).select().single()
  if (error) return { data: null, error: error.message, success: false }

  await logAction(supabase, { entity: 'client', entity_id: id, action: 'cliente_editado', user_id: user.id, description: `Cliente "${data.name}" atualizado` })
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return { data: data as Client, error: null, success: true }
}

export async function deleteClient(id: string): Promise<ApiResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Sem permissão', success: false }

  const { data: client } = await supabase.from('clients').select('name').eq('id', id).single()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { data: null, error: error.message, success: false }

  await logAction(supabase, { entity: 'client', entity_id: id, action: 'cliente_excluido', user_id: user.id, description: `Cliente "${client?.name}" excluído` })
  revalidatePath('/clients')
  return { data: null, error: null, success: true }
}

export async function uploadClientLogo(clientId: string, formData: FormData): Promise<ApiResponse<string>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado', success: false }

  const file = formData.get('file') as File
  if (!file) return { data: null, error: 'Arquivo não encontrado', success: false }
  if (file.size > 5 * 1024 * 1024) return { data: null, error: 'Máximo 5MB', success: false }

  const ext = file.name.split('.').pop()
  const path = `clients/${clientId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
  if (uploadError) return { data: null, error: uploadError.message, success: false }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
  await supabase.from('clients').update({ logo_url: publicUrl }).eq('id', clientId)
  revalidatePath(`/clients/${clientId}`)
  return { data: publicUrl, error: null, success: true }
}
