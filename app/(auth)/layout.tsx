// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0F1117 0%, #1a1c2e 50%, #12141F 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'var(--color-accent)', filter: 'blur(80px)' }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-72 h-72 rounded-full opacity-10 pointer-events-none"
        style={{ background: '#8B5CF6', filter: 'blur(80px)' }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3"
            style={{ background: 'var(--color-accent)' }}
          >
            B
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">Portal de Aprovação</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Bescheiben Digital Agency
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
