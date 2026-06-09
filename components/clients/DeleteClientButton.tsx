'use client'

import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteClient } from '@/lib/actions/clients'

interface DeleteClientButtonProps {
  clientId: string
  clientName: string
}

export default function DeleteClientButton({ clientId, clientName }: DeleteClientButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteClient(clientId)
      if (!result.success) {
        setError(result.error ?? 'Erro ao excluir cliente')
        setShowConfirm(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
        title="Excluir cliente"
      >
        <Trash2 size={14} className="text-ink-muted hover:text-danger" />
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="card p-6 w-full max-w-sm animate-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-danger" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">Excluir cliente</h3>
                <p className="text-xs text-ink-muted mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-sm text-ink-soft mb-5">
              Tem certeza que deseja excluir <strong>{clientName}</strong>?
              Todos os posts e arquivos vinculados também serão removidos.
            </p>

            {error && (
              <p className="text-sm text-danger mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-danger disabled:opacity-50"
              >
                {isPending ? 'Excluindo...' : 'Sim, excluir'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-panel"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
