import axios from "axios";

const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
