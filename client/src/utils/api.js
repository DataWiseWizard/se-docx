import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', // Vite proxy handles the rest
    withCredentials: true, // IMPORTANT: Sends HttpOnly cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;