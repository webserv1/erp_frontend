import { BrowserRouter } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { AppRoutes } from '../../routes'

export const AuthGate = () => {
  const { isLoading } = useAuth()
  if (isLoading) return <div className="grid min-h-screen place-items-center bg-card"><LoaderCircle className="animate-spin text-primary" size={34} /></div>
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}
