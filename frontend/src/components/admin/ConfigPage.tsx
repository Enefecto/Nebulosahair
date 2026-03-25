import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AuthGuard from './AuthGuard';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { configApi, uploadApi } from '../../lib/api';

export default function ConfigPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    business_name: '',
    whatsapp_number: '',
    instagram_url: '',
    address: '',
    address_lat: '',
    address_lng: '',
    logo_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!token) return;
    configApi.get(token).then((data: any) => {
      setForm({
        business_name: data.business_name || '',
        whatsapp_number: data.whatsapp_number || '',
        instagram_url: data.instagram_url || '',
        address: data.address || '',
        address_lat: data.address_lat?.toString() || '',
        address_lng: data.address_lng?.toString() || '',
        logo_url: data.logo_url || '',
      });
    });
  }, [token]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await configApi.update(token, {
        ...form,
        address_lat: form.address_lat ? parseFloat(form.address_lat) : undefined,
        address_lng: form.address_lng ? parseFloat(form.address_lng) : undefined,
      });
      toast.success('Configuración guardada');
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const { url } = await uploadApi.upload(token, file, 'logo', 'logo') as any;
      setForm(f => ({ ...f, logo_url: url }));
    } catch (err: any) {
      toast.error(err.message || 'Error al subir logo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar activeSection="Configuración" />
        <main className="flex-1 p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {[
              { key: 'business_name', label: 'Nombre del negocio', type: 'text' },
              { key: 'whatsapp_number', label: 'WhatsApp (ej: +56912345678)', type: 'tel' },
              { key: 'instagram_url', label: 'URL de Instagram', type: 'url' },
              { key: 'address', label: 'Dirección', type: 'text' },
              { key: 'address_lat', label: 'Latitud', type: 'number' },
              { key: 'address_lng', label: 'Longitud', type: 'number' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  step={type === 'number' ? 'any' : undefined}
                />
              </div>
            ))}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Logo</label>
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-xl border border-gray-200 mb-2" />
              )}
              <label className="cursor-pointer text-sm text-brand-pink hover:underline">
                {uploading ? 'Subiendo...' : 'Cambiar logo'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-brand-pink text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-pink-dark transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}
