import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { accountLabel } from '../data/cloudState'
import { cloudEnabled, supabase } from '../data/supabaseClient'

type AccountContextValue = {
  cloud: boolean
  ready: boolean
  userId: string | null
  email: string
  label: string
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AccountContext = createContext<AccountContextValue | null>(null)

export function AccountProvider({ children }: { children: ReactNode }) {
  const cloud = cloudEnabled()
  const [ready, setReady] = useState(!cloud)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AccountContextValue>(() => {
    const user = session?.user
    return {
      cloud,
      ready,
      userId: user?.id ?? null,
      email: user?.email ?? '',
      label: user ? accountLabel(user.email, user.user_metadata) : '',
      signIn: async (email, password) => {
        if (!supabase) return 'Login ainda não configurado.'
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (!error) return null
        if (error.message.toLowerCase().includes('invalid')) {
          return 'E-mail ou senha não conferem.'
        }
        return 'Não foi possível entrar. Tente de novo.'
      },
      signOut: async () => {
        await supabase?.auth.signOut()
      },
    }
  }, [cloud, ready, session])

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount deve estar dentro de AccountProvider')
  return ctx
}
