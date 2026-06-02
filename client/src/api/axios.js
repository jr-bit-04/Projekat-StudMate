import axios from "axios";

export const SERVER_BASE_URL = `http://${window.location.hostname}:5000`;
export const API_BASE_URL = `${SERVER_BASE_URL}/api`;

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
