import apiClient from './api'

export const updateUserProfile = async (data) => {
  const response = await apiClient.put('/users/profile', data)
  return response.data
}

const userService = {
  updateUserProfile,
}

export default userService
