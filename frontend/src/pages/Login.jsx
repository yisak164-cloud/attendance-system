import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'


function Login() {
  const navigate = useNavigate()

  // false = show login form, true = show register form
  const [showRegister, setShowRegister] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const {login} = useAuth()

  
  async function handleLogin(event) {
    event.preventDefault()
    setError('')

    try {
      const user= await login(email, password)

     
      navigate('/' + user.role)

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      await api.post('/auth/register', { fullName, email, password })
      setMessage('Student account created. You can log in now.')
      setShowRegister(false)

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Attendance System</h1>
        <p className="subtitle">
          {showRegister ? 'Create a new account' : 'Sign in to continue'}
        </p>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <form onSubmit={showRegister ? handleRegister : handleLogin}>
          {showRegister && (
            <div className="field">
              <label>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {showRegister && (
            <p className="note">
              You are signing up as a <strong>student</strong>. Only an admin can
              create teacher or admin accounts.
            </p>
          )}

          <button type="submit" className="btn-main">
            {showRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="switch">
          {showRegister ? 'Already have an account?' : 'No account yet?'}{' '}
          <span onClick={() => { setShowRegister(!showRegister); setError('') }}>
            {showRegister ? 'Login' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  )
}

export default Login
