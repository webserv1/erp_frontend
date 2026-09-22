import { LoaderCircle } from "lucide-react"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type GlobalLoaderContextValue = {
  isLoading: boolean
}

const GlobalLoaderContext = createContext<GlobalLoaderContextValue | undefined>(
  undefined,
)

export const GlobalLoaderProvider = ({ children }: { children: ReactNode }) => {
  const [pendingRequests, setPendingRequests] = useState(0)
  const isLoading = pendingRequests > 0

  useEffect(() => {
    const originalFetch = globalThis.fetch.bind(globalThis)
    const wrappedFetch: typeof fetch = async (...args) => {
      setPendingRequests((count) => count + 1)
      try {
        return await originalFetch(...args)
      } finally {
        setPendingRequests((count) => Math.max(0, count - 1))
      }
    }

    globalThis.fetch = wrappedFetch
    return () => {
      globalThis.fetch = originalFetch
    }
  }, [])

  const value = useMemo(() => ({ isLoading }), [isLoading])
  return (
    <GlobalLoaderContext.Provider value={value}>
      {children}
    </GlobalLoaderContext.Provider>
  )
}

export const useGlobalLoader = () => {
  const context = useContext(GlobalLoaderContext)
  if (!context) {
    throw new Error("useGlobalLoader must be used inside GlobalLoaderProvider.")
  }
  return context
}

export const GlobalLoaderOverlay = () => {
  const { isLoading } = useGlobalLoader()
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-secondary/10 backdrop-blur-[1px]">
      <div className="rounded-lg border border-border-gold bg-white/95 p-3 text-primary-dark shadow-lg">
        <LoaderCircle className="animate-spin" size={18} />
      </div>
    </div>
  )
}
