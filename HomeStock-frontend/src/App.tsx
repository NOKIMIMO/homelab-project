import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, Plus, Trash2, X, Info, Calendar, Clock, Image as ImageIcon, 
  ArrowUpDown, ChevronRight, ChevronLeft, HardDrive, Layout, 
  Settings, Save, Search
} from 'lucide-react';
import BoardList from './components/BoardList';
import BoardEditor from './components/BoardEditor';
import GallerySection from './components/gallery/GallerySection';
import CreateBoardModal from './components/modals/CreateBoardModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import AppButton from './components/ui/AppButton';
import { apiUrl } from './lib/api';
import type { Photo } from './types/photo';

const styles = {
  navShell: 'flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 bg-base-100/50 p-6 md:p-8 rounded-[40px] backdrop-blur-2xl border border-white/5 shadow-2xl relative overflow-hidden group',
  navGlow: 'absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000',
  viewToggle: 'text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all',
  viewTogglePassive: 'opacity-40 hover:opacity-100'
};

type View = 'gallery' | 'boards';

const App = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Navigation & Board States
  const [view, setView] = useState<View>('gallery');
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  
  const fetchPhotos = async () => {
    try {
      const res = await fetch(apiUrl('/api/photos'));
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
      try { await fetch(apiUrl('/api/photos'), { method: 'POST', body: fd }); } catch (err) { }
    }
    fetchPhotos();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(apiUrl(`/api/photos/${encodeURIComponent(deletingId)}`), { method: 'DELETE' });
      if (res.ok) {
        if (selectedPhoto?.name === deletingId) setSelectedPhoto(null);
        fetchPhotos();
      }
    } catch (err) { }
    setDeletingId(null);
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName) return;
    
    // Generate a unique UUID for the new board
    const boardId = crypto.randomUUID();
    
    try {
      const res = await fetch(apiUrl(`/api/boards/${boardId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newBoardName,
          width: 1920,
          height: 1080 
        })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewBoardName('');
        // Immediately open the newly created board
        setEditingBoardId(boardId);
        setView('boards');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && photos.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-base-300">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-300 text-base-content font-sans pb-20 selection:bg-primary selection:text-white">
      
      {/* 1. Main Dashboard Shell */}
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        
        {/* Navigation Header */}
        <header className={styles.navShell}>
          <div className={styles.navGlow}></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="bg-primary/20 p-4 rounded-3xl shadow-inner ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">PhotoLab</h1>
              <div className="flex items-center gap-4 mt-2">
                 <button 
                   onClick={() => setView('gallery')}
                   className={`${styles.viewToggle} ${view === 'gallery' ? 'text-primary' : styles.viewTogglePassive}`}
                 >
                   <ImageIcon size={14}/> Galerie
                 </button>
                 <div className="h-3 w-px bg-white/10"></div>
                 <button 
                   onClick={() => setView('boards')}
                   className={`${styles.viewToggle} ${view === 'boards' ? 'text-primary' : styles.viewTogglePassive}`}
                 >
                   <Layout size={14}/> Tableaux
                 </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto relative z-10">
            {view === 'gallery' ? (
              <>
                <div className="join bg-base-300/50 rounded-full border border-white/5 p-1 shadow-inner backdrop-blur-md">
                  <button
                    className={`btn btn-xs md:btn-sm join-item rounded-full border-none px-6 ${sortOrder === 'desc' ? 'btn-primary shadow-lg shadow-primary/20' : 'btn-ghost opacity-50 font-bold'}`}
                    onClick={() => setSortOrder('desc')}
                  >Récents</button>
                  <button
                    className={`btn btn-xs md:btn-sm join-item rounded-full border-none px-6 ${sortOrder === 'asc' ? 'btn-primary shadow-lg shadow-primary/20' : 'btn-ghost opacity-50 font-bold'}`}
                    onClick={() => setSortOrder('asc')}
                  >Anciens</button>
                </div>
                <label className="btn btn-primary btn-sm md:btn-md rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-2 px-8 font-black hover:scale-105 active:scale-95 transition-all cursor-pointer">
                  <Plus size={20} />
                  <span className="hidden md:inline">Importer</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleUpload} />
                </label>
              </>
            ) : (
              <AppButton
                onClick={() => {
                  setShowCreateModal(true);
                }}
                className="rounded-2xl px-8 gap-2"
                size="sm"
              >
                <Plus size={20} />
                <span>Nouveau Tableau</span>
              </AppButton>
            )}
          </div>
        </header>

        {/* Dynamic Content Switching */}
        <main className="animate-in fade-in duration-700">
           {view === 'gallery' ? (
              // --- GALLERY VIEW ---
              photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[500px] bg-base-100/20 rounded-[64px] border-4 border-dashed border-white/5 scale-100 transition-transform">
                  <div className="bg-base-100 p-12 rounded-full shadow-2xl mb-8 ring-8 ring-white/5">
                    <ImageIcon size={72} className="opacity-10 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black opacity-30 tracking-tight">Galerie Vide</h2>
                  <p className="opacity-20 mt-2 font-black uppercase tracking-widest text-xs">Importez vos premiers souvenirs</p>
                </div>
              ) : (
                Object.keys(groups).map((date) => (
                  <GallerySection
                    key={date}
                    date={date}
                    photos={groups[date]}
                    onSelectPhoto={(photo) => setSelectedPhoto(photo)}
                    onDeletePhoto={setDeletingId}
                  />
                ))
              )
           ) : (
              // --- BOARDS VIEW ---
              <BoardList 
                onSelectBoard={(id) => setEditingBoardId(id)}
                onCreateBoard={() => setShowCreateModal(true)}
              />
           )}
        </main>
      </div>

      {/* 2. Overlays & Modals */}
      
      {/* Board Editor Overlay */}
      {editingBoardId && (
        <BoardEditor 
          boardId={editingBoardId} 
          onClose={() => setEditingBoardId(null)} 
        />
      )}

      <CreateBoardModal
        open={showCreateModal}
        boardName={newBoardName}
        onBoardNameChange={setNewBoardName}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBoard}
      />

      {/* Photo Detail Modal (Legacy Gallery View) */}
      {selectedPhoto && !editingBoardId && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden transition-all animate-in fade-in duration-500">
          <div className="absolute top-8 right-8 flex gap-4 z-[110]">
            <button className={`btn btn-circle btn-lg ${showMeta ? 'btn-primary shadow-xl shadow-primary/40' : 'btn-ghost bg-white/10 text-white'}`} onClick={() => setShowMeta(!showMeta)}>
              <Info size={28} />
            </button>
            <button className="btn btn-circle btn-lg btn-ghost bg-white/10 text-white" onClick={() => { setSelectedPhoto(null); setShowMeta(false); }}>
              <X size={28} />
            </button>
          </div>

          <div className={`flex flex-col lg:flex-row w-full h-full transition-all duration-700 ease-out-expo ${showMeta ? 'lg:pr-[400px]' : ''}`}>
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
              <img src={selectedPhoto.url} alt="full" className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 animate-in zoom-in-90 duration-700" />
            </div>
          </div>

          {showMeta && (
            <div className="absolute top-0 right-0 w-full lg:w-[400px] h-full bg-base-100/40 backdrop-blur-[60px] border-l border-white/10 p-10 pt-32 overflow-y-auto animate-in slide-in-from-right duration-700">
              <h3 className="text-3xl font-black mb-10 flex items-center gap-4">
                <Settings size={28} className="text-primary" /> Fichier
              </h3>

              <div className="space-y-10">
                <div className="bg-base-100/50 p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl"></div>
                  <p className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mb-6">MÉTADONNÉES SYSTÈME</p>
                  <ul className="space-y-5 font-bold text-sm">
                    <li className="flex justify-between items-center"><span className="opacity-40 flex items-center gap-3"><ImageIcon size={16} /> Type</span> <span className="badge badge-primary bg-primary/20 border-none text-primary px-3">{selectedPhoto.name.split('.').pop()?.toUpperCase()}</span></li>
                    <li className="flex justify-between items-center"><span className="opacity-40 flex items-center gap-3"><HardDrive size={16} /> Taille</span> <span>{(selectedPhoto.metadata.stats.size / 1024 / 1024).toFixed(2)} Mo</span></li>
                    <li className="flex flex-col gap-3 mt-8 pt-6 border-t border-white/5">
                      <span className="opacity-40 flex items-center gap-3 text-[10px] tracking-widest uppercase"><Calendar size={14} /> Date la plus ancienne</span>
                      <span className="bg-base-300/80 p-4 rounded-2xl text-center text-xs tracking-wide">
                        {new Date(selectedPhoto.date).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  </ul>
                </div>

                {selectedPhoto.metadata.exif && Object.keys(selectedPhoto.metadata.exif).length > 0 && (
                  <div className="bg-base-100/50 p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/5 rounded-full blur-3xl"></div>
                    <p className="text-[10px] uppercase font-black text-base-content/40 tracking-[0.2em] mb-6">PROPRIÉTÉS EXIF</p>
                    <div className="grid grid-cols-1 gap-5 text-sm font-bold">
                      {selectedPhoto.metadata.exif.Make && <div className="flex justify-between"><span className="opacity-40">Marque</span><span>{selectedPhoto.metadata.exif.Make}</span></div>}
                      {selectedPhoto.metadata.exif.Model && <div className="flex justify-between"><span className="opacity-40">Modèle</span><span className="text-primary">{selectedPhoto.metadata.exif.Model}</span></div>}
                      <div className="h-px bg-white/5 my-2"></div>
                      {selectedPhoto.metadata.exif.ExposureTime && <div className="flex justify-between"><span className="opacity-40">Expo</span><span>1/{Math.round(1 / selectedPhoto.metadata.exif.ExposureTime)}s</span></div>}
                      {selectedPhoto.metadata.exif.FNumber && <div className="flex justify-between"><span className="opacity-40">Ouverture</span><span>f/{selectedPhoto.metadata.exif.FNumber}</span></div>}
                      {selectedPhoto.metadata.exif.ISO && <div className="flex justify-between"><span className="opacity-40">ISO</span><span>{selectedPhoto.metadata.exif.ISO}</span></div>}
                    </div>
                  </div>
                )}

                <button className="btn btn-error btn-outline w-full rounded-[24px] gap-3 h-16 font-black tracking-widest text-[10px] hover:bg-error hover:text-white border-2" onClick={() => setDeletingId(selectedPhoto.name)}>
                  <Trash2 size={18} /> SUPPRIMER DÉFINITIVEMENT
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <DeleteConfirmModal
        open={Boolean(deletingId)}
        message="Voulez-vous vraiment supprimer cet asset ? Cette action est irreversible."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};

export default App;
