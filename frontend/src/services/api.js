import axios from 'axios'
import { isDesktopRuntime } from '@/platform/runtime'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ordersync_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (isDesktopRuntime()) {
        return Promise.reject(error)
      }

      localStorage.removeItem('ordersync_token')
      localStorage.removeItem('ordersync_user')
      localStorage.removeItem('ordersync_business')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
