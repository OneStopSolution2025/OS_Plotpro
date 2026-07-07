import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const CustomerAuthContext = createContext(null)

// Each promoter has their own subdomain (e.g. "dreamcity") — the portal is
// typically deployed at dreamcity.plotpro.app with this baked in via env var,
// but for local/dev use we just remember whatever the customer typed in.
const SUBDOMAIN_KEY = 'plotpro_tenant_subdomain'

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('plotpro_customer_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/customer-auth/me')
      .then((res) => setCustomer(res.data))
      .catch(() => localStorage.removeItem('plotpro_customer_token'))
      .finally(() => setLoading(false))
  }, [])

  const requestOtp = async (tenantSubdomain, phone) => {
    localStorage.setItem(SUBDOMAIN_KEY, tenantSubdomain)
    await api.post('/customer-auth/request-otp', { tenant_subdomain: tenantSubdomain, phone })
  }

  const verifyOtp = async (tenantSubdomain, phone, otpCode) => {
    const res = await api.post('/customer-auth/verify-otp', {
      tenant_subdomain: tenantSubdomain,
      phone,
      otp_code: otpCode,
    })
    localStorage.setItem('plotpro_customer_token', res.data.access_token)
    const me = await api.get('/customer-auth/me')
    setCustomer(me.data)
    return me.data
  }

  const logout = () => {
    localStorage.removeItem('plotpro_customer_token')
    setCustomer(null)
  }

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, requestOtp, verifyOtp, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext)
}
