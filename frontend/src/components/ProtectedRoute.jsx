import { Navigate, Outlet } from 'react-router-dom'
import { getStoredUser, getToken } from '../api/client.js'

export default function ProtectedRoute() {
  if (!getToken()) return <Navigate to="/login" replace />
  if (getStoredUser()?.role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Outlet />
}
