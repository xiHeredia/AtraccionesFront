import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://atracciones.onrender.com/api/v1",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const token = user?.token || user?.accessToken || user?.jwt;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.response?.data?.title || error?.response?.data?.error || error.message || "Error inesperado";
    return Promise.reject({ ...error, userMessage: message });
  }
);

export default api;
