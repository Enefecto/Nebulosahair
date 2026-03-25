import AuthGuard from './AuthGuard';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { dashboardApi } from '../../lib/api';
import { useEffect, useState } from 'react';
import { formatPrice } from '../../lib/utils';

export default function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (token) {
      dashboardApi.summary(token).then(setSummary).catch(console.error);
    }
  }, [token]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar activeSection="Dashboard" />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <KPICard
                title="Ingresos del mes"
                value={formatPrice(summary.revenue)}
                sub={summary.revenue_vs_prev_month_pct != null
                  ? `${summary.revenue_vs_prev_month_pct > 0 ? '+' : ''}${summary.revenue_vs_prev_month_pct}% vs mes anterior`
                  : undefined}
              />
              <KPICard
                title="Citas completadas"
                value={summary.completed_appointments}
                sub={`${summary.all_appointments_this_month} citas en total`}
              />
              <KPICard
                title="Servicio más popular"
                value={summary.most_popular_service || '—'}
              />
            </div>
          )}

          <p className="text-sm text-gray-400">
            Los gráficos detallados se implementarán en la Fase 7.
          </p>
        </main>
      </div>
    </AuthGuard>
  );
}

function KPICard({ title, value, sub }: { title: string; value: any; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
