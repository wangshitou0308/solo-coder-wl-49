import { useEffect, useState } from 'react';
import { Leaf, TrendingUp, TrendingDown, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface LedgerEntry {
  id: number;
  userId: number;
  type: string;
  amount: number;
  source: string;
  referenceId: number | null;
  balanceAfter: number;
  createdAt: string;
}

interface LedgerResponse {
  list: LedgerEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const sourceLabels: Record<string, string> = {
  deposit: '投放废弃物',
  exchange: '积分兑换',
};

const typeLabels: Record<string, string> = {
  earn: '收入',
  spend: '支出',
};

export default function PointsDetail() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (!user?.id) return;
    api.get<LedgerResponse>(`/users/${user.id}/points-ledger?page=${page}&pageSize=${pageSize}`).then((res) => {
      setEntries(res.list);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    });
  }, [user?.id, page]);

  useEffect(() => {
    if (!user?.id) return;
    api.get<LedgerResponse>(`/users/${user.id}/points-ledger?page=1&pageSize=9999`).then((res) => {
      let earned = 0;
      let spent = 0;
      res.list.forEach((e) => {
        if (e.type === 'earn') earned += e.amount;
        else spent += e.amount;
      });
      setTotalEarned(earned);
      setTotalSpent(spent);
    });
  }, [user?.id]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1B4332]" />
        </button>
        <h1 className="text-xl font-serif font-bold text-[#1B4332]">积分明细</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Leaf className="w-5 h-5 text-compost-green" />
            <span className="text-2xl font-bold text-compost-green">{user?.points ?? 0}</span>
          </div>
          <p className="text-xs text-gray-400">当前积分</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-2xl font-bold text-[#1B4332]">{totalEarned}</span>
          </div>
          <p className="text-xs text-gray-400">累计获得</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingDown className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-bold text-amber-600">{totalSpent}</span>
          </div>
          <p className="text-xs text-gray-400">累计消费</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">暂无积分记录</p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, i) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      entry.type === 'earn' ? 'bg-emerald-400' : 'bg-orange-400'
                    }`}
                  />
                  {i < entries.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          entry.type === 'earn'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-orange-50 text-orange-600'
                        }`}
                      >
                        {typeLabels[entry.type] ?? entry.type}
                      </span>
                      <span className="text-sm text-gray-700">
                        {sourceLabels[entry.source] ?? entry.source}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        entry.type === 'earn' ? 'text-emerald-600' : 'text-orange-600'
                      }`}
                    >
                      {entry.type === 'earn' ? '+' : '-'}{entry.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-400">{entry.createdAt}</p>
                    <p className="text-xs text-gray-400">余额 {entry.balanceAfter}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-400">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> 上一页
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs disabled:opacity-40 flex items-center gap-1"
            >
              下一页 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
