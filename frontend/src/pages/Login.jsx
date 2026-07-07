import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
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
        <div className="w-10 h-10 bg-brand-600 flex items-center justify-center font-display font-bold text-white text-lg mb-4">P</div>
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
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 transition disabled:opacity-60"
          >
            <LogIn size={16} />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-ink/50 mt-5 text-center">
          New promoter? <Link to="/signup" className="text-brand-600 font-medium hover:underline">Sign up here</Link>
        </p>
      </div>
    </div>
  )
}
