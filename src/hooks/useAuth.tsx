import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../services/auth.api'
import type { AuthUser, LoginResponse } from '../types/auth.types'

const TOKEN_KEY = 'erp_access_token'
const USER_KEY = 'erp_user'
const LAST_LOGOUT_KEY = 'erp_last_logout'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  lastLogoutAt: string | null
  login: (data: LoginResponse) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastLogoutAt, setLastLogoutAt] = useState<string | null>(() => localStorage.getItem(LAST_LOGOUT_KEY))

  useEffect(() => {
    const hydrate = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (!storedToken) return setIsLoading(false)
      try {
        const { user: currentUser } = await authApi.me(storedToken)
        setToken(storedToken); setUser(currentUser)
      } catch {
        localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY)
      } finally { setIsLoading(false) }
    }
    void hydrate()
  }, [])

  const login = useCallback((data: LoginResponse) => {
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    localStorage.removeItem(LAST_LOGOUT_KEY)
    setLastLogoutAt(null)
    setToken(data.token); setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    const now = new Date().toISOString()
    localStorage.setItem(LAST_LOGOUT_KEY, now)
    setLastLogoutAt(now)
    try { await authApi.logout() } finally {
      localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY)
      setToken(null); setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, token, isLoading, lastLogoutAt, login, logout }), [user, token, isLoading, lastLogoutAt, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
