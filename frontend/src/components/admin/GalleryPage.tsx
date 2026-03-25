import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AuthGuard from './AuthGuard';
import Sidebar from './Sidebar';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { galleryApi, servicesApi, uploadApi } from '../../lib/api';

export default function GalleryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    const [gallery, svcs] = await Promise.all([
      galleryApi.list(token) as Promise<any[]>,
      servicesApi.list(token) as Promise<any[]>,
    ]);
    setItems(gallery);
    setServices(svcs);
    setLoading(false);
  }

  useEffect(() => { load(); }, [token]);

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await galleryApi.delete(token, id);
      setItems(i => i.filter(x => x.id !== id));
      toast.success('Imagen eliminada');
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleToggleVisible(item: any) {
    if (!token) return;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
    try {
      await galleryApi.update(token, item.id, { ...item, is_visible: !item.is_visible });
      toast.success(!item.is_visible ? 'Imagen visible' : 'Imagen oculta');
    } catch (e: any) {
      load();
      toast.error(e.message || 'Error al actualizar');
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar activeSection="Galería" />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Galería</h1>
            <UploadButton token={token!} onUploaded={load} services={services} />
          </div>

          {loading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map(item => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={item.image_url}
                    alt={item.title || ''}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => handleToggleVisible(item)}
                      className="text-xs bg-white text-gray-800 px-3 py-1 rounded-full"
                    >
                      {item.is_visible ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item.id)}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded-full"
                    >
                      Eliminar
                    </button>
                  </div>
                  {!item.is_visible && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      Oculta
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {confirmDelete && (
            <ConfirmDialog
              message="¿Eliminar esta imagen? Esta acción no se puede deshacer."
              confirmLabel="Eliminar imagen"
              onConfirm={() => handleDelete(confirmDelete)}
              onCancel={() => setConfirmDelete(null)}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

function UploadButton({ token, onUploaded, services }: any) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadApi.upload(token, file, 'gallery', `gallery_${Date.now()}`) as any;
      await (galleryApi.create as any)(token, { image_url: url, is_visible: true, sort_order: 0 });
      onUploaded();
    } catch (err: any) {
      toast.error(err.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <label className="bg-brand-pink text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-brand-pink-dark transition-colors">
      {uploading ? 'Subiendo...' : '+ Subir imagen'}
      <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
    </label>
  );
}
