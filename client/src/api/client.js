import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("auth");

  if (stored) {
    const session = JSON.parse(stored);

    if (session.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      const stored = localStorage.getItem("auth");

      if (stored) {
        localStorage.removeItem("auth");
      }

      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;

      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign(loginUrl);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
