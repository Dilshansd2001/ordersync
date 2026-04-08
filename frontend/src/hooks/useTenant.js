import { useMemo } from 'react'
import { useAuth } from './useAuth'

export const useTenant = () => {
  const { business, user } = useAuth()
  const businessId = business?.id || user?.businessId || null

  return useMemo(
    () => ({
      businessId,
      hasTenant: Boolean(businessId),
    }),
    [businessId]
  )
}
