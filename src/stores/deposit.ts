import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Deposit {
  id: string;
  residentId: string;
  residentName?: string;
  siteId?: string;
  siteName?: string;
  binId: string;
  binName?: string;
  weight: number;
  wasteType: 'kitchen' | 'garden';
  pointsEarned?: number;
  points?: number;
  createdAt: string;
}

interface DepositFilters {
  siteId?: string;
  residentId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedDeposits {
  deposits: Deposit[];
  total: number;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface DepositState {
  deposits: Deposit[];
  total: number;
  currentDeposit: Deposit | null;
  loading: boolean;
  createDeposit: (data: {
    residentId?: string;
    siteId?: string;
    binId: string;
    weight: number;
    wasteType: 'kitchen' | 'garden';
    points?: number;
  }) => Promise<Deposit>;
  fetchDeposits: (filters?: DepositFilters) => Promise<void>;
}

export const useDepositStore = create<DepositState>((set) => ({
  deposits: [],
  total: 0,
  currentDeposit: null,
  loading: false,

  createDeposit: async (data) => {
    const result = await api.post<{ deposit: Deposit; user?: any }>('/deposits', data);
    const deposit = {
      ...result.deposit,
      points: result.deposit.points ?? result.deposit.pointsEarned,
    };
    set((s) => ({ deposits: [deposit, ...s.deposits], currentDeposit: deposit }));
    return deposit;
  },

  fetchDeposits: async (filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.siteId) params.set('siteId', filters.siteId);
      if (filters?.residentId) params.set('residentId', filters.residentId);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
      const qs = params.toString();
      const result = await api.get<PaginatedDeposits>(
        `/deposits${qs ? `?${qs}` : ''}`,
      );
      const enrichedDeposits = result.deposits.map((d) => ({
        ...d,
        points: d.points ?? d.pointsEarned,
      }));
      set({ deposits: enrichedDeposits, total: result.total ?? result.pagination?.total ?? 0 });
    } finally {
      set({ loading: false });
    }
  },
}));
