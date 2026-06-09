// app/(auth)/register/page.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      return setError('As senhas não coincidem.')
    }
    if (form.password.length < 8) {
      return setError('Senha deve ter pelo menos 8 caracteres.')
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, role: 'viewer' },
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    })
  }

  const inputCls = "w-full h-11 pl-10 pr-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"

  if (success) {
    return (
      <div
        className="rounded-2xl p-7 text-center"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-white font-semibold text-lg mb-2">Conta criada!</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Verifique seu e-mail para confirmar a conta e, após confirmação, seu perfil será ativado por um administrador.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--color-accent)' }}
        >
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-7"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <h2 className="text-white font-semibold text-lg mb-1">Criar conta</h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Preencha os dados para se cadastrar
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2.5 rounded-lg text-sm text-red-300 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="relative">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Seu nome completo"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            required
            className={inputCls}
            autoComplete="name"
          />
        </div>

        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="email"
            placeholder="seu@email.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            className={inputCls}
            autoComplete="email"
          />
        </div>

        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Crie uma senha (mín. 8 caracteres)"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            className={`${inputCls} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="password"
            placeholder="Confirme a senha"
            value={form.confirmPassword}
            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
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
          {isPending ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Já tem conta?{' '}
        <Link href="/login" className="text-white/60 hover:text-white transition-colors underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
