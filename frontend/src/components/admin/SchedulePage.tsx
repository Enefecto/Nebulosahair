import { useEffect, useState } from 'react';
import AuthGuard from './AuthGuard';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { scheduleApi } from '../../lib/api';
import { getWeekMonday, toDateString } from '../../lib/utils';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DEFAULT_DAY = (dow: number) => ({
  day_of_week: dow,
  is_working: dow < 6,
  start_time: '09:00',
  end_time: '19:00',
  break_start: '13:00',
  break_end: '14:00',
});

export default function SchedulePage() {
  const { token } = useAuth();
  const [weekStart, setWeekStart] = useState(toDateString(getWeekMonday()));
  const [days, setDays] = useState(DAYS.map((_, i) => DEFAULT_DAY(i)));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    scheduleApi.get(token, weekStart).then((data: any) => {
      if (data.length > 0) {
        const mapped = DAYS.map((_, i) => {
          const existing = data.find((d: any) => d.day_of_week === i);
          return existing ? {
            day_of_week: i,
            is_working: existing.is_working,
            start_time: existing.start_time?.slice(0, 5) || '09:00',
            end_time: existing.end_time?.slice(0, 5) || '19:00',
            break_start: existing.break_start?.slice(0, 5) || '',
            break_end: existing.break_end?.slice(0, 5) || '',
          } : DEFAULT_DAY(i);
        });
        setDays(mapped);
      } else {
        setDays(DAYS.map((_, i) => DEFAULT_DAY(i)));
      }
    });
  }, [token, weekStart]);

  function updateDay(dow: number, field: string, value: any) {
    setDays(d => d.map(day => day.day_of_week === dow ? { ...day, [field]: value } : day));
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      await scheduleApi.upsert(token, { week_start_date: weekStart, days });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  function prevWeek() {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(toDateString(d));
  }
  function nextWeek() {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setWeekStart(toDateString(d));
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar activeSection="Horarios" />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Horarios</h1>

          <div className="flex items-center gap-4 mb-6">
            <button onClick={prevWeek} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">← Semana anterior</button>
            <span className="text-sm font-medium text-gray-700">Semana del {weekStart}</span>
            <button onClick={nextWeek} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">Semana siguiente →</button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Día</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">¿Trabaja?</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Inicio</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Fin</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Pausa inicio</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Pausa fin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {days.map(day => (
                  <tr key={day.day_of_week} className={!day.is_working ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{DAYS[day.day_of_week]}</td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={day.is_working}
                        onChange={e => updateDay(day.day_of_week, 'is_working', e.target.checked)}
                        className="w-4 h-4 accent-pink-500"
                      />
                    </td>
                    {['start_time', 'end_time', 'break_start', 'break_end'].map(field => (
                      <td key={field} className="px-4 py-3">
                        <input
                          type="time"
                          value={(day as any)[field] || ''}
                          onChange={e => updateDay(day.day_of_week, field, e.target.value)}
                          disabled={!day.is_working}
                          className="border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-30"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-pink text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-pink-dark transition-colors"
          >
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar horarios'}
          </button>
        </main>
      </div>
    </AuthGuard>
  );
}
