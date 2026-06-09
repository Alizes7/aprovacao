'use client'

import { useState, useRef, useTransition, useCallback } from 'react'
import { Upload, X, ImageIcon, FileText, Film, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadPostFile } from '@/lib/actions/files'
import { deletePostFile } from '@/lib/actions/files'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/types'

interface FileUploadProps {
  postId: string
  versionId?: string
}

interface UploadedFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  preview?: string
}

export default function FileUpload({ postId, versionId }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File, idx: number) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFiles(prev => prev.map((f, i) => i === idx
        ? { ...f, status: 'error', error: 'Tipo não permitido' }
        : f
      ))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFiles(prev => prev.map((f, i) => i === idx
        ? { ...f, status: 'error', error: 'Arquivo excede 50MB' }
        : f
      ))
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('post_id', postId)
    if (versionId) formData.append('version_id', versionId)
    formData.append('carousel_order', String(idx))

    const result = await uploadPostFile(formData)
    setFiles(prev => prev.map((f, i) => i === idx
      ? result.success
        ? { ...f, status: 'done', id: result.data!.id, url: result.data!.url }
        : { ...f, status: 'error', error: result.error ?? 'Erro desconhecido' }
      : f
    ))
  }, [postId, versionId])

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return

    const newFiles: UploadedFile[] = Array.from(incoming).map(file => ({
      id: '',
      name: file.name,
      url: '',
      type: file.type,
      size: file.size,
      status: 'uploading',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))

    setFiles(prev => {
      const startIdx = prev.length
      const updated = [...prev, ...newFiles]
      // Start uploads
      Array.from(incoming).forEach((file, i) => {
        processFile(file, startIdx + i)
      })
      return updated
    })
  }, [processFile])

  const handleRemove = async (idx: number) => {
    const file = files[idx]
    if (file.id) {
      startTransition(async () => {
        await deletePostFile(file.id)
      })
    }
    if (file.preview) URL.revokeObjectURL(file.preview)
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function FileIcon({ type }: { type: string }) {
    if (type.startsWith('image/')) return <ImageIcon size={16} className="text-blue-400" />
    if (type.startsWith('video/')) return <Film size={16} className="text-purple-400" />
    return <FileText size={16} className="text-red-400" />
  }

  return (
    <div className="card p-4 space-y-3">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Arquivos</p>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
        style={{
          borderColor: isDragging ? 'var(--color-accent)' : 'var(--color-border)',
          background: isDragging ? 'var(--color-accent-dim)' : 'var(--color-surface)',
        }}
      >
        <Upload size={20} className="mx-auto mb-2 text-ink-muted" />
        <p className="text-sm font-medium text-ink">
          {isDragging ? 'Solte os arquivos aqui' : 'Clique ou arraste arquivos'}
        </p>
        <p className="text-xs text-ink-muted mt-0.5">
          PNG, JPG, JPEG, WEBP, PDF, MP4 — máx. 50MB cada
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-surface"
            >
              {/* Thumbnail or icon */}
              {file.preview ? (
                <img
                  src={file.preview}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-panel flex items-center justify-center shrink-0">
                  <FileIcon type={file.type} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{file.name}</p>
                <p className="text-xs text-ink-muted">{formatSize(file.size)}</p>
                {file.error && (
                  <p className="text-xs text-danger">{file.error}</p>
                )}
              </div>

              {/* Status */}
              <div className="shrink-0 flex items-center gap-2">
                {file.status === 'uploading' && (
                  <div
                    className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
                  />
                )}
                {file.status === 'done' && <CheckCircle size={16} className="text-success" />}
                {file.status === 'error' && <AlertCircle size={16} className="text-danger" />}

                <button
                  onClick={() => handleRemove(i)}
                  className="p-1 rounded hover:bg-panel transition-colors"
                >
                  <X size={13} className="text-ink-muted" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
