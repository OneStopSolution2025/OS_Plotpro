import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import api from '../api/client'

const CURRENCIES = ['INR', 'MYR', 'SGD', 'AED', 'AUD', 'LKR']

export default function Signup() {
  const [form, setForm] = useState({
    company_name: '', subdomain: '', contact_email: '', contact_phone: '',
    country: 'India', currency: 'INR', admin_full_name: '', admin_password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/tenants/signup', form)
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit your application')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink px-4">
        <div className="doc-card p-9 w-full max-w-md text-center">
          <CheckCircle2 className="mx-auto text-brand-600 mb-4" size={40} />
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Application submitted</h1>
          <p className="text-sm text-ink/60 mb-6">
            Thanks, {form.company_name}! Your promoter account is now pending review by OS2 Studio.
            You'll be able to log in with the email and password you set once it's approved.
          </p>
          <Link to="/login" className="text-brand-600 font-medium hover:underline text-sm">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4 py-10">
      <div className="doc-card p-9 w-full max-w-lg">
        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center font-display font-bold text-white text-lg mb-4">P</div>
        <p className="text-xs uppercase tracking-widest text-brand-600 font-medium mb-1">Become a Promoter</p>
        <h1 className="font-display text-2xl font-bold text-ink mb-1">Sign up for OS2 PlotPro</h1>
        <p className="text-sm text-ink/60 mb-6">
          Set up your real estate business account. OS2 Studio reviews and activates every
          new signup before you can log in.
        </p>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input placeholder="Company name" required value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            className="border border-ink/15 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          <input placeholder="Choose a subdomain (e.g. dreamcity)" required value={form.subdomain}
            onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/\s+/g, '') })}
            className="border border-ink/15 rounded-lg px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none" />
          <input placeholder="Contact email" type="email" required value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            className="border border-ink/15 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          <input placeholder="Contact phone" value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            className="border border-ink/15 rounded-lg px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none" />
          <input placeholder="Country" value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="border border-ink/15 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="border border-ink/15 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Your full name" required value={form.admin_full_name}
            onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })}
            className="border border-ink/15 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          <input placeholder="Choose a password" type="password" required value={form.admin_password}
            onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
            className="border border-ink/15 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />

          {error && <p className="col-span-2 text-sm text-rust-500 font-medium">{error}</p>}

          <button type="submit" disabled={submitting} className="col-span-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
        </form>

        <p className="text-sm text-ink/50 mt-5 text-center">
          Already approved? <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
