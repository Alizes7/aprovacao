// hooks/index.ts — combined hooks (useDebounce, useUnreadNotifications, useRealtimeComments)
import { useState, useEffect, useCallback } from 'react'
import type { Comment } from '@/types'
import { createClient } from '@/lib/supabase/client'

// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// hooks/useUnreadCount.ts
export function useUnreadNotifications() {
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function fetchCount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count: c } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (mounted) setCount(c ?? 0)
    }

    fetchCount()

    // Realtime subscription
    const channel = supabase
      .channel('notifications-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
      }, () => fetchCount())
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return count
}

// hooks/useRealtimeComments.ts
export function useRealtimeComments(postId: string, initial: Comment[]) {
  const [comments, setComments] = useState(initial)
  const supabase = createClient()

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, user:profiles(id, full_name, avatar_url, role)')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
    if (data) setComments(data as Comment[])
  }, [postId])

  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, () => refetch())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [postId, refetch])

  return { comments, refetch }
}
