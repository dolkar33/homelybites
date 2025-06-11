import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
};

// Recipe API calls
export const recipeAPI = {
  getRecipes: (params = {}) => api.get('/recipes/', { params }),
  getRecipe: (id) => api.get(`/recipes/${id}/`),
  createRecipe: (recipeData) => api.post('/recipes/', recipeData),
  updateRecipe: (id, recipeData) => api.put(`/recipes/${id}/`, recipeData),
  deleteRecipe: (id) => api.delete(`/recipes/${id}/`),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (userData) => api.put('/users/profile/', userData),
};

export default api; 