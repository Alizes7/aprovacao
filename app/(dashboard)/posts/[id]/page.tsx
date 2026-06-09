import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getPost } from '@/lib/actions/posts'
import { listComments } from '@/lib/actions/comments'
import { getActionLogs } from '@/lib/actions/logs'
import PostDetail from '@/components/posts/PostDetail'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const [postResult, commentsResult, logsResult] = await Promise.all([
    getPost(id),
    listComments(id),
    getActionLogs(id),
  ])

  if (!postResult.data) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, client_users(client_id, role)')
    .eq('id', user!.id)
    .single()

  const { data: versions } = await supabase
    .from('post_versions')
    .select('*, created_by_profile:profiles!post_versions_created_by_fkey(id,full_name)')
    .eq('post_id', id)
    .order('version_num', { ascending: false })

  const { data: approvals } = await supabase
    .from('approvals')
    .select('*, approved_by_profile:profiles!approvals_approved_by_fkey(id,full_name,avatar_url), version:post_versions(version_num)')
    .eq('post_id', id)
    .order('approved_at', { ascending: false })

  return (
    <PostDetail
      post={postResult.data}
      profile={profile}
      comments={commentsResult.data ?? []}
      versions={versions ?? []}
      approvals={approvals ?? []}
      logs={logsResult.data ?? []}
    />
  )
}
