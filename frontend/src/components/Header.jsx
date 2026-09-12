import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {UserPen} from 'lucide-react'


function Header({ title, role }) {
  const navigate = useNavigate()
   const { logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="header">
      <h2>{title}</h2>
      <div className="header-right">
        <span className="role-tag">{role}</span>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
        <button onClick={() => navigate('/profile')} className="btn-profile">
          <UserPen />
        </button>
      </div>
    </header>
  )
}

export default Header
