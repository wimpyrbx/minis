import axios from 'axios'

const API_URL = 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_URL
})

export const getDatabase = async () => {
  try {
    const response = await api.get('/status')
    console.log('Database connection status:', response.data)
    return response.data
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// Add this to test the connection
export const testConnection = async () => {
  try {
    const status = await getDatabase()
    return status.status === 'connected'
  } catch (error) {
    return false
  }
} 