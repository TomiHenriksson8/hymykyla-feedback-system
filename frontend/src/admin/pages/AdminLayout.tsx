
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSideBar'
import AdminTopbar from '../components/AdminTopBar'

export default function AdminLayout() {
  return (
    <div className="min-h-screen grid grid-cols-[256px_1fr] bg-appbg text-ink">
      <AdminSidebar />
      <div className="grid grid-rows-[56px_1fr]">
        <AdminTopbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
