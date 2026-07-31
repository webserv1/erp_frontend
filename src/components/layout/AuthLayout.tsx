import type { ReactNode } from 'react'
import { Building2 } from 'lucide-react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => (
  <main className="grid min-h-screen bg-card lg:grid-cols-2">
    <section className="hidden flex-col justify-between bg-sidebar p-12 text-white lg:flex">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-primary text-secondary"><Building2 /></div>
        <span className="text-xl font-bold">A-ERP</span>
      </div>
      <div>
        <p className="text-4xl font-bold leading-tight">Clarity for every<br /><span className="text-primary">business decision.</span></p>
        <p className="mt-5 max-w-md text-white/65">Secure operations, thoughtfully designed for modern teams.</p>
      </div>
      <p className="text-sm text-white/45">© {new Date().getFullYear()} A-ERP</p>
    </section>
    <section className="flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="mb-5 grid size-11 place-items-center rounded-xl bg-primary text-secondary lg:hidden"><Building2 /></div>
          <h1 className="text-3xl font-bold text-secondary">{title}</h1>
          <p className="mt-2 text-text-secondary">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  </main>
)
