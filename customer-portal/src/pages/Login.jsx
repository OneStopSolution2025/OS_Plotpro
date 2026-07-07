import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function Login() {
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [subdomain, setSubdomain] = useState(localStorage.getItem('plotpro_tenant_subdomain') || '')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { requestOtp, verifyOtp } = useCustomerAuth()
  const navigate = useNavigate()

  const sendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestOtp(subdomain, phone)
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send OTP')
    } finally {
      setLoading(false)
    }
  }

  const confirmOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyOtp(subdomain, phone, otp)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-brand-700 mb-1">My Plot</h1>
        <p className="text-sm text-gray-500 mb-6">
          {step === 'phone' ? 'Sign in with your registered phone number' : 'Enter the OTP sent to your phone'}
        </p>

        {step === 'phone' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Promoter code</label>
              <input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                required
                placeholder="e.g. dreamcity"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">Given to you by your plot promoter</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+91XXXXXXXXXX"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmOtp} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">OTP code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                placeholder="6-digit code"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-sm text-gray-500 hover:underline"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
