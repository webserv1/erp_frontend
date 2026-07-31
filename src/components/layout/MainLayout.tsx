import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return <div className="flex min-h-screen bg-white"><AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="min-w-0 flex-1"><AppHeader onMenuClick={() => setSidebarOpen(true)} /><main className="p-5 lg:p-8"><Outlet /></main></div></div>
}
