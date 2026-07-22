import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const CustomerAuthContext = createContext(null)

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

  const requestOtp = async (phone) => {
    await api.post('/customer-auth/request-otp', { phone })
  }

  const verifyOtp = async (phone, otpCode) => {
    const res = await api.post('/customer-auth/verify-otp', {
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
