import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SelectRole from './pages/SelectRole.jsx'
import Setup from './pages/Setup.jsx'
import Ready from './pages/Ready.jsx'
import Session from './pages/Session.jsx'
import Results from './pages/Results.jsx'
import Progress from './pages/Progress.jsx'
import AllSessions from './pages/AllSessions.jsx'
import Admin from './pages/Admin.jsx'
import Profile from './pages/Profile.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/role" element={<SelectRole />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/ready" element={<Ready />} />
        <Route path="/session" element={<Session />} />
        <Route path="/results" element={<Results />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/sessions" element={<AllSessions />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
