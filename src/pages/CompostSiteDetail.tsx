import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Edit2, ChevronRight, Clock, QrCode, ExternalLink } from 'lucide-react';
import { useCompostStore, type BinStage } from '@/stores/compost';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

const stageLabels: Record<string, string> = {
  filling: '填充期',
  fermenting: '高温发酵期',
  maturing: '降温腐熟期',
  harvested: '已出肥',
};

const stageBadge: Record<string, string> = {
  filling: 'bg-compost-pale text-compost-green',
  fermenting: 'bg-orange-100 text-orange-700',
  maturing: 'bg-blue-100 text-blue-700',
  harvested: 'bg-amber-100 text-amber-800',
};

const stageDuration: Record<string, string> = {
  filling: '约14天',
  fermenting: '约10天',
  maturing: '约30天',
};

interface StageRecord {
  id: string;
  binId: string;
  fromStage: string;
  toStage: string;
  operator?: string;
  note?: string;
  createdAt: string;
}

export default function CompostSiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentSite, bins, fetchSite, advanceStage, updateBin, loading } = useCompostStore();
  const [editingBin, setEditingBin] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ tempMin: '', tempMax: '', humidityMin: '', humidityMax: '' });
  const [binStageRecords, setBinStageRecords] = useState<Record<string, StageRecord[]>>({});

  useEffect(() => {
    if (id) fetchSite(id);
  }, [id]);

  useEffect(() => {
    if (bins.length > 0) {
      bins.forEach(async (bin) => {
        try {
          const detail = await api.get<{ stageRecords: StageRecord[] }>(`/tasks/bins/${bin.id}/detail`);
          setBinStageRecords((prev) => ({ ...prev, [bin.id]: detail.stageRecords || [] }));
        } catch {}
      });
    }
  }, [bins.length]);

  const startEdit = (bin: typeof bins[0]) => {
    setEditingBin(bin.id);
    setEditForm({
      tempMin: String(bin.tempMin),
      tempMax: String(bin.tempMax),
      humidityMin: String(bin.humidityMin),
      humidityMax: String(bin.humidityMax),
    });
  };

  const saveEdit = async (binId: string) => {
    if (!id) return;
    await updateBin(id, binId, {
      tempMin: parseFloat(editForm.tempMin) || 0,
      tempMax: parseFloat(editForm.tempMax) || 100,
      humidityMin: parseFloat(editForm.humidityMin) || 0,
      humidityMax: parseFloat(editForm.humidityMax) || 100,
    });
    setEditingBin(null);
  };

  const handleAdvance = async (binId: string) => {
    if (!id) return;
    await advanceStage(id, binId);
    try {
      const detail = await api.get<{ stageRecords: StageRecord[] }>(`/tasks/bins/${binId}/detail`);
      setBinStageRecords((prev) => ({ ...prev, [binId]: detail.stageRecords || [] }));
    } catch {}
  };

  const getDaysInStage = (stageStartedAt?: string) => {
    if (!stageStartedAt) return '-';
    const start = new Date(stageStartedAt);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  if (loading && !currentSite) {
    return <div className="text-center text-gray-400 py-12">加载中...</div>;
  }

  if (!currentSite) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">堆肥点未找到</p>
        <button
          onClick={() => navigate('/compost-sites')}
          className="text-compost-green hover:underline"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/compost-sites')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-compost-green transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 返回堆肥点列表
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h1 className="text-xl font-serif font-bold text-[#1B4332] mb-1">{currentSite.name}</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          {currentSite.address}
        </div>
      </div>

      <h2 className="text-base font-semibold text-[#1B4332]">箱体列表</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(bins ?? []).map((bin) => {
          const records = binStageRecords[bin.id] || [];
          const daysInStage = getDaysInStage((bin as any).stageStartedAt);

          return (
            <div
              key={bin.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#1B4332]">{bin.name}</h3>
                  {(bin as any).qrCode && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                      {(bin as any).qrCode}
                    </span>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stageBadge[bin.stage]}`}>
                  {stageLabels[bin.stage]}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>已{stageLabels[bin.stage]?.replace('期', '') || ''}{daysInStage}天</span>
                </div>
                {stageDuration[bin.stage] && (
                  <span className="text-gray-400">建议{stageDuration[bin.stage]}</span>
                )}
              </div>

              {records.length > 0 && (
                <div className="mb-4 pl-2 border-l-2 border-compost-pale">
                  <p className="text-xs text-gray-400 mb-2 ml-2">阶段时间线</p>
                  {records.map((record, i) => {
                    const nextRecord = records[i - 1];
                    const daysInStageNum = typeof daysInStage === 'number' ? daysInStage : 0;
                    const durationDays = nextRecord
                      ? Math.floor((new Date(nextRecord.createdAt).getTime() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                      : record.toStage === bin.stage
                        ? daysInStageNum
                        : 0;

                    return (
                      <div key={record.id} className="relative ml-2 mb-3">
                        <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-compost-light border-2 border-white flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${stageBadge[record.toStage] || 'bg-gray-100 text-gray-500'}`}>
                            {stageLabels[record.toStage] || record.toStage}
                          </span>
                          <span className="text-xs text-gray-500">
                            开始于 {record.createdAt?.slice(0, 10)}
                          </span>
                          {durationDays > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              持续 {durationDays} 天
                            </span>
                          )}
                        </div>
                        {record.operator && record.operator !== 'system' && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            操作人：{record.operator} {record.note && `· ${record.note}`}
                          </p>
                        )}
                        {record.toStage === bin.stage && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-compost-pale/50 text-compost-green">
                              <Clock className="w-3 h-3" />
                              当前阶段，已进行 {daysInStage} 天
                            </span>
                            {stageDuration[bin.stage] && (
                              <span className="text-xs text-gray-400">
                                （建议 {stageDuration[bin.stage]}）
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {editingBin === bin.id ? (
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">温度下限 (°C)</label>
                      <input
                        value={editForm.tempMin}
                        onChange={(e) => setEditForm({ ...editForm, tempMin: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:border-compost-green outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">温度上限 (°C)</label>
                      <input
                        value={editForm.tempMax}
                        onChange={(e) => setEditForm({ ...editForm, tempMax: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:border-compost-green outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">湿度下限 (%)</label>
                      <input
                        value={editForm.humidityMin}
                        onChange={(e) => setEditForm({ ...editForm, humidityMin: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:border-compost-green outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">湿度上限 (%)</label>
                      <input
                        value={editForm.humidityMax}
                        onChange={(e) => setEditForm({ ...editForm, humidityMax: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:border-compost-green outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(bin.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs hover:bg-[#245a42]"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingBin(null)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>温度范围</span>
                      <span>{bin.tempMin}°C - {bin.tempMax}°C</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-red-400 rounded-full"
                        style={{ width: `${Math.min((bin.tempMax / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>湿度范围</span>
                      <span>{bin.humidityMin}% - {bin.humidityMax}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-blue-400 rounded-full"
                        style={{ width: `${Math.min((bin.humidityMax / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <button
                  onClick={() => navigate(`/bins/${bin.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-compost-pale/50 text-compost-green text-xs font-medium hover:bg-compost-pale/70 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> 查看详情
                </button>
                {isAdminOrManager && bin.stage !== 'harvested' && (
                  <button
                    onClick={() => handleAdvance(bin.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-compost-pale text-compost-green text-xs font-medium hover:bg-compost-pale/70 transition-colors"
                  >
                    推进阶段 <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                {isAdminOrManager && (
                  <button
                    onClick={() => startEdit(bin)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-compost-green hover:text-compost-green transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> 编辑范围
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
