import { useEffect, useState } from 'react';
import AuthGuard from './AuthGuard';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { appointmentsApi, servicesApi } from '../../lib/api';
import { formatPrice, formatDate, formatTime, STATUS_LABELS, SOURCE_LABELS } from '../../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'completed',
};

export default function AppointmentsPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');

  async function load() {
    if (!token) return;
    const params: Record<string, string> = {};
    if (filterStatus) params.status = filterStatus;
    const [appts, svcs] = await Promise.all([
      appointmentsApi.list(token, params) as Promise<any[]>,
      servicesApi.list(token) as Promise<any[]>,
    ]);
    setAppointments(appts);
    setServices(svcs);
    setLoading(false);
  }

  useEffect(() => { load(); }, [token, filterStatus]);

  async function handleStatusChange(id: string, status: string) {
    if (!token) return;
    await appointmentsApi.updateStatus(token, id, status);
    load();
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('¿Eliminar esta cita?')) return;
    await appointmentsApi.delete(token, id);
    setAppointments(a => a.filter(x => x.id !== id));
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar activeSection="Agenda" />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="bg-brand-pink text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-pink-dark transition-colors"
            >
              + Nueva cita
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-brand-pink text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                {s ? STATUS_LABELS[s] : 'Todas'}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Hora</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Cliente</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Servicio</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Precio</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.map(appt => (
                    <tr key={appt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{appt.date}</td>
                      <td className="px-4 py-3 text-gray-900">{formatTime(appt.start_time)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{appt.client_name}</td>
                      <td className="px-4 py-3 text-gray-600">{appt.services?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[appt.status]}`}>
                          {STATUS_LABELS[appt.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{appt.price_charged ? formatPrice(appt.price_charged) : '—'}</td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {NEXT_STATUS[appt.status] && (
                          <button
                            onClick={() => handleStatusChange(appt.id, NEXT_STATUS[appt.status])}
                            className="text-xs text-blue-500 hover:underline"
                          >
                            → {STATUS_LABELS[NEXT_STATUS[appt.status]]}
                          </button>
                        )}
                        {appt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'cancelled')}
                            className="text-xs text-red-400 hover:underline"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          onClick={() => { setEditing(appt); setShowForm(true); }}
                          className="text-xs text-brand-pink hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="text-xs text-gray-400 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showForm && (
            <AppointmentForm
              token={token!}
              services={services}
              initial={editing}
              onClose={() => setShowForm(false)}
              onSaved={() => { setShowForm(false); load(); }}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

function AppointmentForm({ token, services, initial, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    client_name: initial?.client_name || '',
    client_phone: initial?.client_phone || '',
    service_id: initial?.service_id || '',
    date: initial?.date || '',
    start_time: initial?.start_time?.slice(0, 5) || '',
    price_charged: initial?.price_charged || '',
    notes: initial?.notes || '',
    source: initial?.source || 'whatsapp',
    status: initial?.status || 'pending',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, price_charged: form.price_charged ? Number(form.price_charged) : undefined };
      if (initial) {
        await appointmentsApi.update(token, initial.id, data);
      } else {
        await appointmentsApi.create(token, data);
      }
      onSaved();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">{initial ? 'Editar cita' : 'Nueva cita'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nombre del cliente">
            <input type="text" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} required className="input" />
          </Field>
          <Field label="Teléfono (opcional)">
            <input type="tel" value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} className="input" />
          </Field>
          <Field label="Servicio">
            <select value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))} required className="input">
              <option value="">Seleccionar...</option>
              {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Fecha">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="input" />
          </Field>
          <Field label="Hora de inicio">
            <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required className="input" />
          </Field>
          <Field label="Precio cobrado (CLP)">
            <input type="number" value={form.price_charged} onChange={e => setForm(f => ({ ...f, price_charged: e.target.value }))} className="input" placeholder="Auto desde el servicio" />
          </Field>
          <Field label="Origen">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input">
              {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          {initial && (
            <Field label="Estado">
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          )}
          <Field label="Notas">
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 bg-brand-pink text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      {children}
    </div>
  );
}
