import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Thermometer,
  RotateCw,
  AlertTriangle,
  Wheat,
  Clock,
  ChevronRight,
  Filter,
  MapPin,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface TaskItem {
  id: string;
  binName: string;
  siteId: string;
  siteName: string;
  stage: string;
  stageStartedAt: string;
  daysInStage: number;
  message?: string;
  suggestion?: string;
  type?: string;
  status?: string;
}

interface DailyChecklist {
  pendingMonitoring: TaskItem[];
  pendingMonitoringCount: number;
  pendingTurning: TaskItem[];
  pendingTurningCount: number;
  pendingAlerts: TaskItem[];
  pendingAlertsCount: number;
  pendingHarvest: TaskItem[];
  pendingHarvestCount: number;
}

type TaskFilter = 'all' | 'monitoring' | 'turning' | 'alerts' | 'harvest';

const stageLabels: Record<string, string> = {
  filling: '填充期',
  fermenting: '高温发酵期',
  maturing: '降温腐熟期',
  harvested: '已出肥',
};

const stageDefaultDays: Record<string, number> = {
  filling: 14,
  fermenting: 10,
  maturing: 30,
};

const typeConfig: Record<string, { label: string; icon: typeof Thermometer; color: string; bg: string }> = {
  monitoring: { label: '待测温湿度', icon: Thermometer, color: 'text-blue-600', bg: 'bg-blue-50' },
  turning: { label: '待翻堆', icon: RotateCw, color: 'text-orange-600', bg: 'bg-orange-50' },
  alerts: { label: '待处理告警', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  harvest: { label: '待出肥', icon: Wheat, color: 'text-amber-700', bg: 'bg-amber-50' },
};

const filterOptions: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: '全部任务' },
  { key: 'monitoring', label: '待测温湿度' },
  { key: 'turning', label: '待翻堆' },
  { key: 'alerts', label: '待处理告警' },
  { key: 'harvest', label: '待出肥' },
];

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get<DailyChecklist>('/tasks/daily-checklist');
      setChecklist(data);
    } finally {
      setLoading(false);
    }
  };

  const getAllTasks = () => {
    if (!checklist) return [];
    const tasks: Array<TaskItem & { taskType: TaskFilter }> = [];
    if (filter === 'all' || filter === 'monitoring') {
      checklist.pendingMonitoring.forEach((t) => tasks.push({ ...t, taskType: 'monitoring' }));
    }
    if (filter === 'all' || filter === 'turning') {
      checklist.pendingTurning.forEach((t) => tasks.push({ ...t, taskType: 'turning' }));
    }
    if (filter === 'all' || filter === 'alerts') {
      checklist.pendingAlerts.forEach((t) => tasks.push({ ...t, taskType: 'alerts' }));
    }
    if (filter === 'all' || filter === 'harvest') {
      checklist.pendingHarvest.forEach((t) => tasks.push({ ...t, taskType: 'harvest' }));
    }
    return tasks;
  };

  const totalTasks = checklist
    ? checklist.pendingMonitoringCount + checklist.pendingTurningCount + checklist.pendingAlertsCount + checklist.pendingHarvestCount
    : 0;

  const filteredTasks = getAllTasks();

  const getActionLabel = (task: TaskItem & { taskType: TaskFilter }) => {
    switch (task.taskType) {
      case 'monitoring':
        return '去测温';
      case 'turning':
        return '去翻堆';
      case 'alerts':
        return '处理告警';
      case 'harvest':
        return '去出肥';
      default:
        return '去处理';
    }
  };

  const getTaskDescription = (task: TaskItem & { taskType: TaskFilter }) => {
    switch (task.taskType) {
      case 'monitoring':
        return `今日尚未测量温湿度`;
      case 'turning':
        return `已超过3天未翻堆`;
      case 'alerts':
        return task.message || '存在异常告警';
      case 'harvest':
        return `腐熟期已超过30天，建议出肥`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#1B4332]">日常任务清单</h1>
          <p className="text-sm text-gray-500 mt-1">管理堆肥日常运维任务</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-lg bg-[#2D6A4F] text-white text-sm hover:bg-[#245a42] transition-colors"
        >
          刷新
        </button>
      </div>

      {checklist && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(typeConfig).map(([key, config]) => {
            const count = checklist[`${key}Count` as keyof DailyChecklist] as number;
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setFilter(key as TaskFilter)}
                className={`rounded-xl ${config.bg} p-4 flex items-center gap-3 transition-all ${
                  filter === key ? 'ring-2 ring-offset-2 ring-compost-green' : ''
                }`}
              >
                <Icon className={`w-8 h-8 ${config.color}`} />
                <div className="text-left">
                  <div className="text-2xl font-bold text-[#1B4332]">{count}</div>
                  <div className="text-xs text-gray-500">{config.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as TaskFilter)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none"
            >
              {filterOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-500">
            共 {filteredTasks.length} 条待处理任务
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">加载中...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">暂无待处理任务</p>
          <p className="text-xs text-gray-300 mt-1">太棒了，所有任务都已完成！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task, index) => {
            const config = typeConfig[task.taskType];
            const Icon = config.icon;
            return (
              <div
                key={`${task.taskType}-${task.id}-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-[#1B4332]">{task.siteName}</h3>
                          <span className="text-sm text-gray-600">- {task.binName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.stage === 'filling' ? 'bg-compost-pale text-compost-green' :
                            task.stage === 'fermenting' ? 'bg-orange-100 text-orange-700' :
                            task.stage === 'maturing' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {stageLabels[task.stage] || task.stage}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {getTaskDescription(task)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {task.siteName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            本阶段已运行 {task.daysInStage} 天
                            {stageDefaultDays[task.stage] && `（建议 ${stageDefaultDays[task.stage]} 天）`}
                          </span>
                        </div>
                        {task.suggestion && (
                          <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded px-2 py-1">
                            建议：{task.suggestion}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {task.taskType === 'alerts' ? (
                          <button
                            onClick={() => navigate('/monitor/alerts')}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600 transition-colors flex items-center gap-1"
                          >
                            {getActionLabel(task)}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/compost-sites/${task.siteId}`)}
                            className="px-3 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs hover:bg-[#245a42] transition-colors flex items-center gap-1"
                          >
                            {getActionLabel(task)}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {task.taskType === 'monitoring' && (
                          <button
                            onClick={() => navigate('/monitor')}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:border-compost-green hover:text-compost-green transition-colors"
                          >
                            监控录入
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
