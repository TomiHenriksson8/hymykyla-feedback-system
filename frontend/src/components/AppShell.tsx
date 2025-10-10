
import { Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Outlet />
    </div>
  )
}
