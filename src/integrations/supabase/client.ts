// MongoDB API Client
// This replaces the Supabase client with direct API calls to the Express backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add token if available
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  },

  auth: {
    async signUp(email: string, password: string, fullName: string) {
      return apiClient.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      });
    },

    async signIn(email: string, password: string) {
      return apiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    async signOut() {
      localStorage.removeItem('token');
      return Promise.resolve();
    },

    async getProfile() {
      try {
        return await apiClient.request('/auth/profile');
      } catch {
        return null;
      }
    },
  },

  classes: {
    async getAll() {
      return apiClient.request('/classes');
    },

    async getById(id: string) {
      return apiClient.request(`/classes/${id}`);
    },

    async create(data: any) {
      return apiClient.request('/classes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: any) {
      return apiClient.request(`/classes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async delete(id: string) {
      return apiClient.request(`/classes/${id}`, {
        method: 'DELETE',
      });
    },
  },

  exams: {
    async getAll() {
      return apiClient.request('/exams');
    },

    async getById(id: string) {
      return apiClient.request(`/exams/${id}`);
    },

    async create(data: any) {
      return apiClient.request('/exams', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  users: {
    async getAll() {
      return apiClient.request('/users');
    },

    async getById(id: string) {
      return apiClient.request(`/users/${id}`);
    },

    async create(data: any) {
      return apiClient.request('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: any) {
      return apiClient.request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  schools: {
    async getAll() {
      return apiClient.request('/schools');
    },

    async getById(id: string) {
      return apiClient.request(`/schools/${id}`);
    },

    async create(data: any) {
      return apiClient.request('/schools', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};
