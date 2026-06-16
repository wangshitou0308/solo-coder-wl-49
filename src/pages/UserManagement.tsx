import { useEffect, useState } from 'react';
import { Users, Plus, X, UserPlus, Shield } from 'lucide-react';
import { api } from '@/lib/api';

const roleLabels: Record<string, string> = {
  admin: '管理员',
  manager: '堆肥管理员',
  resident: '居民',
};

const roleBadge: Record<string, string> = {
  admin: 'bg-red-50 text-red-600',
  manager: 'bg-blue-50 text-blue-600',
  resident: 'bg-compost-pale text-compost-green',
};

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  points: number;
  createdAt: string;
}

interface UserListResponse {
  list: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'resident' });
  const pageSize = 10;

  const fetchUsers = async (p: number = page, role: string = roleFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
      if (role) params.set('role', role);
      const res = await api.get<UserListResponse>(`/users?${params.toString()}`);
      setUsers(res.list);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    fetchUsers(1, roleFilter);
  };

  const handleCreate = async () => {
    if (!form.name || !form.phone || !form.password) return;
    setCreating(true);
    try {
      await api.post('/users', form);
      setShowCreate(false);
      setForm({ name: '', phone: '', password: '', role: 'resident' });
      fetchUsers(page, roleFilter);
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await api.put(`/users/${userId}/role`, { role: newRole });
    fetchUsers(page, roleFilter);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-serif font-bold text-[#1B4332]">用户管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D6A4F] text-white text-sm hover:bg-[#245a42] transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建用户
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-compost-green outline-none"
            >
              <option value="">全部角色</option>
              <option value="admin">管理员</option>
              <option value="manager">堆肥管理员</option>
              <option value="resident">居民</option>
            </select>
          </div>
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
                <th className="px-4 py-3 font-medium text-gray-500">姓名</th>
                <th className="px-4 py-3 font-medium text-gray-500">手机号</th>
                <th className="px-4 py-3 font-medium text-gray-500">角色</th>
                <th className="px-4 py-3 font-medium text-gray-500">积分</th>
                <th className="px-4 py-3 font-medium text-gray-500">注册时间</th>
                <th className="px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-700">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge[u.role] ?? 'bg-gray-50 text-gray-600'}`}>
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1B4332]">{u.points}</td>
                  <td className="px-4 py-3 text-gray-600">{u.createdAt}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:border-compost-green outline-none"
                    >
                      <option value="admin">管理员</option>
                      <option value="manager">堆肥管理员</option>
                      <option value="resident">居民</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    暂无用户
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

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#1B4332]">创建用户</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">姓名</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">手机号</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="请输入手机号"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">密码</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="请输入密码"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">角色</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm"
                >
                  <option value="manager">堆肥管理员</option>
                  <option value="resident">居民</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !form.name || !form.phone || !form.password}
                className="w-full py-2.5 rounded-lg bg-[#2D6A4F] text-white font-medium hover:bg-[#245a42] disabled:opacity-50 transition-colors"
              >
                {creating ? '创建中...' : '创建用户'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
