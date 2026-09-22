import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './components/ui'
import { GlobalLoaderOverlay, GlobalLoaderProvider } from './components/ui/GlobalLoader'
import { AuthGate } from './utils/Auth-gate/AuthGate'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalLoaderProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthGate />
          <GlobalLoaderOverlay />
        </AuthProvider>
      </ToastProvider>
    </GlobalLoaderProvider>
  </QueryClientProvider>
)
