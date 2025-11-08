// src/lib/api.ts
import axios from 'axios';

// Prefer a Vite env var, fall back to '/api'
const API_BASE =
    import.meta.env.VITE_API_BASE?.trim() || '/api';

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true, // keep if you use cookies/sessions
});
