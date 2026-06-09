// app/(auth)/forgot-password/page.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      if (error) setError(error.message)
      else setSent(true)
    })
  }

  const inputCls = "w-full h-11 pl-10 pr-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"

  return (
    <div
      className="rounded-2xl p-7"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {sent ? (
        <div className="text-center">
          <div className="text-4xl mb-3">📧</div>
          <h2 className="text-white font-semibold text-lg mb-2">E-mail enviado</h2>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Verifique sua caixa de entrada para redefinir sua senha.
          </p>
          <Link href="/login" className="text-sm text-white/60 hover:text-white underline transition-colors">
            Voltar ao login
          </Link>
        </div>
      ) : (
        <>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs mb-5 hover:underline"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <ArrowLeft size={13} />
            Voltar
          </Link>
          <h2 className="text-white font-semibold text-lg mb-1">Recuperar senha</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Informe seu e-mail para receber o link de redefinição
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2.5 rounded-lg text-sm text-red-300 bg-red-500/10 border border-red-500/20">
                {error}
              </div>
            )}
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-accent)' }}
            >
              {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
