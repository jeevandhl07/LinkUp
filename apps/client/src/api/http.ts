import axios from "axios";

const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const API_URL = envApiUrl && envApiUrl.trim().length > 0
  ? envApiUrl
  : `${window.location.protocol}//${window.location.hostname}:5000/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

let accessToken: string | null = localStorage.getItem("linkup_access_token");

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
  if (token) {
    localStorage.setItem("linkup_access_token", token);
  } else {
    localStorage.removeItem("linkup_access_token");
  }
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original?._retry && !String(original?.url || "").includes("/auth/refresh")) {
      original._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        setAccessToken(data.accessToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);
