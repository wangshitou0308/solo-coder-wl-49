import { useEffect, useState } from 'react';
import { ScanLine, Leaf, Package, QrCode, CheckCircle, MapPin, Clock, Cloud } from 'lucide-react';
import { useCompostStore } from '@/stores/compost';
import { useDepositStore } from '@/stores/deposit';
import { useAuthStore } from '@/stores/auth';

const wasteTagLabels: Record<string, string> = {
  fruit_peel: '果皮',
  coffee_grounds: '咖啡渣',
  vegetable_leaves: '菜叶',
  tea_leaves: '茶叶',
  eggshells: '蛋壳',
  dead_branches: '枯枝落叶',
};

const wasteTypeTags: Record<string, string[]> = {
  kitchen: ['fruit_peel', 'coffee_grounds', 'vegetable_leaves', 'tea_leaves', 'eggshells'],
  garden: ['dead_branches'],
};

const wasteTagBonus: Record<string, number> = {
  fruit_peel: 1,
  coffee_grounds: 2,
  vegetable_leaves: 1,
  tea_leaves: 1,
  eggshells: 1,
  dead_branches: 0,
};

const stageLabels: Record<string, string> = {
  filling: '填充期',
  fermenting: '发酵期',
  maturing: '腐熟期',
  harvested: '已收获',
};

const wasteTypeLabels: Record<string, string> = { kitchen: '厨余', garden: '园林' };

