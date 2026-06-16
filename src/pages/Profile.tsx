import { useEffect, useState } from 'react';
import { User, Leaf, Package, ShoppingBag, Calendar } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useDepositStore } from '@/stores/deposit';
import { useStoreStore } from '@/stores/store';

type ProfileTab = 'deposits' | 'orders';

const roleLabels: Record<string, string> = {
  admin: '管理员',
  manager: '堆肥管理员',
  resident: '居民',
};

const wasteTypeLabels: Record<string, string> = { kitchen: '厨余', garden: '园林' };

const orderStatusLabels: Record<string, string> = {
  pending: '待处理',
  completed: '已完成',
  cancelled: '已取消',
};

export default function Profile() {
  const { user, fetchMe } = useAuthStore();
  const { deposits, fetchDeposits } = useDepositStore();
  const { orders, fetchOrders } = useStoreStore();
  const [tab, setTab] = useState<ProfileTab>('deposits');

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchDeposits({ residentId: user.id });
      fetchOrders(user.id);
    }
  }, [user?.id]);

  const totalEarned = deposits.reduce((sum, d) => sum + d.points, 0);
  const totalSpent = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalPoints, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-serif font-bold text-[#1B4332]">个人中心</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-compost-pale flex items-center justify-center">
            <User className="w-7 h-7 text-compost-green" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1B4332]">{user?.name ?? '-'}</h2>
            <p className="text-sm text-gray-500">{user?.phone ?? '-'}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-compost-pale text-compost-green font-medium">
              {roleLabels[user?.role ?? ''] ?? user?.role}
            </span>
          </div>
          {user?.createdAt && (
            <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              加入于 {user.createdAt}
            </div>
          )}
        </div>
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
          <p className="text-2xl font-bold text-[#1B4332]">{totalEarned}</p>
          <p className="text-xs text-gray-400">累计获得</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalSpent}</p>
          <p className="text-xs text-gray-400">累计消费</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('deposits')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
            tab === 'deposits' ? 'bg-[#2D6A4F] text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Package className="w-4 h-4" /> 投放历史
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
            tab === 'orders' ? 'bg-[#2D6A4F] text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> 兑换记录
        </button>
      </div>

      {tab === 'deposits' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {deposits.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无投放记录</p>
          ) : (
            <div className="space-y-4">
              {deposits.map((d, i) => (
                <div key={d.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-compost-light" />
                    {i < deposits.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">
                        {d.siteName} - {d.binName}
                      </p>
                      <span className="text-sm text-compost-green font-medium">+{d.points}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.createdAt} · {d.weight}kg · {wasteTypeLabels[d.wasteType]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无兑换记录</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{o.productName}</p>
                    <p className="text-xs text-gray-400">
                      {o.createdAt} · x{o.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#1B4332]">-{o.totalPoints} 积分</p>
                    <span className={`text-xs ${
                      o.status === 'completed' ? 'text-compost-green' : o.status === 'cancelled' ? 'text-red-400' : 'text-amber-500'
                    }`}>
                      {orderStatusLabels[o.status]}
                    </span>
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
