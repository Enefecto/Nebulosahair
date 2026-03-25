import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import AuthGuard from './AuthGuard';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { dashboardApi } from '../../lib/api';
import { formatPrice, STATUS_LABELS } from '../../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [apptStats, setApptStats] = useState<any>(null);
  const [svcStats, setSvcStats] = useState<any>(null);
  const [period, setPeriod] = useState(currentMonthValue());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      dashboardApi.summary(token),
      dashboardApi.revenue(token, 'month', period),
      dashboardApi.appointmentsStats(token, 'month', period),
      dashboardApi.servicesStats(token, 'month', period),
    ]).then(([s, r, a, sv]) => {
      setSummary(s);
      setRevenue(r);
      setApptStats(a);
      setSvcStats(sv);
      setLoading(false);
    }).catch(console.error);
  }, [token, period]);

  // Build revenue line data
  const revenueData = revenue
    ? Object.entries(revenue.data as Record<string, number>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({ date: date.slice(5), amount }))
    : [];

  // Build status pie data
  const statusData = apptStats
    ? Object.entries(apptStats.by_status as Record<string, number>).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        status,
      }))
    : [];

  // Build services bar data
  const svcData = svcStats
    ? Object.entries(svcStats.data as Record<string, { count: number; revenue: number }>)
        .map(([name, d]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, citas: d.count, ingresos: d.revenue }))
        .sort((a, b) => b.citas - a.citas)
        .slice(0, 6)
    : [];

  // Build peak hours bar data
  const hoursData = apptStats
    ? Object.entries(apptStats.by_hour as Record<string, number>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, count]) => ({ hora: `${hour}:00`, citas: count }))
    : [];

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar activeSection="Dashboard" />
        <main className="flex-1 p-8 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <input
              type="month"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* KPI cards */}
              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <KPICard
                    title="Ingresos del mes"
                    value={formatPrice(summary.revenue)}
                    sub={summary.revenue_vs_prev_month_pct != null
                      ? `${summary.revenue_vs_prev_month_pct > 0 ? '+' : ''}${summary.revenue_vs_prev_month_pct}% vs mes anterior`
                      : 'Sin datos previos'}
                    trend={summary.revenue_vs_prev_month_pct}
                    icon="💰"
                  />
                  <KPICard
                    title="Citas completadas"
                    value={summary.completed_appointments}
                    sub={`de ${summary.all_appointments_this_month} en total`}
                    icon="✅"
                  />
                  <KPICard
                    title="Pendientes"
                    value={summary.status_breakdown?.pending || 0}
                    sub="requieren confirmación"
                    icon="⏳"
                  />
                  <KPICard
                    title="Servicio top"
                    value={summary.most_popular_service || '—'}
                    sub="más solicitado"
                    icon="⭐"
                  />
                </div>
              )}

              {/* Charts row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Revenue line chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Ingresos diarios</h2>
                  {revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={revenueData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: any) => formatPrice(v)} labelFormatter={l => `Día ${l}`} />
                        <Line type="monotone" dataKey="amount" stroke="#ec4899" strokeWidth={2} dot={false} name="Ingresos" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Sin ingresos registrados este período" />
                  )}
                </div>

                {/* Status pie chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Estado de citas</h2>
                  {statusData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%" cy="50%"
                            innerRadius={45}
                            outerRadius={72}
                            dataKey="value"
                            paddingAngle={2}
                          >
                            {statusData.map((entry, i) => (
                              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any, name: any) => [v, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1 mt-2">
                        {statusData.map((entry, i) => (
                          <div key={entry.status} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length] }} />
                              {entry.name}
                            </span>
                            <span className="font-medium text-gray-700">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyChart message="Sin citas este período" />
                  )}
                </div>
              </div>

              {/* Charts row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Services bar chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Servicios más solicitados</h2>
                  {svcData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={svcData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                        <Tooltip />
                        <Bar dataKey="citas" fill="#ec4899" radius={[0, 4, 4, 0]} name="Citas" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Sin servicios completados este período" />
                  )}
                </div>

                {/* Peak hours chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Horas pico</h2>
                  {hoursData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={hoursData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="citas" fill="#a855f7" radius={[4, 4, 0, 0]} name="Citas" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Sin datos de horarios este período" />
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

function KPICard({ title, value, sub, icon, trend }: { title: string; value: any; sub?: string; icon?: string; trend?: number | null }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {sub && (
        <p className={`text-xs ${trend != null ? (trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-400' : 'text-gray-400') : 'text-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
      {message}
    </div>
  );
}
