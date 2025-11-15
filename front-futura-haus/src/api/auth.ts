import axios from 'axios'
import { getValidToken } from '@/utils/jwt'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    
  },
})

api.interceptors.request.use(
  (config) => {
    const token = getValidToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const register = async (email: string, password: string) => {
  const response = await api.post('/auth/register', { email, password })
  return response.data
}

export const login = async (email: string, password: string) => {
  const loginData = {
    email,
    password,
  }
  const response = await api.post('/auth/login', loginData)
  return response.data
}

export default api