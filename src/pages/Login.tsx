import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Phone, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

const roles = [
  { value: 'admin', label: '管理员' },
  { value: 'manager', label: '堆肥管理员' },
  { value: 'resident', label: '居民' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, register, loading } = useAuthStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState('resident');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!phone || !password) {
      setError('请填写手机号和密码');
      return;
    }
    try {
      await login(phone, password, role);
      navigate('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '登录失败');
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!name || !phone || !password) {
      setError('请填写所有字段');
      return;
    }
    try {
      await register(phone, name, password);
      navigate('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '注册失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-compost-pale via-compost-pale/40 to-[#FAF6F0] relative overflow-hidden">
      <svg className="absolute top-0 left-0 w-64 h-64 text-compost-light/10" viewBox="0 0 200 200">
        <path d="M100 20 C60 50, 30 90, 50 140 C70 180, 130 180, 150 140 C170 90, 140 50, 100 20Z" fill="currentColor" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-80 h-80 text-compost-light/10" viewBox="0 0 200 200">
        <path d="M100 20 C60 50, 30 90, 50 140 C70 180, 130 180, 150 140 C170 90, 140 50, 100 20Z" fill="currentColor" />
      </svg>
      <svg className="absolute top-1/3 right-1/4 w-32 h-32 text-compost-pale/30" viewBox="0 0 100 100">
        <path d="M50 10 C30 25, 15 45, 25 70 C35 90, 65 90, 75 70 C85 45, 70 25, 50 10Z" fill="currentColor" />
        <line x1="50" y1="10" x2="50" y2="60" stroke="currentColor" strokeWidth="2" />
        <line x1="50" y1="35" x2="35" y2="25" stroke="currentColor" strokeWidth="1.5" />
        <line x1="50" y1="45" x2="65" y2="35" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-lg border border-gray-100 relative z-10">
        <div className="flex items-center justify-center gap-2 pt-8 pb-2">
          <Leaf className="w-8 h-8 text-compost-green" />
          <h1 className="text-2xl font-serif font-bold text-[#1B4332]">社区堆肥管理</h1>
        </div>
        <p className="text-center text-sm text-gray-400 mb-6">绿色循环，从社区开始</p>

        <div className="flex mx-6 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'login' ? 'bg-white shadow-sm text-compost-green' : 'text-gray-500'
            }`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            登录
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'register' ? 'bg-white shadow-sm text-compost-green' : 'text-gray-500'
            }`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            注册
          </button>
        </div>

        <div className="px-6 pb-8">
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
          )}

          {tab === 'login' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">角色</label>
                <div className="flex gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                        role === r.value
                          ? 'border-compost-green bg-compost-pale/50 text-compost-green font-medium'
                          : 'border-gray-200 text-gray-500 hover:border-compost-light'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">手机号</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#2D6A4F] text-white font-medium hover:bg-[#245a42] disabled:opacity-50 transition-colors"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入姓名"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">手机号</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-compost-green focus:ring-1 focus:ring-compost-green/30 outline-none text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#2D6A4F] text-white font-medium hover:bg-[#245a42] disabled:opacity-50 transition-colors"
              >
                {loading ? '注册中...' : '注册（仅限居民）'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
