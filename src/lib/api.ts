import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

const ACCESS_TOKEN_KEY = 'admin_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const message = error?.response?.data?.message;
    const isAccessTokenExpired = error?.response?.status === 401 && message === 'Access token expired';

    if (!isAccessTokenExpired || originalRequest._retried) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      window.location.assign('/login');
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    if (isRefreshing) {
      // A refresh is already in flight — queue this request until it resolves.
      return new Promise((resolve, reject) => {
        pendingQueue.push(() => {
          api(originalRequest).then(resolve).catch(reject);
        });
      });
    }

    isRefreshing = true;
    try {
      const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
      const payload = res.data?.data;
      if (!payload?.accessToken) throw new Error('Refresh response missing accessToken');

      setTokens(payload.accessToken, payload.refreshToken);
      pendingQueue.forEach((run) => run());
      pendingQueue = [];

      return api(originalRequest);
    } catch (refreshError) {
      clearTokens();
      pendingQueue = [];
      window.location.assign('/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export type AdminStats = {
  restaurants: number;
  activeUsers: number;
  pendingApprovals: number;
  revenueToday: number;
  ordersToday: number;
  avgOrderValue: number;
  statusBreakdown: { status: string; count: number }[];
  dailyRevenue: { date: string; revenue: number }[];
};

export type RestaurantListItem = {
  id: string;
  name: string;
  status: string;
  category: string;
  addressCity: string | null;
  email: string | null;
  ownerEmail: string;
  createdAt: string;
  bagCount: number;
  orderCount: number;
};

export type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const authApi = {
  async login(payload: { email: string; password: string }) {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },
};

export const adminApi = {
  async stats() {
    const { data } = await api.get<{ success: boolean; data: AdminStats }>('/admin/stats');
    return data;
  },

  async listRestaurants(params?: { status?: string; page?: number; search?: string }) {
    const { data } = await api.get<{ success: boolean; data: Paginated<RestaurantListItem> }>(
      '/admin/restaurants',
      { params }
    );
    return data;
  },

  async getRestaurant(id: string) {
    const { data } = await api.get('/admin/restaurants/' + id);
    return data;
  },

  async updateRestaurantStatus(id: string, status: string) {
    const { data } = await api.patch('/admin/restaurants/' + id + '/status', { status });
    return data;
  },
};

export function formatCurrency(value: number | undefined | null) {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(value);
}