import { Tag } from 'lucide-react'
import { Card } from '../../components/ui'
import { NavLink } from 'react-router-dom'

const masters = [
  { label: 'Product Masters', description: 'Manage categories, brands, colors, and sizes', icon: Tag, path: '/product-masters/category' },
]

export const ProductMasters = () => {
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary-dark">PRODUCT MASTERS</p>
        <h2 className="mt-1 text-3xl font-bold text-secondary">Manage Masters</h2>
        <p className="mt-2 text-text-secondary">Configure product attributes in one place.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {masters.map(({ label, description, icon: Icon, path }) => (
          <NavLink key={path} to={path}>
            <Card hoverable className="p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 grid size-12 place-items-center rounded-lg bg-primary/15 text-primary-dark">
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-secondary">{label}</h3>
              <p className="mt-1 text-sm text-text-secondary">{description}</p>
            </Card>
          </NavLink>
        ))}
      </div>
    </>
  )
}
