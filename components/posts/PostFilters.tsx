'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useCallback, useTransition } from 'react'
import { POST_STATUS_LABELS, POST_PRIORITY_LABELS, POST_FORMAT_LABELS, SOCIAL_NETWORK_LABELS } from '@/types'

interface PostFiltersProps {
  clients: { id: string; name: string }[]
  currentParams: Record<string, string | undefined>
}

export default function PostFilters({ clients, currentParams }: PostFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams()
    Object.entries(currentParams).forEach(([k, v]) => {
      if (v && k !== key) params.set(k, v)
    })
    if (value) params.set(key, value)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [currentParams, pathname, router])

  const clearAll = () => {
    startTransition(() => router.push(pathname))
  }

  const hasFilters = Object.values(currentParams).some(Boolean)

  const selectClass = "h-9 px-3 rounded-lg text-sm bg-base border border-border text-ink focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Buscar posts..."
            defaultValue={currentParams.search ?? ''}
            onChange={e => updateParam('search', e.target.value)}
            className="h-9 pl-8 pr-3 rounded-lg text-sm bg-base border border-border text-ink focus:outline-none focus:ring-2 focus:ring-accent w-44"
          />
        </div>

        {/* Client */}
        <select
          value={currentParams.client_id ?? ''}
          onChange={e => updateParam('client_id', e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Status */}
        <select
          value={currentParams.status ?? ''}
          onChange={e => updateParam('status', e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os status</option>
          {Object.entries(POST_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Format */}
        <select
          value={currentParams.format ?? ''}
          onChange={e => updateParam('format', e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os formatos</option>
          {Object.entries(POST_FORMAT_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Network */}
        <select
          value={currentParams.social_network ?? ''}
          onChange={e => updateParam('social_network', e.target.value)}
          className={selectClass}
        >
          <option value="">Todas as redes</option>
          {Object.entries(SOCIAL_NETWORK_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={currentParams.priority ?? ''}
          onChange={e => updateParam('priority', e.target.value)}
          className={selectClass}
        >
          <option value="">Todas as prioridades</option>
          {Object.entries(POST_PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="h-9 px-3 rounded-lg text-sm text-ink-muted border border-border flex items-center gap-1.5 hover:bg-panel transition-colors"
          >
            <X size={13} />
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}
