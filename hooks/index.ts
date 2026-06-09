'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useDirectUpload() {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const upload = useCallback(async (
    file: File,
    postId: string,
    onComplete?: (url: string, path: string) => void,
    onError?: (error: string) => void
  ) => {
    setIsUploading(true)
    setProgress(0)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      onError?.('Não autenticado')
      setIsUploading(false)
      return
    }

    const ext = file.name.split('.').pop()
    const path = `posts/${postId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('post-files')
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      onError?.(error.message)
      setIsUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('post-files').getPublicUrl(path)
    
    // Salvar no banco via Server Action
    const { error: dbError } = await supabase
      .from('post_files')
      .insert({
        post_id: postId,
        original_name: file.name,
        storage_path: path,
        public_url: publicUrl,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
      })

    if (dbError) {
      onError?.(dbError.message)
      setIsUploading(false)
      return
    }

    onComplete?.(publicUrl, path)
    setIsUploading(false)
    setProgress(100)
  }, [])

  return { upload, progress, isUploading }
}
