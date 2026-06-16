import { useEffect, useState } from 'react';
import { Package, Filter } from 'lucide-react';
import { useDepositStore } from '@/stores/deposit';
import { useCompostStore } from '@/stores/compost';

const wasteTypeLabels: Record<string, string> = { kitchen: '厨余', garden: '园林' };

export default function DepositRecords() {
  const { deposits, total, fetchDeposits, loading } = useDepositStore();
  const { sites, fetchSites } = useCompostStore();

  const [siteFilter, setSiteFilter] = useState('');
  const [residentFilter, setResidentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    fetchDeposits({
      siteId: siteFilter || undefined,
      residentId: residentFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      pageSize,
    });
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    fetchDeposits({
      siteId: siteFilter || undefined,
      residentId: residentFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
      pageSize,
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-serif font-bold text-[#1B4332]">投放记录</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
            type="text"
            value={residentFilter}
            onChange={(e) => setResidentFilter(e.target.value)}
            placeholder="居民姓名/ID"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none w-36"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none"
          />
          <button
            onClick={handleFilter}
            className="px-4 py-2 rounded-lg bg-[#2D6A4F] text-white text-sm hover:bg-[#245a42] transition-colors"
          >
            筛选
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">时间</th>
                <th className="px-4 py-3 font-medium text-gray-500">居民</th>
                <th className="px-4 py-3 font-medium text-gray-500">堆肥点</th>
                <th className="px-4 py-3 font-medium text-gray-500">箱体</th>
                <th className="px-4 py-3 font-medium text-gray-500">重量(kg)</th>
                <th className="px-4 py-3 font-medium text-gray-500">废弃物类型</th>
                <th className="px-4 py-3 font-medium text-gray-500">减碳估算</th>
                <th className="px-4 py-3 font-medium text-gray-500">获得积分</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600">{d.createdAt}</td>
                  <td className="px-4 py-3 text-gray-700">{d.residentName}</td>
                  <td className="px-4 py-3 text-gray-700">{d.siteName}</td>
                  <td className="px-4 py-3 text-gray-700">{d.binName}</td>
                  <td className="px-4 py-3 font-medium text-[#1B4332]">{d.weight}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      d.wasteType === 'kitchen'
                        ? 'bg-compost-pale text-compost-green'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {wasteTypeLabels[d.wasteType]}
                      {d.wasteTag && <span className="ml-1 text-gray-400">· {d.wasteTag}</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-600 text-sm">
                    {d.carbonReduction ?? Math.round(d.weight * 0.3 * 100) / 100} kg CO₂
                  </td>
                  <td className="px-4 py-3 text-compost-green font-medium">+{d.points}</td>
                </tr>
              ))}
              {deposits.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    暂无投放记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              共 {total} 条记录，第 {page}/{totalPages} 页
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-200 text-xs disabled:opacity-40"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-gray-200 text-xs disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
