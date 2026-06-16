import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  type: 'fertilizer' | 'plant';
  category?: 'fertilizer' | 'plant';
  pointsPrice: number;
  points_price?: number;
  stock: number;
  imageUrl?: string;
  image?: string;
  batchId?: string;
}

export interface Order {
  id: string;
  residentId: string;
  productId: string;
  productName?: string;
  quantity: number;
  totalPoints: number;
  total_points?: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

interface ProductFilters {
  category?: 'fertilizer' | 'plant';
  type?: 'fertilizer' | 'plant';
}

interface StoreState {
  products: Product[];
  orders: Order[];
  loading: boolean;
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  exchange: (productId: string, quantity: number, residentId?: string) => Promise<Order>;
  fetchOrders: (residentId?: string) => Promise<void>;
}

export const useStoreStore = create<StoreState>((set, get) => ({
  products: [],
  orders: [],
  loading: false,

  fetchProducts: async (filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      const type = filters?.type ?? filters?.category;
      if (type) params.set('type', type);
      const qs = params.toString();
      const products = await api.get<Product[]>(`/store/products${qs ? `?${qs}` : ''}`);
      const enriched = products.map((p) => ({
        ...p,
        category: p.category ?? p.type,
        pointsPrice: p.pointsPrice ?? p.points_price ?? 0,
      }));
      set({ products: enriched });
    } finally {
      set({ loading: false });
    }
  },

  exchange: async (productId, quantity, residentId) => {
    const { user } = (await import('@/stores/auth')).useAuthStore.getState();
    const result = await api.post<{ order: Order; user?: any }>('/store/exchange', {
      productId,
      residentId: residentId ?? user?.id,
      quantity,
    });
    const order = {
      ...result.order,
      totalPoints: result.order.totalPoints ?? result.order.total_points ?? 0,
    };
    set((s) => ({
      orders: [order, ...s.orders],
      products: s.products.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock - quantity) } : p,
      ),
    }));
    return order;
  },

  fetchOrders: async (residentId) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (residentId) params.set('residentId', residentId);
      const qs = params.toString();
      const orders = await api.get<Order[]>(`/store/orders${qs ? `?${qs}` : ''}`);
      const enriched = orders.map((o) => ({
        ...o,
        totalPoints: o.totalPoints ?? o.total_points ?? 0,
      }));
      set({ orders: enriched });
    } finally {
      set({ loading: false });
    }
  },
}));
