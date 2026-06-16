import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Thermometer, RotateCw, Wheat, AlertTriangle, Package, Clock, QrCode, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useCompostStore, type BinStage } from '@/stores/compost';

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

type DetailTab = 'deposits' | 'monitoring' | 'turning' | 'harvest' | 'alerts';

interface StageRecord {
  id: string;
  fromStage: string;
  toStage: string;
  operator: string;
  createdAt: string;
}

interface DepositRecord {
  id: string;
  weight: number;
  wasteType: string;
  wasteTag: string;
  pointsEarned: number;
  createdAt: string;
}

interface MonitoringRecord {
  id: string;
  temperature: number;
  humidity: number;
  note: string;
  createdAt: string;
}

interface TurningRecord {
  id: string;
  operator: string;
  note: string;
  createdAt: string;
}

interface HarvestRecord {
  id: string;
  weight: number;
  batchNumber: string;
  note: string;
  createdAt: string;
}

interface AlertRecord {
  id: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
}

interface BinDetailData {
  bin: { id: string; name: string; stage: BinStage; qrCode?: string };
  site: { id: string; name: string };
  recentDeposits: DepositRecord[];
  recentMonitoring: MonitoringRecord[];
  recentTurning: TurningRecord[];
  recentHarvest: HarvestRecord[];
  recentAlerts: AlertRecord[];
  stageRecords: StageRecord[];
}

const wasteTypeLabels: Record<string, string> = { kitchen: '厨余', garden: '园林' };

const tabConfig: { key: DetailTab; label: string; icon: typeof Package }[] = [
  { key: 'deposits', label: '投放记录', icon: Package },
  { key: 'monitoring', label: '温湿度记录', icon: Thermometer },
  { key: 'turning', label: '翻堆记录', icon: RotateCw },
  { key: 'harvest', label: '出肥记录', icon: Wheat },
  { key: 'alerts', label: '告警记录', icon: AlertTriangle },
];

export default function BinDetail() {
  const { binId } = useParams<{ binId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<BinDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>('deposits');

  useEffect(() => {
    if (!binId) return;
    setLoading(true);
    api.get<BinDetailData>(`/tasks/bins/${binId}/detail`)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [binId]);

  if (loading) {
    return <div className="text-center text-gray-400 py-12">加载中...</div>;
  }

  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">箱体未找到</p>
        <button onClick={() => navigate(-1)} className="text-compost-green hover:underline">
          返回
        </button>
      </div>
    );
  }

  const { bin, site, stageRecords, recentDeposits, recentMonitoring, recentTurning, recentHarvest, recentAlerts } = detail;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-compost-green transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-bold text-[#1B4332]">{bin.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{site.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stageColors[bin.stage] ?? 'bg-gray-100 text-gray-600'}`}>
              {stageLabels[bin.stage] ?? bin.stage}
            </span>
            <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-compost-green hover:border-compost-green transition-colors">
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1B4332] mb-4 flex items-center gap-1.5">
          <Clock className="w-4 h-4" /> 阶段记录
        </h2>
        {stageRecords.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">暂无阶段记录</p>
        ) : (
          <div className="space-y-4">
            {stageRecords.map((sr, i) => (
              <div key={sr.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-compost-light" />
                  {i < stageRecords.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stageColors[sr.fromStage] ?? 'bg-gray-100 text-gray-600'}`}>
                      {stageLabels[sr.fromStage] ?? sr.fromStage}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stageColors[sr.toStage] ?? 'bg-gray-100 text-gray-600'}`}>
                      {stageLabels[sr.toStage] ?? sr.toStage}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {sr.operator} · {sr.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabConfig.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
              tab === key ? 'bg-[#2D6A4F] text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'deposits' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {recentDeposits.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无投放记录</p>
          ) : (
            <div className="space-y-3">
              {recentDeposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">
                      {d.weight}kg · {wasteTypeLabels[d.wasteType] ?? d.wasteType}
                      {d.wasteTag ? ` · ${d.wasteTag}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">{d.createdAt}</p>
                  </div>
                  <span className="text-sm text-compost-green font-medium">+{d.pointsEarned}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'monitoring' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {recentMonitoring.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无温湿度记录</p>
          ) : (
            <div className="space-y-3">
              {recentMonitoring.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">
                      <Thermometer className="w-3.5 h-3.5 inline mr-1 text-orange-500" />
                      {m.temperature}°C · {m.humidity}%
                    </p>
                    {m.note && <p className="text-xs text-gray-400 mt-0.5">{m.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{m.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'turning' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {recentTurning.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无翻堆记录</p>
          ) : (
            <div className="space-y-3">
              {recentTurning.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{t.operator}</p>
                    {t.note && <p className="text-xs text-gray-400 mt-0.5">{t.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{t.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'harvest' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {recentHarvest.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无出肥记录</p>
          ) : (
            <div className="space-y-3">
              {recentHarvest.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">
                      {h.weight}kg · 批次 {h.batchNumber}
                    </p>
                    {h.note && <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{h.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {recentAlerts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无告警记录</p>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                      {a.type} · {a.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.createdAt} · <span className={a.status === 'active' ? 'text-red-500' : 'text-compost-green'}>{a.status === 'active' ? '未处理' : '已处理'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
