import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Edit2, ChevronRight } from 'lucide-react';
import { useCompostStore, type BinStage } from '@/stores/compost';

const stageLabels: Record<BinStage, string> = {
  filling: '填充期',
  fermenting: '高温发酵期',
  maturing: '降温腐熟期',
  harvested: '已出肥',
};

const stageBadge: Record<BinStage, string> = {
  filling: 'bg-compost-pale text-compost-green',
  fermenting: 'bg-orange-100 text-orange-700',
  maturing: 'bg-blue-100 text-blue-700',
  harvested: 'bg-amber-100 text-amber-800',
};

export default function CompostSiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSite, bins, fetchSite, advanceStage, updateBin, loading } = useCompostStore();
  const [editingBin, setEditingBin] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ tempMin: '', tempMax: '', humidityMin: '', humidityMax: '' });

  useEffect(() => {
    if (id) fetchSite(id);
  }, [id]);

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
  };

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
        {(bins ?? []).map((bin) => (
          <div
            key={bin.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1B4332]">{bin.name}</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stageBadge[bin.stage]}`}>
                {stageLabels[bin.stage]}
              </span>
            </div>

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
              {bin.stage !== 'harvested' && (
                <button
                  onClick={() => handleAdvance(bin.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-compost-pale text-compost-green text-xs font-medium hover:bg-compost-pale/70 transition-colors"
                >
                  推进阶段 <ChevronRight className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => startEdit(bin)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-compost-green hover:text-compost-green transition-colors"
              >
                <Edit2 className="w-3 h-3" /> 编辑范围
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
