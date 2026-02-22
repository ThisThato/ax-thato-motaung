import axios from "axios";
import { getSession } from "./session";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5167/api"
});

api.interceptors.request.use((config) => {
    const session = getSession();
    if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
    }
    return config;
});

export default api;
