// app/(auth)/layout.tsx
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'linear-gradient(135deg, #0F1117 0%, #1a1c2e 50%, #12141F 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'var(--color-accent)', filter: 'blur(80px)' }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 rounded-full opacity-10 pointer-events-none"
        style={{ background: '#8B5CF6', filter: 'blur(80px)' }}
      />

      <div className="relative z-10 w-full max-w-[360px] sm:max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          {/* Logo image - quadrada, com glow sutil */}
          <div className="relative mb-3">
            <div
              className="absolute inset-0 rounded-2xl opacity-40 blur-xl scale-110"
              style={{ background: 'var(--color-accent)' }}
            />
            <Image
              src="/logo-bescheiben.png"
              alt="Bescheiben Digital Agency"
              width={72}
              height={72}
              className="relative rounded-2xl object-cover w-14 h-14 sm:w-[72px] sm:h-[72px]"
              priority
            />
          </div>

          <h1 className="text-white font-bold text-lg sm:text-xl tracking-tight leading-tight text-center">
            Portal de Aprovação
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Bescheiben Digital Agency
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
