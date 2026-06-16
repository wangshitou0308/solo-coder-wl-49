import { useEffect, useState } from 'react';
import {
  Recycle,
  Cloud,
  MapPin,
  Users,
  Filter,
  Thermometer,
  RotateCw,
  AlertTriangle,
  Wheat,
  Trophy,
  Scale,
  Leaf,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDashboardStore } from '@/stores/dashboard';
import { useCompostStore, type BinStage } from '@/stores/compost';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

const stageLabels: Record<string, string> = {
  filling: '填充期',
  fermenting: '高温发酵期',
  maturing: '降温腐熟期',
  harvested: '已出肥',
};

const stageColors: Record<string, string> = {
  filling: 'bg-compost-pale text-compost-green',
  fermenting: 'bg-orange-100 text-orange-700',
  maturing: 'bg-blue-100 text-blue-700',
  harvested: 'bg-amber-100 text-amber-800',
};

const statusLabels: Record<string, string> = {
  normal: '正常',
  alert: '告警',
  idle: '闲置',
};

const statusColors: Record<string, string> = {
  normal: 'text-compost-green',
  alert: 'text-alert-orange',
  idle: 'text-gray-400',
};

interface DailyChecklist {
  pendingMonitoringCount: number;
  pendingTurningCount: number;
  pendingAlertsCount: number;
  pendingHarvestCount: number;
}

