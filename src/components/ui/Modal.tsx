import { type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export const Modal = ({ open, onClose, title, children, footer }: ModalProps) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border-gold bg-card shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border-gold px-5 py-4">
          <h3 className="text-lg font-bold text-secondary">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-primary/10 hover:text-secondary">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-3 border-t border-border-gold px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
