import axios from 'axios';

export const baseURL = 'http://127.0.0.1:8000/';

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(async (config) => {
  // Prefer SimpleJWT 'access' token; fallback to legacy 'authToken'
  const token = localStorage.getItem('access') || localStorage.getItem('authToken');
  

  // List of public (unauthenticated) API paths
  const publicRoutes = ['api/register/', 'api/login/'];
  const isPublic = publicRoutes.some((path) => config.url.includes(path));

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default instance;