export default function Deposit() {
  const { sites, fetchSites } = useCompostStore();
  const { createDeposit, deposits, fetchDeposits } = useDepositStore();
  const { user } = useAuthStore();

  const [siteId, setSiteId] = useState('');
  const [binId, setBinId] = useState('');
  const [weight, setWeight] = useState('');
  const [wasteType, setWasteType] = useState<'kitchen' | 'garden'>('kitchen');
  const [wasteTag, setWasteTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scannedBin, setScannedBin] = useState<{ siteId: string; binId: string; stage: string; qrCode: string; siteName: string; binName: string } | null>(null);
  const [successRecord, setSuccessRecord] = useState<{ weight: number; points: number; siteName: string; binName: string; carbon: number } | null>(null);

  useEffect(() => {
    fetchSites();
    if (user?.id) fetchDeposits({ residentId: user.id, pageSize: 5 });
  }, [user?.id]);

  const selectedSite = sites.find((s) => s.id === siteId);
  const fillingBins = selectedSite?.bins.filter((b) => b.stage === 'filling') ?? [];

  const pointsPerKg = wasteType === 'kitchen' ? 10 : 8;
  const tagBonus = wasteTag ? (wasteTagBonus[wasteTag] ?? 0) : 0;
  const calculatedPoints = Math.round(parseFloat(weight || '0') * pointsPerKg) + tagBonus;

  const allBinsWithQr = sites.flatMap((s) =>
    (s.bins || []).map((b) => ({
      siteId: s.id,
      siteName: s.name,
      binId: b.id,
      binName: b.name,
      stage: b.stage,
      qrCode: (b as any).qr_code || `QR-${s.id}-${b.name}`,
    }))
  );

  const handleScanSelect = (bin: typeof allBinsWithQr[0]) => {
    setSiteId(bin.siteId);
    setBinId(bin.binId);
    setScannedBin({
      siteId: bin.siteId,
      binId: bin.binId,
      stage: bin.stage,
      qrCode: bin.qrCode,
      siteName: bin.siteName,
      binName: bin.binName,
    });
    setScanDialogOpen(false);
    if (wasteTag && !wasteTypeTags[wasteType]?.includes(wasteTag)) {
      setWasteTag('');
    }
  };

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
        wasteTag: wasteTag || undefined,
        points: calculatedPoints,
      });
      const siteName = scannedBin?.siteName || selectedSite?.name || '';
      const binName = scannedBin?.binName || fillingBins.find((b) => b.id === binId)?.name || '';
      const carbon = Math.round(parseFloat(weight) * 0.3 * 100) / 100;
      setSuccessRecord({ weight: parseFloat(weight), points: calculatedPoints, siteName, binName, carbon });
      setSuccess(true);
      setWeight('');
      setWasteTag('');
      if (user?.id) fetchDeposits({ residentId: user.id, pageSize: 5 });
      setTimeout(() => {
        setSuccess(false);
        setSuccessRecord(null);
        setScannedBin(null);
        setSiteId('');
        setBinId('');
      }, 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetScan = () => {
    setScannedBin(null);
    setSiteId('');
    setBinId('');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-serif font-bold text-[#1B4332]">投放废弃物</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-2xl bg-compost-pale/50 flex items-center justify-center mb-3">
            <QrCode className="w-12 h-12 text-compost-green" />
          </div>
          <p className="text-sm text-gray-400 mb-3">扫描二维码快速投放</p>
          <button
            onClick={() => setScanDialogOpen(true)}
            className="px-6 py-2.5 rounded-lg bg-[#2D6A4F] text-white text-sm font-medium hover:bg-[#245a42] transition-colors flex items-center gap-2"
          >
            <ScanLine className="w-4 h-4" />
            扫码投放
          </button>
        </div>

        {scannedBin && (
          <div className="mb-4 p-4 rounded-lg bg-compost-pale/30 border border-compost-green/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-compost-green" />
              <span className="text-sm font-medium text-compost-green">扫码成功</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">堆肥点</div>
              <div className="text-gray-800 font-medium">{scannedBin.siteName}</div>
              <div className="text-gray-500">箱体</div>
              <div className="text-gray-800 font-medium">{scannedBin.binName}</div>
              <div className="text-gray-500">当前阶段</div>
              <div className="text-gray-800 font-medium">{stageLabels[scannedBin.stage] || scannedBin.stage}</div>
              <div className="text-gray-500">二维码</div>
              <div className="text-gray-800 font-mono text-xs">{scannedBin.qrCode}</div>
            </div>
            <button
              onClick={handleResetScan}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              重新扫码
            </button>
          </div>
        )}

        {success && successRecord && (
          <div className="mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2D6A4F] to-[#52B788] p-6 text-white text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-white/90" />
            <h3 className="text-lg font-bold mb-4">投放成功</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/15 rounded-lg p-3">
                <div className="text-white/70 text-xs mb-1">重量</div>
                <div className="text-lg font-bold">{successRecord.weight} kg</div>
              </div>
              <div className="bg-white/15 rounded-lg p-3">
                <div className="text-white/70 text-xs mb-1">获得积分</div>
                <div className="text-lg font-bold flex items-center justify-center gap-1">
                  <Leaf className="w-4 h-4" />
                  {successRecord.points}
                </div>
              </div>
              <div className="bg-white/15 rounded-lg p-3">
                <div className="text-white/70 text-xs mb-1 flex items-center justify-center gap-1"><MapPin className="w-3 h-3" />堆肥点</div>
                <div className="font-medium text-sm">{successRecord.siteName}</div>
              </div>
              <div className="bg-white/15 rounded-lg p-3">
                <div className="text-white/70 text-xs mb-1">箱体</div>
                <div className="font-medium text-sm">{successRecord.binName}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/80">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date().toLocaleString('zh-CN')}</span>
              <span className="flex items-center gap-1"><Cloud className="w-3 h-3" />减碳 {successRecord.carbon} kg CO₂</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">选择堆肥点</label>
            <select
              value={siteId}
              onChange={(e) => { setSiteId(e.target.value); setBinId(''); setScannedBin(null); }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm"
              disabled={!!scannedBin}
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
              disabled={!siteId || !!scannedBin}
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
                  onClick={() => { setWasteType(type); setWasteTag(''); }}
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

          {wasteTypeTags[wasteType] && wasteTypeTags[wasteType].length > 0 && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">废弃物标签</label>
              <div className="flex flex-wrap gap-2">
                {wasteTypeTags[wasteType].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setWasteTag(wasteTag === tag ? '' : tag)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      wasteTag === tag
                        ? 'border-compost-green bg-compost-pale/50 text-compost-green font-medium'
                        : 'border-gray-200 text-gray-500 hover:border-compost-light'
                    }`}
                  >
                    {wasteTagLabels[tag]}
                    {wasteTagBonus[tag] > 0 && (
                      <span className="ml-1 text-[10px] text-compost-green">+{wasteTagBonus[tag]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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

      {scanDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1B4332]">扫描二维码</h3>
              <button
                onClick={() => setScanDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                <ScanLine className="w-4 h-4" />
                <span>选择箱体二维码进行模拟扫描</span>
              </div>
              <div className="space-y-2">
                {allBinsWithQr.map((bin) => (
                  <button
                    key={bin.binId}
                    onClick={() => handleScanSelect(bin)}
                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-compost-green hover:bg-compost-pale/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{bin.siteName} - {bin.binName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stageLabels[bin.stage] || bin.stage}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                        <QrCode className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-mono text-gray-600">{bin.qrCode}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {allBinsWithQr.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">暂无可扫描的箱体</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
