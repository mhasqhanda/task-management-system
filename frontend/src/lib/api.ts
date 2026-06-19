import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach access token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => api.get('/projects').then((r) => r.data),
  get: (id: string) => api.get(`/projects/${id}`).then((r) => r.data),
  create: (data: { name: string; clientId: string }) =>
    api.post('/projects', data).then((r) => r.data),
  getProgress: (id: string) => api.get(`/projects/${id}/progress`).then((r) => r.data),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (projectId?: string) =>
    api.get('/tasks', { params: projectId ? { projectId } : {} }).then((r) => r.data),
  get: (id: string) => api.get(`/tasks/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/tasks', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
  addDependency: (taskId: string, dependsOnTaskId: string) =>
    api.post(`/tasks/${taskId}/dependencies`, { dependsOnTaskId }).then((r) => r.data),
  removeDependency: (taskId: string, depId: string) =>
    api.delete(`/tasks/${taskId}/dependencies/${depId}`).then((r) => r.data),
  getAudit: (taskId: string) => api.get(`/tasks/${taskId}/audit`).then((r) => r.data),
  getAllAudit: () => api.get('/tasks/audit').then((r) => r.data),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/users').then((r) => r.data),
  listTeam: () => api.get('/users/team').then((r) => r.data),
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const commentsApi = {
  list: (taskId: string) => api.get(`/tasks/${taskId}/comments`).then((r) => r.data),
  create: (taskId: string, content: string) =>
    api.post(`/tasks/${taskId}/comments`, { content }).then((r) => r.data),
  delete: (commentId: string) => api.delete(`/comments/${commentId}`).then((r) => r.data),
};

