'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : error.message
        )
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  const inputCls = "w-full h-11 pl-10 pr-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:border-transparent"
  const ringAccent = { '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties

  return (
    <div
      className="rounded-2xl p-7"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <h2 className="text-white font-semibold text-lg mb-1">Entrar na conta</h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Acesse o portal de aprovação de posts
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2.5 rounded-lg text-sm text-red-300 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={inputCls}
            style={ringAccent}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Sua senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={`${inputCls} pr-10`}
            style={ringAccent}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-accent)' }}
        >
          {isPending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Não tem conta?{' '}
        <Link href="/register" className="text-white/60 hover:text-white transition-colors underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
