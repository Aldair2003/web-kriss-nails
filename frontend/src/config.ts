// URL de la API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001');
export const NEXT_PUBLIC_API_URL = API_URL; 