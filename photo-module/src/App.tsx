import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Plus, Trash2, X, Info, Calendar, Clock, Image as ImageIcon, ArrowUpDown, ChevronRight, ChevronLeft, HardDrive } from 'lucide-react';

interface PhotoMetadata {
  stats: any;
  exif?: any;
}

interface Photo {
  name: string;
  url: string;
  date: number;
  uploadDate: number;
  metadata: PhotoMetadata;
}

const App = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    try {
      const res = await fetch('api/photos');
      const data = await res.json();
      if (Array.isArray(data)) setPhotos(data);
      else setPhotos([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPhotos(); }, []);

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => sortOrder === 'desc' ? b.date - a.date : a.date - b.date);
  }, [photos, sortOrder]);

  const groups = useMemo(() => {
    const map: { [key: string]: Photo[] } = {};
    sortedPhotos.forEach(p => {
      const d = new Date(p.date);
      const key = isNaN(d.getTime()) ? "Inconnue" : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [sortedPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    for (const file of Array.from(e.target.files)) {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('lastModified', String(file.lastModified));
      try { await fetch('api/photos', { method: 'POST', body: fd }); } catch (err) { }
    }
    fetchPhotos();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`api/photos/${encodeURIComponent(deletingId)}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedPhoto?.name === deletingId) setSelectedPhoto(null);
        fetchPhotos();
      }
    } catch (err) { }
    setDeletingId(null);
  };

  if (loading && photos.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-base-300">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-300 text-base-content font-sans pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 bg-base-100/50 p-8 rounded-[32px] backdrop-blur-xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="bg-primary/20 p-4 rounded-2xl">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Ma Galerie</h1>
              <p className="text-base-content/50 font-medium tracking-wide flex items-center gap-2 mt-1">
                <HardDrive size={14} /> Homelab Storage
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="join bg-base-100 rounded-full border border-white/10 p-1 shadow-inner">
              <button
                className={`btn btn-sm join-item rounded-full border-none px-6 ${sortOrder === 'desc' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSortOrder('desc')}
              >Récents</button>
              <button
                className={`btn btn-sm join-item rounded-full border-none px-6 ${sortOrder === 'asc' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSortOrder('asc')}
              >Anciens</button>
            </div>
            <label className="btn btn-primary btn-sm md:btn-md rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 px-8">
              <Plus size={20} />
              <span className="hidden md:inline">Importer</span>
              <input type="file" className="hidden" accept="image/*" multiple onChange={handleUpload} />
            </label>
          </div>
        </header>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] bg-base-100/20 rounded-[48px] border-4 border-dashed border-white/5 scale-100 transition-transform">
            <div className="bg-base-100 p-10 rounded-full shadow-2xl mb-8">
              <ImageIcon size={64} className="opacity-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold opacity-30">Galerie Vide</h2>
            <p className="opacity-20 mt-2 font-medium">Glissez vos fichiers ou utilisez le bouton Import</p>
          </div>
        ) : (
          Object.keys(groups).map(date => (
            <section key={date} className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(54,211,153,0.5)]"></div>
                <h2 className="text-2xl font-black text-base-content/90 tracking-tight">{date}</h2>
                <div className="badge badge-outline border-white/10 text-xs font-bold px-3 opacity-50">{groups[date].length} PHOTOS</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                {groups[date].map(p => (
                  <div key={p.name} className="group relative aspect-square rounded-[32px] overflow-hidden bg-base-200 border border-white/5 cursor-pointer shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
                    <img
                      src={p.url}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onClick={() => setSelectedPhoto(p)}
                    />
                    <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        className="btn btn-circle btn-sm btn-error shadow-2xl text-white border-none"
                        onClick={(e) => { e.stopPropagation(); setDeletingId(p.name); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden transition-all animate-in fade-in duration-300">
          <div className="absolute top-6 right-6 flex gap-4 z-[110]">
            <button className={`btn btn-circle ${showMeta ? 'btn-primary' : 'btn-ghost bg-white/10 text-white'}`} onClick={() => setShowMeta(!showMeta)}>
              <Info size={24} />
            </button>
            <button className="btn btn-circle btn-ghost bg-white/10 text-white" onClick={() => { setSelectedPhoto(null); setShowMeta(false); }}>
              <X size={24} />
            </button>
          </div>

          <div className={`flex flex-col lg:flex-row w-full h-full transition-all duration-500 ${showMeta ? 'lg:pr-96' : ''}`}>
            <div className="flex-1 flex items-center justify-center p-4">
              <img src={selectedPhoto.url} alt="full" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl drop-shadow-[0_0_50px_rgba(0,0,0,0.5)]" />
            </div>
          </div>

          {showMeta && (
            <div className="absolute top-0 right-0 w-full lg:w-96 h-full bg-base-100/80 backdrop-blur-3xl border-l border-white/10 p-8 pt-24 overflow-y-auto animate-in slide-in-from-right duration-500">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                <Info size={24} className="text-primary" /> Détails Fichier
              </h3>

              <div className="space-y-8">
                <div className="bg-base-300/50 p-5 rounded-2xl border border-white/5">
                  <p className="text-xs uppercase font-black text-base-content/40 tracking-widest mb-4">Informations Système</p>
                  <ul className="space-y-4 font-medium text-sm">
                    <li className="flex justify-between items-center"><span className="opacity-50 flex items-center gap-2"><ImageIcon size={14} /> Type</span> <span className="text-primary">{selectedPhoto.name.split('.').pop()?.toUpperCase()}</span></li>
                    <li className="flex justify-between items-center"><span className="opacity-50 flex items-center gap-2"><HardDrive size={14} /> Taille</span> <span>{(selectedPhoto.metadata.stats.size / 1024 / 1024).toFixed(2)} Mo</span></li>
                    <li className="flex flex-col gap-1 mt-6">
                      <span className="opacity-50 flex items-center gap-2 text-[10px]"><Calendar size={12} /> DATE SOURCE (LA PLUS ANCIENNE)</span>
                      <span className="bg-primary/10 text-primary px-3 py-2 rounded-xl text-center text-xs mt-1 border border-primary/20">
                        {new Date(selectedPhoto.date).toLocaleString('fr-FR')}
                      </span>
                    </li>
                  </ul>
                </div>

                {selectedPhoto.metadata.exif && Object.keys(selectedPhoto.metadata.exif).length > 0 && (
                  <div className="bg-base-300/50 p-5 rounded-2xl border border-white/5">
                    <p className="text-xs uppercase font-black text-base-content/40 tracking-widest mb-4">Métadonnées EXIF</p>
                    <div className="grid grid-cols-1 gap-4 text-sm font-medium">
                      {selectedPhoto.metadata.exif.Make && <div className="flex justify-between"><span className="opacity-50">Appareil</span><span>{selectedPhoto.metadata.exif.Make}</span></div>}
                      {selectedPhoto.metadata.exif.Model && <div className="flex justify-between"><span className="opacity-50">Modèle</span><span>{selectedPhoto.metadata.exif.Model}</span></div>}
                      {selectedPhoto.metadata.exif.ExposureTime && <div className="flex justify-between"><span className="opacity-50">Temps d'expo</span><span>1/{Math.round(1 / selectedPhoto.metadata.exif.ExposureTime)}s</span></div>}
                      {selectedPhoto.metadata.exif.FNumber && <div className="flex justify-between"><span className="opacity-50">Ouverture</span><span>f/{selectedPhoto.metadata.exif.FNumber}</span></div>}
                      {selectedPhoto.metadata.exif.ISO && <div className="flex justify-between"><span className="opacity-50">ISO</span><span>{selectedPhoto.metadata.exif.ISO}</span></div>}
                      {selectedPhoto.metadata.exif.FocalLength && <div className="flex justify-between"><span className="opacity-50">Focale</span><span>{selectedPhoto.metadata.exif.FocalLength}mm</span></div>}
                    </div>
                  </div>
                )}

                <div className="bg-error/5 p-5 rounded-2xl border border-error/10 mt-10">
                  <button className="btn btn-error btn-outline w-full rounded-xl gap-2 h-14" onClick={() => setDeletingId(selectedPhoto.name)}>
                    <Trash2 size={18} /> Supprimer Photo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-base-100 p-8 rounded-[32px] max-w-md w-full shadow-2xl border border-white/10 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black mb-4 text-error flex items-center gap-3">
              <Trash2 size={28} /> Confirmation
            </h3>
            <p className="text-base-content/70 font-medium mb-8 leading-relaxed">
              Voulez-vous vraiment supprimer <span className="text-base-content font-bold underline decoration-error/30 underline-offset-4">{deletingId}</span> ? Cette action n'est pas réversible.
            </p>
            <div className="flex gap-4">
              <button className="btn btn-ghost flex-1 rounded-2xl font-bold" onClick={() => setDeletingId(null)}>Annuler</button>
              <button className="btn btn-error flex-1 rounded-2xl shadow-lg shadow-error/20 font-bold text-white px-8" onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
