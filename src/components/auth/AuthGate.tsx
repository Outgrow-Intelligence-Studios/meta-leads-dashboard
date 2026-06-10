import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isAuthorizedEmail } from '@/lib/auth'
import LoginCard from './LoginCard'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || !isAuthorizedEmail(session.user.email)) {
        setSession(false)
      } else {
        setSession(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || !isAuthorizedEmail(session.user.email)) {
        setSession(false)
      } else {
        setSession(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === null) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#ed1c24]" />
      </div>
    )
  }

  if (!session) {
    return <LoginCard onAuthenticated={() => setSession(true)} />
  }

  return <>{children}</>
}
