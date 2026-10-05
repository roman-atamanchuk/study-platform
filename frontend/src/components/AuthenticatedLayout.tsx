import { Outlet } from 'react-router-dom'
import { AppLayout } from './AppLayout'

export function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
