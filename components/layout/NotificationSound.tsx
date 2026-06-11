'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotificationSoundProps {
  userId: string
}

export default function NotificationSound({ userId }: NotificationSoundProps) {
  const audioCtx = useRef<AudioContext | null>(null)

  function playSound() {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtx.current
      // Dois bipes suaves
      ;[0, 150].forEach(delay => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay / 1000)
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + delay / 1000 + 0.15)
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.25)
        osc.start(ctx.currentTime + delay / 1000)
        osc.stop(ctx.currentTime + delay / 1000 + 0.25)
      })
    } catch {}
  }

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const type = payload.new?.type
          // Toca som para aprovação do cliente ou comentário
          if (['post_aprovado', 'cliente_comentou', 'ajuste_solicitado'].includes(type)) {
            playSound()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return null
}
