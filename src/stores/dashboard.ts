import { create } from 'zustand';
import { api } from '@/lib/api';

export interface SiteStatus {
  siteId: string;
  siteName: string;
  status?: string;
  bins: Array<{ binId?: string; binName: string; name?: string; stage: string }>;
}

export interface MonthlyTrend {
  month: string;
  weight: number;
  count?: number;
  carbonReduction?: number;
}

export interface TopResident {
  rank?: number;
  residentId?: string;
  id?: string;
  name: string;
  totalWeight?: number;
  totalPoints?: number;
  points?: number;
}

export interface DashboardStats {
  todayWeight: number;
  totalCarbonReduction: number;
  activeSites: number;
  todayDepositors: number;
  siteStatuses: SiteStatus[];
  monthlyTrend: MonthlyTrend[];
  topResidents: TopResident[];
}

interface DashboardFilters {
  siteId?: string;
  residentId?: string;
  startDate?: string;
  endDate?: string;
}

interface DashboardState {
  stats: DashboardStats | null;
  filters: DashboardFilters;
  loading: boolean;
  fetchDashboard: (filters?: DashboardFilters) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  filters: {},
  loading: false,

  fetchDashboard: async (filters) => {
    set({ loading: true, filters: filters ?? {} });
    try {
      const params = new URLSearchParams();
      if (filters?.siteId) params.set('siteId', filters.siteId);
      if (filters?.residentId) params.set('residentId', filters.residentId);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      const qs = params.toString();
      const stats = await api.get<DashboardStats>(`/stats/dashboard${qs ? `?${qs}` : ''}`);
      
      const enrichedTrend = stats.monthlyTrend.map((m) => ({
        ...m,
        carbonReduction: m.carbonReduction ?? (m.weight * 0.3),
      }));
      
      const enrichedResidents = stats.topResidents.map((r, i) => ({
        ...r,
        rank: r.rank ?? i + 1,
        residentId: r.residentId ?? String(r.id),
        totalWeight: r.totalWeight ?? 0,
        totalPoints: r.totalPoints ?? r.points ?? 0,
      }));

      set({ stats: { ...stats, monthlyTrend: enrichedTrend, topResidents: enrichedResidents } });
    } finally {
      set({ loading: false });
    }
  },
}));
