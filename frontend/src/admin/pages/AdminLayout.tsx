// src/admin/layouts/AdminLayout.tsx
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSideBar'
import AdminTopbar from '../components/AdminTopBar'

export default function AdminLayout() {
  return (
    <div className="min-h-screen grid grid-cols-[auto_1fr] bg-appbg text-ink">
      {/* Sidebar width animates between w-64 / w-16; the 'auto' column tracks it */}
      <AdminSidebar />

      {/* Right side fills remaining space */}
      <div className="grid grid-rows-[56px_1fr] min-w-0">
        <AdminTopbar />
        <main className="min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
