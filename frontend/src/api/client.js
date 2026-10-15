import axios from 'axios';
import { auth } from '../lib/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(async (config) => {
  const current = auth?.currentUser;
  if (current) {
    const token = await current.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function apiError(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || fallback;
}

export function apiFieldErrors(error) {
  return error?.response?.data?.errors || {};
}

export default api;
