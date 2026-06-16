import { useEffect, useState } from 'react';
import { Thermometer, RotateCw, Wheat, ClipboardList } from 'lucide-react';
import { useCompostStore } from '@/stores/compost';
import { useMonitoringStore } from '@/stores/monitoring';

type TabType = 'temperature_humidity' | 'turning' | 'harvest';

export default function Monitor() {
  const { sites, fetchSites } = useCompostStore();
  const { records, recordMonitoring, recordTurning, recordHarvest, loading } = useMonitoringStore();

  const [siteId, setSiteId] = useState('');
  const [binId, setBinId] = useState('');
  const [tab, setTab] = useState<TabType>('temperature_humidity');

  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [operator, setOperator] = useState('');
  const [turningNote, setTurningNote] = useState('');
  const [harvestWeight, setHarvestWeight] = useState('');
  const [harvestNote, setHarvestNote] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  useEffect(() => {
    fetchSites();
  }, []);

  const selectedSite = sites.find((s) => s.id === siteId);
  const selectedBin = selectedSite?.bins.find((b) => b.id === binId);

  const handleSubmit = async () => {
    if (!siteId || !binId) return;
    if (tab === 'temperature_humidity') {
      await recordMonitoring({
        siteId,
        binId,
        data: { temperature: parseFloat(temp), humidity: parseFloat(humidity) },
      });
      setTemp('');
      setHumidity('');
    } else if (tab === 'turning') {
      await recordTurning({
        siteId,
        binId,
        operator,
        data: { note: turningNote },
      });
      setOperator('');
      setTurningNote('');
    } else {
      const res = await recordHarvest({
        siteId,
        binId,
        data: { weight: parseFloat(harvestWeight), note: harvestNote },
      });
      setBatchNumber(res.batchNumber);
      setHarvestWeight('');
      setHarvestNote('');
    }
  };

  const tabs: { key: TabType; label: string; icon: typeof Thermometer }[] = [
    { key: 'temperature_humidity', label: '温湿度录入', icon: Thermometer },
    { key: 'turning', label: '翻堆记录', icon: RotateCw },
    { key: 'harvest', label: '出肥记录', icon: Wheat },
  ];

  const filteredRecords = records.filter(
    (r) => (!siteId || r.siteId === siteId) && (!binId || r.binId === binId),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-serif font-bold text-[#1B4332]">日常监控</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={siteId}
            onChange={(e) => { setSiteId(e.target.value); setBinId(''); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none"
          >
            <option value="">选择堆肥点</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={binId}
            onChange={(e) => setBinId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none"
            disabled={!siteId}
          >
            <option value="">选择箱体</option>
            {selectedSite?.bins.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setBatchNumber(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
              tab === key
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-compost-green'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {tab === 'temperature_humidity' && (
          <div className="space-y-4">
            {selectedBin && (
              <p className="text-xs text-gray-400">
                当前范围：温度 {selectedBin.tempMin}°C - {selectedBin.tempMax}°C，湿度 {selectedBin.humidityMin}% - {selectedBin.humidityMax}%
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">温度 (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  placeholder="请输入温度"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">湿度 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  placeholder="请输入湿度"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'turning' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">操作人</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="请输入操作人姓名"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">备注</label>
              <textarea
                value={turningNote}
                onChange={(e) => setTurningNote(e.target.value)}
                placeholder="请输入翻堆备注"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm resize-none"
              />
            </div>
          </div>
        )}

        {tab === 'harvest' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">出肥重量 (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={harvestWeight}
                onChange={(e) => setHarvestWeight(e.target.value)}
                placeholder="请输入出肥重量"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">备注</label>
              <textarea
                value={harvestNote}
                onChange={(e) => setHarvestNote(e.target.value)}
                placeholder="请输入出肥备注"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm resize-none"
              />
            </div>
            {batchNumber && (
              <div className="px-3 py-2.5 rounded-lg bg-compost-pale/50 text-compost-green text-sm">
                批次号：<span className="font-mono font-bold">{batchNumber}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !siteId || !binId}
          className="mt-4 w-full py-2.5 rounded-lg bg-[#2D6A4F] text-white font-medium hover:bg-[#245a42] disabled:opacity-50 transition-colors"
        >
          {loading ? '提交中...' : '提交记录'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-[#1B4332] mb-3 flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4" /> 最近监控记录
        </h2>
        <div className="space-y-2">
          {filteredRecords.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无记录</p>
          ) : (
            filteredRecords.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">
                    {r.siteName} - {r.binName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {r.type === 'temperature_humidity' ? '温湿度' : r.type === 'turning' ? '翻堆' : '出肥'}
                    {' · '}{r.createdAt}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {r.type === 'temperature_humidity' && `T:${(r.data as { temperature?: number }).temperature}°C H:${(r.data as { humidity?: number }).humidity}%`}
                  {r.type === 'turning' && `操作人: ${r.operator || '-'}`}
                  {r.type === 'harvest' && `${(r.data as { weight?: number }).weight}kg`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
