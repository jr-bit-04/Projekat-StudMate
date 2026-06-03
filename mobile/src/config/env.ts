const fallbackApiUrl = "http://192.168.0.100:5000/api";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || fallbackApiUrl;

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
export const EXPO_EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() || "";