function AdminManagerDashboard({ role }: { role: 'admin' | 'manager' }) {
  const { stats, fetchDashboard, loading } = useDashboardStore();
  const { sites, fetchSites } = useCompostStore();
  const [siteFilter, setSiteFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null);

  useEffect(() => {
    fetchSites();
    fetchDashboard({});
    api.get<DailyChecklist>('/tasks/daily-checklist').then(setChecklist).catch(() => {});
  }, []);

  const handleFilter = () => {
    fetchDashboard({
      siteId: siteFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const statCards = [
    {
      label: '当日回收总量',
      value: stats?.todayWeight ?? 0,
      unit: 'kg',
      icon: Recycle,
      color: 'text-compost-green',
      bg: 'bg-compost-pale/50',
    },
    {
      label: '累计减碳量',
      value: stats?.totalCarbonReduction ?? 0,
      unit: 'kg CO₂',
      icon: Cloud,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '活跃堆肥点',
      value: stats?.activeSites ?? 0,
      unit: '个',
      icon: MapPin,
      color: 'text-compost-light',
      bg: 'bg-compost-pale/30',
    },
    {
      label: '今日投放人次',
      value: stats?.todayDepositors ?? 0,
      unit: '人',
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  const taskCards = [
    {
      label: '待测温湿度',
      value: checklist?.pendingMonitoringCount ?? 0,
      icon: Thermometer,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '待翻堆',
      value: checklist?.pendingTurningCount ?? 0,
      icon: RotateCw,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: '待处理告警',
      value: checklist?.pendingAlertsCount ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: '待出肥',
      value: checklist?.pendingHarvestCount ?? 0,
      icon: Wheat,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
  ];

  const maxWeight = stats
    ? Math.max(...stats.topResidents.map((r) => r.totalWeight ?? 0), 1)
    : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-serif font-bold text-[#1B4332]">
        {role === 'admin' ? '数据看板' : '我的看板'}
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">日常任务</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {taskCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl ${card.bg} p-4 flex items-center gap-3`}
            >
              <card.icon className={`w-8 h-8 ${card.color}`} />
              <div>
                <div className="text-2xl font-bold text-[#1B4332]">{card.value}</div>
                <div className="text-xs text-gray-500">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none"
          >
            <option value="">全部堆肥点</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none"
          placeholder="开始日期"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none"
          placeholder="结束日期"
        />
        <button
          onClick={handleFilter}
          className="px-4 py-2 rounded-lg bg-[#2D6A4F] text-white text-sm hover:bg-[#245a42] transition-colors"
        >
          筛选
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1B4332]">
                {loading ? '...' : card.value}
                <span className="text-sm font-normal text-gray-400 ml-1">{card.unit}</span>
              </div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">月度趋势</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats?.monthlyTrend ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="weight"
              name="回收量(kg)"
              stroke="#2D6A4F"
              strokeWidth={2}
              dot={{ fill: '#2D6A4F', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="carbonReduction"
              name="减碳量(kg CO₂)"
              stroke="#52B788"
              strokeWidth={2}
              dot={{ fill: '#52B788', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">堆肥点状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stats?.siteStatuses ?? sites).map((site) => (
            <div
              key={site.siteId ?? site.id}
              className="border border-gray-100 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-[#1B4332]">{site.siteName ?? site.name}</span>
                <span className={`text-xs font-medium ${statusColors[(site as { status?: string }).status ?? 'normal']}`}>
                  {statusLabels[(site as { status?: string }).status ?? 'normal'] ?? '正常'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(site.bins ?? []).map((bin: { binName: string; stage: BinStage }, i: number) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded-full ${stageColors[bin.stage]}`}
                  >
                    {bin.binName}: {stageLabels[bin.stage]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">投放排行 Top 10</h2>
        <div className="space-y-3">
          {(stats?.topResidents ?? []).map((r) => (
            <div key={r.residentId} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                (r.rank ?? 0) <= 3 ? 'bg-compost-green text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {r.rank}
              </span>
              <span className="text-sm text-gray-700 w-20 truncate">{r.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full bg-compost-light rounded-full transition-all"
                  style={{ width: `${((r.totalWeight ?? 0) / maxWeight) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-16 text-right">{r.totalWeight ?? 0} kg</span>
            </div>
          ))}
          {(!stats?.topResidents?.length) && (
            <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ResidentDashboard() {
  const { user } = useAuthStore();
  const { stats, fetchDashboard, loading } = useDashboardStore();

  useEffect(() => {
    if (user?.id) {
      fetchDashboard({ residentId: user.id });
    }
  }, [user?.id]);

  const personalCards = [
    {
      label: '我的积分',
      value: user?.points ?? 0,
      unit: '分',
      icon: Trophy,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: '投放次数',
      value: stats?.todayDepositors ?? 0,
      unit: '次',
      icon: Scale,
      color: 'text-compost-green',
      bg: 'bg-compost-pale/50',
    },
    {
      label: '回收总量',
      value: stats?.todayWeight ?? 0,
      unit: 'kg',
      icon: Recycle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '减碳贡献',
      value: stats?.totalCarbonReduction ?? 0,
      unit: 'kg CO₂',
      icon: Leaf,
      color: 'text-compost-light',
      bg: 'bg-compost-pale/30',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-serif font-bold text-[#1B4332]">我的看板</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {personalCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1B4332]">
                {loading ? '...' : card.value}
                <span className="text-sm font-normal text-gray-400 ml-1">{card.unit}</span>
              </div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">近期投放</h2>
        <div className="space-y-3">
          {(stats?.topResidents ?? []).slice(0, 10).map((r, i) => (
            <div key={r.residentId ?? i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <span className="text-sm text-gray-700">{r.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{r.totalWeight ?? 0} kg</span>
                <span className="text-compost-green font-medium">{r.totalPoints ?? r.points ?? 0} 分</span>
              </div>
            </div>
          ))}
          {(!stats?.topResidents?.length) && (
            <p className="text-sm text-gray-400 text-center py-4">暂无投放记录</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">积分概览</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-compost-pale/30 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-[#1B4332]">{user?.points ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">当前积分</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-[#1B4332]">{stats?.totalCarbonReduction ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">减碳贡献 (kg CO₂)</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">月度趋势</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats?.monthlyTrend ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="weight"
              name="回收量(kg)"
              stroke="#2D6A4F"
              strokeWidth={2}
              dot={{ fill: '#2D6A4F', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="carbonReduction"
              name="减碳量(kg CO₂)"
              stroke="#52B788"
              strokeWidth={2}
              dot={{ fill: '#52B788', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const role = user?.role ?? 'resident';

  if (role === 'admin' || role === 'manager') {
    return <AdminManagerDashboard role={role} />;
  }

  return <ResidentDashboard />;
}
