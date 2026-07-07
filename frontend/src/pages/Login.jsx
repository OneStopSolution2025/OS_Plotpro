import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink grid-paper">
      <div className="doc-card p-9 w-full max-w-sm shadow-xl">
        <p className="font-mono text-[11px] tracking-widest uppercase text-brass-600 mb-1">Admin Access</p>
        <h1 className="font-display text-3xl font-semibold text-ink mb-1">OS2 PlotPro</h1>
        <p className="text-sm text-ink/60 mb-7">Sign in to your promoter account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink/70 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink/70 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5 w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600"
            />
          </div>

          {error && <p className="text-sm text-rust-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
