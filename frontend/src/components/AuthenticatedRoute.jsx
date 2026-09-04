import { Navigate, Outlet } from 'react-router-dom'
import { getStoredUser, getToken } from '../api/client.js'

export default function AuthenticatedRoute() {
  if (getToken()) return <Outlet />
  const loginPath = getStoredUser()?.role === 'ADMIN' ? '/admin/login' : '/login'
  return <Navigate to={loginPath} replace />
}
