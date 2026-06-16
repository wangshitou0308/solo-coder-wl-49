import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Package,
  Users,
  ShoppingBag,
  User,
  Coins,
  Thermometer,
  AlertTriangle,
  QrCode,
  Trophy,
  Scale,
  Leaf,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useCompostStore } from '@/stores/compost';
import { useDepositStore } from '@/stores/deposit';
import { useDashboardStore } from '@/stores/dashboard';
import { api } from '@/lib/api';

interface QuickAction {
  to: string;
  label: string;
  icon: typeof Package;
  color: string;
  bg: string;
  description: string;
}

interface StageReminder {
  id: string;
  binName: string;
  siteId: string;
  siteName: string;
  stage: string;
  stageStartedAt: string;
  daysInStage: number;
}

const stageLabels: Record<string, string> = {
  filling: '填充期',
  fermenting: '高温发酵期',
  maturing: '降温腐熟期',
  harvested: '已出肥',
};

const stageSuggestion: Record<string, string> = {
  filling: '建议推进至发酵期',
  fermenting: '建议推进至腐熟期',
  maturing: '建议出肥',
};

const stageDefaultDays: Record<string, number> = {
  filling: 14,
  fermenting: 10,
  maturing: 30,
};

function AdminHome() {
  const navigate = useNavigate();
  const { sites, fetchSites } = useCompostStore();
  const { stats, fetchDashboard } = useDashboardStore();
  const [reminders, setReminders] = useState<StageReminder[]>([]);

  useEffect(() => {
    fetchSites();
    fetchDashboard({});
    api.get<StageReminder[]>('/tasks/stage-reminders').then(setReminders).catch(() => {});
  }, []);

  const quickActions: QuickAction[] = [
    { to: '/users', label: '用户管理', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', description: '管理居民和堆肥管理员账号' },
    { to: '/compost-sites', label: '堆肥点配置', icon: MapPin, color: 'text-compost-green', bg: 'bg-compost-pale/50', description: '配置堆肥点和箱体参数' },
    { to: '/monitor', label: '日常监控', icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-50', description: '录入温湿度数据' },
    { to: '/monitor/alerts', label: '告警中心', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', description: '处理异常告警' },
    { to: '/store', label: '积分商城', icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50', description: '管理兑换商品' },
    { to: '/dashboard', label: '数据看板', icon: LayoutDashboard, color: 'text-purple-600', bg: 'bg-purple-50', description: '查看运营数据统计' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#1B4332]">管理员工作台</h1>
        <p className="text-sm text-gray-500 mt-1">欢迎回来，管理社区堆肥运营</p>
      </div>

      {reminders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <h2 className="text-base font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" /> 阶段到期提醒
          </h2>
          <div className="space-y-2">
            {reminders.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white/80 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.siteName} - {r.binName}</p>
                    <p className="text-xs text-gray-500">
                      {stageLabels[r.stage]}已运行 {r.daysInStage} 天（建议 {stageDefaultDays[r.stage]} 天）
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/compost-sites/${r.siteId}`)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  {stageSuggestion[r.stage]}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-compost-green/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#1B4332]">{action.label}</h3>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-compost-green transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-[#1B4332] mb-4">堆肥点概览</h2>
          <div className="space-y-3">
            {sites.slice(0, 5).map((site) => (
              <div key={site.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{site.name}</p>
                  <p className="text-xs text-gray-500">{site.bins?.length || 0} 个箱体</p>
                </div>
                <button
                  onClick={() => navigate(`/compost-sites/${site.id}`)}
                  className="text-xs text-compost-green hover:underline"
                >
                  查看
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-[#1B4332] mb-4">今日投放统计</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-compost-pale/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-compost-green">{stats?.todayWeight || 0}</div>
              <div className="text-xs text-gray-500 mt-1">今日回收 (kg)</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.todayDepositors || 0}</div>
              <div className="text-xs text-gray-500 mt-1">投放人次</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/deposit/records')}
            className="w-full py-2 text-sm text-compost-green border border-compost-green/30 rounded-lg hover:bg-compost-pale/50 transition-colors"
          >
            查看全部记录
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagerHome() {
  const navigate = useNavigate();
  const { sites, fetchSites } = useCompostStore();
  const [reminders, setReminders] = useState<StageReminder[]>([]);

  useEffect(() => {
    fetchSites();
    api.get<StageReminder[]>('/tasks/stage-reminders').then(setReminders).catch(() => {});
  }, []);

  const quickActions: QuickAction[] = [
    { to: '/deposit', label: '扫码投放', icon: QrCode, color: 'text-compost-green', bg: 'bg-compost-pale/50', description: '扫描二维码投放废弃物' },
    { to: '/monitor', label: '日常监控', icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-50', description: '录入温湿度数据' },
    { to: '/monitor/alerts', label: '告警中心', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', description: '处理异常告警' },
    { to: '/compost-sites', label: '箱体管理', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50', description: '查看和管理箱体' },
    { to: '/dashboard', label: '我的看板', icon: LayoutDashboard, color: 'text-purple-600', bg: 'bg-purple-50', description: '查看日常任务和数据' },
    { to: '/deposit/records', label: '投放记录', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', description: '查看投放历史记录' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#1B4332]">堆肥管理员工作台</h1>
        <p className="text-sm text-gray-500 mt-1">欢迎回来，管理堆肥日常运维</p>
      </div>

      {reminders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <h2 className="text-base font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" /> 待处理任务
          </h2>
          <div className="space-y-2">
            {reminders.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white/80 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.siteName} - {r.binName}</p>
                    <p className="text-xs text-gray-500">
                      {stageLabels[r.stage]}已运行 {r.daysInStage} 天，{stageSuggestion[r.stage]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/compost-sites/${r.siteId}`)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  去处理
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-compost-green/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#1B4332]">{action.label}</h3>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-compost-green transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">负责堆肥点</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((site) => (
            <div key={site.id} className="border border-gray-100 rounded-lg p-4 hover:border-compost-green/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">{site.name}</h3>
                <button
                  onClick={() => navigate(`/compost-sites/${site.id}`)}
                  className="text-xs text-compost-green hover:underline"
                >
                  管理
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">{site.address}</p>
              <div className="flex flex-wrap gap-1.5">
                {(site.bins || []).map((bin) => (
                  <span
                    key={bin.id}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      bin.stage === 'filling' ? 'bg-compost-pale text-compost-green' :
                      bin.stage === 'fermenting' ? 'bg-orange-100 text-orange-700' :
                      bin.stage === 'maturing' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {bin.name}: {stageLabels[bin.stage]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResidentHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { stats, fetchDashboard } = useDashboardStore();
  const { deposits, fetchDeposits } = useDepositStore();

  useEffect(() => {
    if (user?.id) {
      fetchDashboard({ residentId: user.id });
      fetchDeposits({ residentId: user.id, pageSize: 5 });
    }
  }, [user?.id]);

  const quickActions: QuickAction[] = [
    { to: '/deposit', label: '扫码投放', icon: QrCode, color: 'text-compost-green', bg: 'bg-compost-pale/50', description: '扫描二维码投放废弃物' },
    { to: '/deposit/records', label: '投放记录', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', description: '查看历史投放记录' },
    { to: '/points', label: '积分明细', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50', description: '查看积分收支明细' },
    { to: '/store', label: '积分商城', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50', description: '用积分兑换商品' },
    { to: '/profile', label: '个人中心', icon: User, color: 'text-gray-600', bg: 'bg-gray-50', description: '查看和修改个人信息' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#1B4332]">欢迎，{user?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">参与社区堆肥，共建绿色家园</p>
      </div>

      <div className="bg-gradient-to-br from-[#2D6A4F] to-[#52B788] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm">我的积分</p>
            <div className="flex items-center gap-2 mt-1">
              <Trophy className="w-8 h-8 text-yellow-300" />
              <span className="text-4xl font-bold">{user?.points || 0}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/store')}
            className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            去兑换
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Scale className="w-5 h-5 mx-auto mb-1 text-white/80" />
            <div className="text-xl font-bold">{stats?.todayWeight || 0}</div>
            <div className="text-xs text-white/70">累计投放 (kg)</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Leaf className="w-5 h-5 mx-auto mb-1 text-white/80" />
            <div className="text-xl font-bold">{stats?.totalCarbonReduction || 0}</div>
            <div className="text-xs text-white/70">减碳 (kg CO₂)</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-white/80" />
            <div className="text-xl font-bold">{stats?.todayDepositors || 0}</div>
            <div className="text-xs text-white/70">投放次数</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-[#1B4332] mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center hover:shadow-md hover:border-compost-green/30 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <h3 className="font-medium text-[#1B4332]">{action.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1B4332]">最近投放</h2>
          <button
            onClick={() => navigate('/deposit/records')}
            className="text-xs text-compost-green hover:underline"
          >
            查看全部
          </button>
        </div>
        {deposits.length > 0 ? (
          <div className="space-y-3">
            {deposits.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-compost-pale/50 flex items-center justify-center">
                    <Package className="w-5 h-5 text-compost-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{d.siteName} - {d.binName}</p>
                    <p className="text-xs text-gray-500">{d.createdAt}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#1B4332]">{d.weight} kg</p>
                  <p className="text-xs text-compost-green">+{d.points} 积分</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">暂无投放记录</p>
            <button
              onClick={() => navigate('/deposit')}
              className="mt-3 px-4 py-2 text-sm text-compost-green border border-compost-green/30 rounded-lg hover:bg-compost-pale/50 transition-colors"
            >
              立即投放
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuthStore();
  const role = user?.role || 'resident';

  if (role === 'admin') {
    return <AdminHome />;
  }

  if (role === 'manager') {
    return <ManagerHome />;
  }

  return <ResidentHome />;
}
