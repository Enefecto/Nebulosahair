import { useEffect, useState } from 'react';
import AuthGuard from './AuthGuard';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { servicesApi, uploadApi } from '../../lib/api';
import { formatPrice, CATEGORY_LABELS } from '../../lib/utils';

export default function ServicesPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  async function load() {
    if (!token) return;
    const data = await servicesApi.list(token) as any[];
    setServices(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [token]);

  async function handleDelete(id: string) {
    if (!token || !confirm('¿Eliminar este servicio?')) return;
    try {
      await servicesApi.delete(token, id);
      setServices(s => s.filter(x => x.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar activeSection="Servicios" />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="bg-brand-pink text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-pink-dark transition-colors"
            >
              + Nuevo servicio
            </button>
          </div>

          {loading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Nombre</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Precio</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Duración</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {services.map(svc => (
                    <tr key={svc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{svc.name}</td>
                      <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[svc.category] || svc.category}</td>
                      <td className="px-4 py-3 text-gray-900">{formatPrice(svc.price)}</td>
                      <td className="px-4 py-3 text-gray-600">{svc.duration_minutes} min</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${svc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {svc.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => { setEditing(svc); setShowForm(true); }}
                          className="text-brand-pink hover:underline text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id)}
                          className="text-red-400 hover:underline text-xs"
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
            <ServiceForm
              token={token!}
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

function ServiceForm({ token, initial, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price || '',
    duration_minutes: initial?.duration_minutes || '',
    category: initial?.category || 'corte',
    is_active: initial?.is_active ?? true,
    sort_order: initial?.sort_order ?? 0,
    image_url: initial?.image_url || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, price: Number(form.price), duration_minutes: Number(form.duration_minutes), sort_order: Number(form.sort_order) };
      if (initial) {
        await servicesApi.update(token, initial.id, data);
      } else {
        await servicesApi.create(token, data);
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
        <h2 className="text-lg font-bold mb-4">{initial ? 'Editar servicio' : 'Nuevo servicio'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'name', label: 'Nombre', type: 'text' },
            { key: 'price', label: 'Precio (CLP)', type: 'number' },
            { key: 'duration_minutes', label: 'Duración (min)', type: 'number' },
            { key: 'sort_order', label: 'Orden', type: 'number' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required={key !== 'sort_order'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            />
            Activo (visible en página pública)
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-brand-pink text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
