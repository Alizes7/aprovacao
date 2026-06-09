'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, setIsGooglePending] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      try {
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
      } catch {
        setError('Erro de conexão. Verifique sua internet e tente novamente.')
      }
    })
  }

  async function handleGoogleLogin() {
    setError('')
    setIsGooglePending(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
    } catch {
      setError('Erro ao conectar com Google. Tente novamente.')
    } finally {
      setIsGooglePending(false)
    }
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

      {/* Google login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGooglePending || isPending}
        className="w-full h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 mb-4"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
      >
        <GoogleIcon />
        {isGooglePending ? 'Redirecionando...' : 'Continuar com Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>ou</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

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
            style={ringAccent}
            autoComplete="email"
          />
        </div>

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
          disabled={isPending || isGooglePending}
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
