import { useEffect, useState } from 'react';
import { ScanLine, Leaf, Package } from 'lucide-react';
import { useCompostStore } from '@/stores/compost';
import { useDepositStore } from '@/stores/deposit';
import { useAuthStore } from '@/stores/auth';

export default function Deposit() {
  const { sites, fetchSites } = useCompostStore();
  const { createDeposit, deposits, fetchDeposits } = useDepositStore();
  const { user } = useAuthStore();

  const [siteId, setSiteId] = useState('');
  const [binId, setBinId] = useState('');
  const [weight, setWeight] = useState('');
  const [wasteType, setWasteType] = useState<'kitchen' | 'garden'>('kitchen');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSites();
    if (user?.id) fetchDeposits({ residentId: user.id, pageSize: 5 });
  }, [user?.id]);

  const selectedSite = sites.find((s) => s.id === siteId);
  const fillingBins = selectedSite?.bins.filter((b) => b.stage === 'filling') ?? [];

  const pointsPerKg = wasteType === 'kitchen' ? 10 : 8;
  const calculatedPoints = Math.round(parseFloat(weight || '0') * pointsPerKg);

  const handleSubmit = async () => {
    if (!siteId || !binId || !weight) return;
    setSubmitting(true);
    try {
      await createDeposit({
        residentId: user?.id,
        siteId,
        binId,
        weight: parseFloat(weight),
        wasteType,
        points: calculatedPoints,
      });
      setSuccess(true);
      setWeight('');
      setBinId('');
      if (user?.id) fetchDeposits({ residentId: user.id, pageSize: 5 });
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const wasteTypeLabels: Record<string, string> = { kitchen: '厨余', garden: '园林' };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-serif font-bold text-[#1B4332]">投放废弃物</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-2xl bg-compost-pale/50 flex items-center justify-center mb-3">
            <ScanLine className="w-12 h-12 text-compost-green" />
          </div>
          <p className="text-sm text-gray-400">模拟扫码投放</p>
        </div>

        {success && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-compost-pale text-compost-green text-sm text-center">
            投放成功！获得 {calculatedPoints} 积分
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">选择堆肥点</label>
            <select
              value={siteId}
              onChange={(e) => { setSiteId(e.target.value); setBinId(''); }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm"
            >
              <option value="">请选择堆肥点</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">选择箱体</label>
            <select
              value={binId}
              onChange={(e) => setBinId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm"
              disabled={!siteId}
            >
              <option value="">请选择箱体</option>
              {fillingBins.map((b) => (
                <option key={b.id} value={b.id}>{b.name}（填充期）</option>
              ))}
              {siteId && fillingBins.length === 0 && (
                <option disabled>该堆肥点暂无可投放箱体</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">废弃物类型</label>
            <div className="flex gap-3">
              {(['kitchen', 'garden'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setWasteType(type)}
                  className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${
                    wasteType === type
                      ? 'border-compost-green bg-compost-pale/50 text-compost-green font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-compost-light'
                  }`}
                >
                  {wasteTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">重量 (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="请输入重量"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm"
            />
          </div>

          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-compost-pale/30">
            <span className="text-sm text-gray-600">预计获得积分</span>
            <span className="flex items-center gap-1 text-lg font-bold text-compost-green">
              <Leaf className="w-4 h-4" />
              {calculatedPoints}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !siteId || !binId || !weight}
            className="w-full py-2.5 rounded-lg bg-[#2D6A4F] text-white font-medium hover:bg-[#245a42] disabled:opacity-50 transition-colors"
          >
            {submitting ? '提交中...' : '确认投放'}
          </button>
        </div>
      </div>

      {deposits.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-[#1B4332] mb-3">最近投放记录</h2>
          <div className="space-y-2">
            {deposits.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-compost-light" />
                  <div>
                    <p className="text-sm text-gray-700">{d.siteName} - {d.binName}</p>
                    <p className="text-xs text-gray-400">{d.createdAt}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#1B4332]">{d.weight} kg</p>
                  <p className="text-xs text-compost-green">+{d.points} 积分</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
