import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Alert {
  id: string;
  binId: string;
  binName: string;
  siteId?: string;
  siteName?: string;
  type: 'high_temp' | 'low_temp' | 'high_humidity' | 'low_humidity';
  message: string;
  suggestion: string;
  status: 'active' | 'resolved';
  resolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  resolvedNote?: string;
  createdAt: string;
}

export interface MonitoringRecord {
  id: string;
  binId: string;
  binName?: string;
  siteId?: string;
  siteName?: string;
  type: 'temperature_humidity' | 'turning' | 'harvest';
  data: Record<string, unknown>;
  operator?: string;
  createdAt: string;
}

interface AlertFilters {
  siteId?: string;
  status?: 'active' | 'resolved';
}

interface MonitoringState {
  alerts: Alert[];
  records: MonitoringRecord[];
  loading: boolean;
  recordMonitoring: (data: {
    siteId?: string;
    binId: string;
    data: { temperature: number; humidity: number };
    note?: string;
  }) => Promise<void>;
  recordTurning: (data: {
    siteId?: string;
    binId: string;
    operator: string;
    data?: { note?: string };
  }) => Promise<void>;
  recordHarvest: (data: {
    siteId?: string;
    binId: string;
    data: { weight: number; note?: string };
  }) => Promise<{ batchNumber: string }>;
  fetchAlerts: (filters?: AlertFilters) => Promise<void>;
  resolveAlert: (id: string, data: { action: string; note?: string }) => Promise<void>;
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
  alerts: [],
  records: [],
  loading: false,

  recordMonitoring: async (data) => {
    await api.post('/monitoring/records', {
      binId: data.binId,
      temperature: data.data.temperature,
      humidity: data.data.humidity,
      note: data.note,
    });
  },

  recordTurning: async (data) => {
    await api.post('/monitoring/turning', {
      binId: data.binId,
      operator: data.operator,
      note: data.data?.note,
    });
  },

  recordHarvest: async (data) => {
    const result = await api.post<{ harvest: any; batchNumber: string }>('/monitoring/harvest', {
      binId: data.binId,
      weight: data.data.weight,
      note: data.data.note,
    });
    return { batchNumber: result.batchNumber };
  },

  fetchAlerts: async (filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.siteId) params.set('siteId', filters.siteId);
      if (filters?.status) params.set('status', filters.status);
      const qs = params.toString();
      const alerts = await api.get<Alert[]>(`/monitoring/alerts${qs ? `?${qs}` : ''}`);
      const enriched = alerts.map((a) => ({
        ...a,
        resolved: a.status === 'resolved',
        resolvedNote: a.resolvedNote ?? a.resolutionNote,
      }));
      set({ alerts: enriched });
    } finally {
      set({ loading: false });
    }
  },

  resolveAlert: async (id, data) => {
    const alert = await api.put<Alert>(`/monitoring/alerts/${id}/resolve`, data);
    const enriched = {
      ...alert,
      resolved: alert.status === 'resolved',
      resolvedNote: alert.resolvedNote ?? alert.resolutionNote,
    };
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? enriched : a)),
    }));
  },
}));
