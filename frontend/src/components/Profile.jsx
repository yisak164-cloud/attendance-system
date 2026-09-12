// frontend/src/pages/Profile.jsx
import { useState } from 'react'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Header from './Header.jsx'

function Profile() {
  const { user } = useAuth()

  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
     setSaving(true)

    try {
      await api.patch('/auth/profile', {
        currentPassword,
        email,
        newPassword: newPassword || undefined
      })

      

      setMessage('Profile updated successfully')
      setCurrentPassword('')
      setNewPassword('')

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }

    finally{
        setSaving(false)
    }
  }

  return (
    <div>
      <Header title="My Profile" />

      <div className="login-page">
        <div className="login-box">
          <h1>Update Profile</h1>
          <p className="subtitle">Change your email or password</p>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <form onSubmit={handleSubmit}>
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
              <label>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="field">
              <label>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-main" disabled={saving}>
               {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile