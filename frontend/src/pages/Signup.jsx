import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Building2, User, CreditCard } from 'lucide-react'
import api from '../api/client'

const CURRENCIES = [
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'LKR', label: 'LKR — Sri Lankan Rupee' },
]

const PLANS = [
  { value: 'trial', label: 'Trial', desc: 'Free — try it out with limited usage' },
  { value: 'basic', label: 'Basic', desc: 'For a single project, small team' },
  { value: 'pro', label: 'Pro', desc: 'Multiple projects, larger team' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Unlimited, priority support' },
]

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink block mb-1">
        {label}{required && <span className="text-rust-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-ink/40 mt-1">{hint}</p>}
    </div>
  )
}

const inputClass = "w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition"

export default function Signup() {
  const [form, setForm] = useState({
    company_name: '', subdomain: '', contact_email: '', contact_phone: '',
    country: 'India', currency: 'INR', admin_full_name: '', admin_password: '',
    subscription_plan: 'trial',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const subdomainValid = /^[a-z0-9]+$/.test(form.subdomain)
  const passwordValid = form.admin_password.length >= 6
  const passwordsMatch = form.admin_password === confirmPassword && confirmPassword.length > 0
  const canSubmit = form.company_name && subdomainValid && form.contact_email &&
    form.admin_full_name && passwordValid && passwordsMatch

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!canSubmit) {
      setError('Please complete all required fields correctly before submitting.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/tenants/signup', form)
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit your application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-panel px-4">
        <div className="doc-card p-9 w-full max-w-md text-center">
          <CheckCircle2 className="mx-auto text-brand-600 mb-4" size={40} />
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Application submitted</h1>
          <p className="text-sm text-ink/60 mb-6">
            Thanks, {form.company_name}! Your promoter account is pending review by OS2 Studio.
            You'll be able to sign in with <span className="font-medium text-ink">{form.contact_email}</span> and
            the password you set, once your account is approved.
          </p>
          <Link to="/login" className="text-brand-600 font-medium hover:underline text-sm">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-panel px-4 py-10">
      <div className="doc-card p-6 sm:p-9 w-full max-w-xl">
        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center font-display font-bold text-white text-lg mb-4">P</div>
        <p className="text-xs uppercase tracking-widest text-brand-600 font-medium mb-1">Become a Promoter</p>
        <h1 className="font-display text-2xl font-bold text-ink mb-1">Sign up for OS2 PlotPro</h1>
        <p className="text-sm text-ink/60 mb-6">
          OS2 Studio reviews and approves every new signup before your account can be used.
        </p>

        <form onSubmit={submit} className="space-y-6">
          {/* Section 1: Company */}
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-ink mb-3">
              <Building2 size={15} className="text-brand-600" /> Company details
            </p>
            <div className="space-y-3">
              <Field label="Company name" required>
                <input value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="e.g. Dream City Promoters"
                  className={inputClass} />
              </Field>
              <Field
                label="Your subdomain"
                required
                hint="Lowercase letters and numbers only — this is what your customers use to log into their portal."
              >
                <input value={form.subdomain}
                  onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                  placeholder="e.g. dreamcity"
                  className={`${inputClass} font-mono`} />
                {form.subdomain && !subdomainValid && (
                  <p className="text-xs text-rust-500 mt-1">Only lowercase letters and numbers allowed.</p>
                )}
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Country">
                  <input value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className={inputClass} />
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className={inputClass}>
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* Section 2: Your login */}
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-ink mb-3">
              <User size={15} className="text-brand-600" /> Your admin login
            </p>
            <div className="space-y-3">
              <Field label="Your full name" required>
                <input value={form.admin_full_name}
                  onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })}
                  className={inputClass} />
              </Field>
              <Field label="Email (used to sign in)" required>
                <input type="email" value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className={inputClass} />
              </Field>
              <Field label="Phone">
                <input value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className={`${inputClass} font-mono`} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Password" required hint="At least 6 characters">
                  <input type="password" value={form.admin_password}
                    onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                    className={inputClass} />
                </Field>
                <Field label="Confirm password" required>
                  <input type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass} />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-rust-500 mt-1">Passwords don't match.</p>
                  )}
                </Field>
              </div>
            </div>
          </div>

          {/* Section 3: Plan */}
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-ink mb-3">
              <CreditCard size={15} className="text-brand-600" /> Choose a plan
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, subscription_plan: p.value })}
                  className={`text-left p-3 rounded-lg border transition ${
                    form.subscription_plan === p.value
                      ? 'border-brand-500 bg-brand-500/15'
                      : 'border-ink/15 hover:border-ink/30'
                  }`}
                >
                  <p className="text-sm font-medium text-ink">{p.label}</p>
                  <p className="text-xs text-ink/50 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-rust-500 font-medium">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60">
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
