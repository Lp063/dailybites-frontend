import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
