import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
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

// API endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
}

export const postsAPI = {
  getPosts: (page = 1, limit = 10) => api.get(`/posts?page=${page}&limit=${limit}`),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  likePost: (id) => api.post(`/posts/${id}/like`),
  addComment: (id, content) => api.post(`/posts/${id}/comments`, { content }),
  getUserPosts: (userId, page = 1, limit = 10) => api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`),
}

export const usersAPI = {
  getUsers: (page = 1, limit = 20) => api.get(`/users?page=${page}&limit=${limit}`),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  followUser: (id) => api.post(`/users/${id}/follow`),
  getFollowers: (id, page = 1, limit = 20) => api.get(`/users/${id}/followers?page=${page}&limit=${limit}`),
  getFollowing: (id, page = 1, limit = 20) => api.get(`/users/${id}/following?page=${page}&limit=${limit}`),
  searchUsers: (query, page = 1, limit = 10) => api.get(`/users/search/${query}?page=${page}&limit=${limit}`),
}

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  createConversation: (data) => api.post('/messages/conversations', data),
  getMessages: (conversationId, page = 1, limit = 50) => api.get(`/messages/${conversationId}?page=${page}&limit=${limit}`),
  sendMessage: (data) => api.post('/messages', data),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  editMessage: (messageId, content) => api.put(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
}

export const generateAPI = {
  generateImage: (data) => api.post('/generate/image', data),
  validatePrompt: (prompt) => api.post('/generate/validate-prompt', { prompt }),
  getModels: () => api.get('/generate/models'),
}

export default api
