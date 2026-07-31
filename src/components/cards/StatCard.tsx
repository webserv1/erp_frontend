import type { LucideIcon } from 'lucide-react'
import { Card } from '../ui'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export const StatCard = ({ label, value, icon: Icon, description }: StatCardProps) => (
  <Card hoverable className="p-6">
    <div className="mb-5 grid size-11 place-items-center rounded-lg bg-primary/15 text-primary-dark">
      <Icon size={22} />
    </div>
    <p className="text-sm text-text-secondary">{label}</p>
    <p className="mt-1 text-lg font-bold text-secondary">{value}</p>
    {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
  </Card>
)
