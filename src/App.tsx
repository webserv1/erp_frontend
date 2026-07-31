import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './components/ui'
import { AuthGate } from './utils/Auth-gate/AuthGate'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <AuthProvider><AuthGate /></AuthProvider>
    </ToastProvider>
  </QueryClientProvider>
)
