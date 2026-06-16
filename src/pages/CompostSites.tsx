import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, X, Trash2 } from 'lucide-react';
import { useCompostStore, type BinStage } from '@/stores/compost';
import { useAuthStore } from '@/stores/auth';

const statusLabels: Record<string, string> = {
  normal: '正常',
  alert: '告警',
  idle: '闲置',
};

const statusDot: Record<string, string> = {
  normal: 'bg-compost-green',
  alert: 'bg-alert-orange',
  idle: 'bg-gray-400',
};

interface BinRow {
  name: string;
  stage: BinStage;
  tempMin: string;
  tempMax: string;
  humidityMin: string;
  humidityMax: string;
}

export default function CompostSites() {
  const navigate = useNavigate();
  const { sites, fetchSites, createSite, loading } = useCompostStore();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
  });
  const [binRows, setBinRows] = useState<BinRow[]>([
    { name: '', stage: 'filling', tempMin: '', tempMax: '', humidityMin: '', humidityMax: '' },
  ]);

  useEffect(() => {
    fetchSites();
  }, []);

  const addBinRow = () => {
    setBinRows([
      ...binRows,
      { name: '', stage: 'filling', tempMin: '', tempMax: '', humidityMin: '', humidityMax: '' },
    ]);
  };

  const removeBinRow = (idx: number) => {
    setBinRows(binRows.filter((_, i) => i !== idx));
  };

  const updateBinRow = (idx: number, field: keyof BinRow, value: string) => {
    const updated = [...binRows];
    updated[idx] = { ...updated[idx], [field]: value };
    setBinRows(updated);
  };

  const handleCreate = async () => {
    if (!form.name || !form.address) return;
    await createSite({
      name: form.name,
      address: form.address,
      latitude: parseFloat(form.latitude) || 0,
      longitude: parseFloat(form.longitude) || 0,
      bins: binRows
        .filter((b) => b.name)
        .map((b) => ({
          name: b.name,
          stage: b.stage,
          tempMin: parseFloat(b.tempMin) || 0,
          tempMax: parseFloat(b.tempMax) || 100,
          humidityMin: parseFloat(b.humidityMin) || 0,
          humidityMax: parseFloat(b.humidityMax) || 100,
        })),
    } as Parameters<typeof createSite>[0]);
    setShowCreate(false);
    setForm({ name: '', address: '', latitude: '', longitude: '' });
    setBinRows([{ name: '', stage: 'filling', tempMin: '', tempMax: '', humidityMin: '', humidityMax: '' }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-serif font-bold text-[#1B4332]">堆肥点管理</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D6A4F] text-white text-sm hover:bg-[#245a42] transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建堆肥点
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-[#1B4332]">{site.name}</h3>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className={`w-2 h-2 rounded-full ${statusDot[site.status]}`} />
                  {statusLabels[site.status]}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{site.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-1 rounded-full bg-compost-pale text-compost-green font-medium">
                  {site.bins?.length ?? 0} 个箱体
                </span>
                <button
                  onClick={() => navigate(`/compost-sites/${site.id}`)}
                  className="text-sm text-compost-green hover:underline font-medium"
                >
                  查看详情
                </button>
              </div>
            </div>
          ))}
          {sites.length === 0 && !loading && (
            <div className="col-span-3 text-center text-gray-400 py-12">暂无堆肥点</div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#1B4332]">创建堆肥点</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">名称</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入堆肥点名称"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">地址</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="请输入地址"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">纬度</label>
                  <input
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="如 39.9042"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">经度</label>
                  <input
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="如 116.4074"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600">箱体配置</label>
                  <button
                    onClick={addBinRow}
                    className="text-xs text-compost-green hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> 添加箱体
                  </button>
                </div>
                <div className="space-y-3">
                  {binRows.map((bin, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-2 items-end">
                      <div className="col-span-1">
                        <input
                          value={bin.name}
                          onChange={(e) => updateBinRow(idx, 'name', e.target.value)}
                          placeholder="箱体名"
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:border-compost-green outline-none"
                        />
                      </div>
                      <div className="col-span-1">
                        <select
                          value={bin.stage}
                          onChange={(e) => updateBinRow(idx, 'stage', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:border-compost-green outline-none"
                        >
                          <option value="filling">填充期</option>
                          <option value="fermenting">高温发酵期</option>
                          <option value="maturing">降温腐熟期</option>
                          <option value="harvested">已出肥</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <input
                          value={bin.tempMin}
                          onChange={(e) => updateBinRow(idx, 'tempMin', e.target.value)}
                          placeholder="温度下限"
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:border-compost-green outline-none"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          value={bin.tempMax}
                          onChange={(e) => updateBinRow(idx, 'tempMax', e.target.value)}
                          placeholder="温度上限"
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:border-compost-green outline-none"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          value={bin.humidityMin}
                          onChange={(e) => updateBinRow(idx, 'humidityMin', e.target.value)}
                          placeholder="湿度下限"
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:border-compost-green outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          value={bin.humidityMax}
                          onChange={(e) => updateBinRow(idx, 'humidityMax', e.target.value)}
                          placeholder="湿度上限"
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:border-compost-green outline-none"
                        />
                        {binRows.length > 1 && (
                          <button onClick={() => removeBinRow(idx)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg bg-[#2D6A4F] text-white text-sm hover:bg-[#245a42] transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
