'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileImage, Bell, Settings,
  LogOut, ChevronRight, X, Menu
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Profile } from '@/types'

interface SidebarProps {
  profile: Profile | null
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/posts', label: 'Posts', icon: FileImage },
  { href: '/clients', label: 'Clientes', icon: Users, adminOnly: true },
  { href: '/notifications', label: 'Notificações', icon: Bell },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = profile?.role === 'admin'

  // Mobile: sidebar fechada por padrão
  const [open, setOpen] = useState(false)

  // Fecha ao trocar de rota
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarContent = (
    <aside
      className="flex flex-col h-full overflow-y-auto"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        width: 'var(--sidebar-w)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-xl opacity-30 blur-md scale-110"
            style={{ background: 'var(--color-accent)' }}
          />
          <Image
            src="/logo-bescheiben.png"
            alt="Bescheiben"
            width={32}
            height={32}
            className="relative rounded-xl object-cover w-8 h-8"
            priority
          />
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-none">Bescheiben</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}>
            Portal de Aprovação
          </p>
        </div>
        {/* Botão fechar no mobile */}
        <button
          className="ml-auto lg:hidden p-1 rounded-lg text-white/40 hover:text-white/80"
          onClick={() => setOpen(false)}
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} className="sidebar-icon shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={12} style={{ color: 'var(--color-accent)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* User card */}
      <div className="px-3 pb-4 border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg mb-2"
             style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
               style={{ background: 'var(--color-accent)' }}>
            {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{profile?.full_name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}>
              {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'client' ? 'Cliente' : 'Visualizador'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left"
          style={{ color: '#EF4444', opacity: 0.8 }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Botão hamburger mobile (visível só em telas < lg) ── */}
      <button
        className="fixed top-3.5 left-4 z-40 lg:hidden p-2 rounded-lg"
        style={{ background: 'var(--sidebar-bg)', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={18} className="text-white/70" />
      </button>

      {/* ── Overlay escuro mobile ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar desktop: sempre visível ── */}
      <div className="hidden lg:flex shrink-0 h-full">
        {sidebarContent}
      </div>

      {/* ── Sidebar mobile: drawer deslizante ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </div>
    </>
  )
}
