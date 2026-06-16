import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useMonitoringStore } from '@/stores/monitoring';

type FilterTab = 'all' | 'unresolved' | 'resolved';

export default function Alerts() {
  const { alerts, fetchAlerts, resolveAlert, loading } = useMonitoringStore();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (filterTab === 'unresolved') return !a.resolved;
    if (filterTab === 'resolved') return a.resolved;
    return true;
  });

  const handleResolve = async (id: string) => {
    if (!resolveNote.trim()) return;
    await resolveAlert(id, { action: resolveNote });
    setResolvingId(null);
    setResolveNote('');
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unresolved', label: '未处理' },
    { key: 'resolved', label: '已处理' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-serif font-bold text-[#1B4332]">告警中心</h1>

      <div className="flex gap-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterTab(key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterTab === key
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-compost-green'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">加载中...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-compost-light mx-auto mb-3" />
          <p className="text-gray-400">暂无告警</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl shadow-sm border-l-4 ${
                alert.resolved ? 'border-l-gray-300' : 'border-l-alert-orange'
              } border border-gray-100 p-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.resolved ? 'bg-gray-100' : 'bg-orange-50'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      alert.resolved ? 'text-gray-400' : 'text-alert-orange alert-pulse'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1B4332]">
                      {alert.siteName} - {alert.binName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      建议：{alert.suggestion}
                    </p>
                    {alert.resolved && alert.resolvedNote && (
                      <p className="text-xs text-compost-green mt-1">
                        处理结果：{alert.resolvedNote}
                      </p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">{alert.createdAt}</p>
                  </div>
                </div>
                {!alert.resolved && resolvingId !== alert.id && (
                  <button
                    onClick={() => setResolvingId(alert.id)}
                    className="px-3 py-1.5 rounded-lg border border-alert-orange text-alert-orange text-xs hover:bg-orange-50 transition-colors flex-shrink-0"
                  >
                    处理
                  </button>
                )}
              </div>

              {resolvingId === alert.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <textarea
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="请输入处理措施"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-compost-green outline-none text-sm resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setResolvingId(null); setResolveNote(''); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs hover:bg-[#245a42]"
                    >
                      确认处理
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
