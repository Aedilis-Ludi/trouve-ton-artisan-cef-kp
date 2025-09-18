// src/services/api.js
// Client API 

import axios from 'axios';

const isDev = process.env.NODE_ENV !== 'production';
const API_BASE_URL = '/api';


const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    if (isDev) console.log(`[API →] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    if (isDev) console.log(`[API ←] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Utilitaire pour extraire un tableau de la réponse
const extractArray = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return []; // si l'API renvoie un objet vide au lieu d'un tableau
};

/* CATEGORIES */
export const getCategories = async (withStats = false) => {
  const params = withStats ? { with_stats: 'true' } : {};
  const res = await apiClient.get('/categories', { params });
  return { data: extractArray(res.data) };
};

export const getCategoryById = async (categoryId) => {
  const res = await apiClient.get(`/categories/${categoryId}`);
  return { data: res.data };
};

export const getCategorySpecialites = async (categoryId, withArtisansCount = false) => {
  const params = withArtisansCount ? { with_artisans_count: 'true' } : {};
  const res = await apiClient.get(`/categories/${categoryId}/specialites`, { params });
  return { data: extractArray(res.data) };
};

/* ARTISANS  */
export const getArtisans = async (options = {}) => {
  const params = Object.fromEntries(
    Object.entries(options).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const res = await apiClient.get('/artisans', { params });
  return { data: extractArray(res.data) };
};

export const getArtisanById = async (artisanId) => {
  const res = await apiClient.get(`/artisans/${artisanId}`);
  return { data: res.data };
};

export const getArtisansDuMois = async (limit = 3) => {
  const res = await apiClient.get('/artisans/du-mois', { params: { limit } });
  return { data: extractArray(res.data) };
};

export const searchArtisans = async (query, limit = 10) => {
  if (!query || query.trim().length < 2) {
    throw new Error('La recherche doit contenir au moins 2 caractères');
  }
  const res = await apiClient.get('/artisans/search', { params: { q: query.trim(), limit } });
  return { data: extractArray(res.data) };
};

export const getArtisansByCategory = async (categoryId, options = {}) => {
  const res = await apiClient.get(`/categories/${categoryId}/artisans`, { params: options });
  return { data: extractArray(res.data) };
};

export const getArtisansStats = async () => {
  const res = await apiClient.get('/artisans/stats');
  return { data: res.data };
};

/* CONTACT */
export const sendContactMessage = async (artisanId, contactData) => {
  const { nom, email, objet, message } = contactData;

  if (!nom || nom.trim().length < 2) throw new Error('Le nom doit contenir au moins 2 caractères');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email invalide');
  if (!objet || objet.trim().length < 5) throw new Error("L'objet doit contenir au moins 5 caractères");
  if (!message || message.trim().length < 10) throw new Error('Le message doit contenir au moins 10 caractères');

  const res = await apiClient.post(`/contact/${artisanId}`, {
    nom: nom.trim(),
    email: email.trim().toLowerCase(),
    objet: objet.trim(),
    message: message.trim(),
  });
  return { data: res.data };
};

/* UTILITAIRES */
export const checkApiHealth = async () => {
  const res = await apiClient.get('/health');
  return { data: res.data };
};

export const getApiInfo = async () => {
  const res = await apiClient.get('/info');
  return { data: res.data };
};

/* HELPERS UI */
export const formatErrorMessage = (error) => {
  if (axios.isAxiosError?.(error)) {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message || 'Erreur réseau';
    return status ? `${status} — ${msg}` : msg;
  }
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return "Une erreur inattendue s'est produite";
};

export const generateStarRating = (note) => {
  const n = parseFloat(note) || 0;
  const fullStars = Math.floor(n);
  const hasHalfStar = n % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  return { fullStars, hasHalfStar, emptyStars, note: n };
};

export const formatAddress = (artisan) => {
  const parts = [];
  if (artisan?.adresse) parts.push(artisan.adresse);
  if (artisan?.code_postal) parts.push(artisan.code_postal);
  if (artisan?.ville) parts.push(artisan.ville);
  if (artisan?.departement) parts.push(artisan.departement);
  return parts.join(', ');
};

const api = {
  getCategories,
  getCategoryById,
  getCategorySpecialites,
  getArtisans,
  getArtisanById,
  getArtisansDuMois,
  searchArtisans,
  getArtisansByCategory,
  getArtisansStats,
  sendContactMessage,
  checkApiHealth,
  getApiInfo,
  formatErrorMessage,
  generateStarRating,
  formatAddress,
};

export default api;
