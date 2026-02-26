import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function AuthDebug() {
  const { user, status, error, authReady } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [directSession, setDirectSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setDirectSession(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setDirectSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (import.meta.env.PROD) return null

  // Force build update: 2026-02-26
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/90 border border-violet-500/50 rounded-lg text-xs font-mono z-50 max-w-sm">
      <h3 className="text-violet-400 font-bold mb-2">Auth Debugger</h3>
      <div className="space-y-1">
        <p>Status: <span className={status === 'authenticated' ? 'text-green-400' : 'text-red-400'}>{status}</span></p>
        <p>Ready: <span className={authReady ? 'text-green-400' : 'text-yellow-400'}>{String(authReady)}</span></p>
        <p>Context User: {user?.email ?? 'null'}</p>
        <p>Direct Session: {directSession?.user?.email ?? 'null'}</p>
        {error && <p className="text-red-500">Error: {error}</p>}
      </div>
    </div>
  )
}
