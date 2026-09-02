import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { apiGet, getStoredUser, getToken } from '../api/client.js'

export default function AdminRoute() {
  const [role, setRole] = useState(() => getStoredUser()?.role || null)
  const [checking, setChecking] = useState(Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) {
      setChecking(false)
      return
    }

    let active = true
    apiGet('/me')
      .then((user) => {
        if (active) setRole(user.role)
      })
      .catch(() => {
        if (active) setRole(null)
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => { active = false }
  }, [])

  if (!getToken()) return <Navigate to="/admin/login" replace />
  if (checking) return <div className="screen" aria-busy="true" />
  return role === 'ADMIN' ? <Outlet /> : <Navigate to="/dashboard" replace />
}
