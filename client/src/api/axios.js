import axios from "axios";
import { getStoredToken } from "../utils/authStorage";

export const SERVER_BASE_URL = `http://${window.location.hostname}:5000`;
export const API_BASE_URL = `${SERVER_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
