import { create } from 'zustand';
import { api } from '@/lib/api';

export type BinStage = 'filling' | 'fermenting' | 'maturing' | 'harvested';

export interface Bin {
  id: string;
  name: string;
  qrCode?: string;
  stage: BinStage;
  stageStartedAt?: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  siteId: string;
}

export interface CompostSite {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  bins: Bin[];
  binCount?: number;
  status: 'normal' | 'alert' | 'idle' | 'active' | 'inactive';
  createdAt: string;
}

interface CreateSiteData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  bins?: Array<{
    name: string;
    stage?: BinStage;
    tempMin?: number;
    tempMax?: number;
    humidityMin?: number;
    humidityMax?: number;
  }>;
}

interface CompostState {
  sites: CompostSite[];
  currentSite: CompostSite | null;
  bins: Bin[];
  loading: boolean;
  fetchSites: () => Promise<void>;
  fetchSite: (id: string) => Promise<void>;
  createSite: (data: CreateSiteData) => Promise<void>;
  addBin: (siteId: string, data: Partial<Bin>) => Promise<void>;
  updateBin: (siteId: string, binId: string, data: Partial<Bin>) => Promise<void>;
  advanceStage: (siteId: string, binId: string) => Promise<void>;
}

export const useCompostStore = create<CompostState>((set, get) => ({
  sites: [],
  currentSite: null,
  bins: [],
  loading: false,

  fetchSites: async () => {
    set({ loading: true });
    try {
      const sites = await api.get<CompostSite[]>('/compost-sites');
      set({ sites });
    } finally {
      set({ loading: false });
    }
  },

  fetchSite: async (id) => {
    set({ loading: true });
    try {
      const site = await api.get<CompostSite>(`/compost-sites/${id}`);
      set({ currentSite: site, bins: site.bins || [] });
    } finally {
      set({ loading: false });
    }
  },

  createSite: async (data) => {
    const site = await api.post<CompostSite>('/compost-sites', data);
    set((s) => ({ sites: [...s.sites, site] }));
  },

  addBin: async (siteId, data) => {
    const bin = await api.post<Bin>(`/compost-sites/${siteId}/bins`, data);
    const site = get().sites.find((s) => s.id === siteId);
    if (site) {
      const updated = { ...site, bins: [...(site.bins || []), bin] };
      set((s) => ({
        sites: s.sites.map((st) => (st.id === siteId ? updated : st)),
        currentSite: s.currentSite?.id === siteId ? updated : s.currentSite,
        bins: s.currentSite?.id === siteId ? updated.bins : s.bins,
      }));
    }
  },

  updateBin: async (siteId, binId, data) => {
    const bin = await api.put<Bin>(`/compost-sites/${siteId}/bins/${binId}`, data);
    const updateBins = (bins: Bin[]) => bins.map((b) => (b.id === binId ? bin : b));
    set((s) => {
      const sites = s.sites.map((st) =>
        st.id === siteId ? { ...st, bins: updateBins(st.bins || []) } : st,
      );
      const currentSite =
        s.currentSite?.id === siteId ? { ...s.currentSite, bins: updateBins(s.currentSite.bins || []) } : s.currentSite;
      return { sites, currentSite, bins: currentSite?.bins ?? s.bins };
    });
  },

  advanceStage: async (siteId, binId) => {
    const bin = await api.post<Bin>(`/compost-sites/${siteId}/bins/${binId}/advance-stage`);
    const updateBins = (bins: Bin[]) => bins.map((b) => (b.id === binId ? bin : b));
    set((s) => {
      const sites = s.sites.map((st) =>
        st.id === siteId ? { ...st, bins: updateBins(st.bins || []) } : st,
      );
      const currentSite =
        s.currentSite?.id === siteId ? { ...s.currentSite, bins: updateBins(s.currentSite.bins || []) } : s.currentSite;
      return { sites, currentSite, bins: currentSite?.bins ?? s.bins };
    });
  },
}));
