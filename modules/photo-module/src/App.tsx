import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, Plus, Trash2, X, Info, Calendar, Clock, Image as ImageIcon, 
  ArrowUpDown, ChevronRight, ChevronLeft, HardDrive, Layout, 
  Settings, Save, Search
} from 'lucide-react';
import BoardList from './components/BoardList';
import BoardEditor from './components/BoardEditor';

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

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName) return;
    
    // Generate a unique UUID for the new board
    const boardId = crypto.randomUUID();
    
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
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
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 bg-base-100/50 p-6 md:p-8 rounded-[40px] backdrop-blur-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="bg-primary/20 p-4 rounded-3xl shadow-inner ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">PhotoLab</h1>
              <div className="flex items-center gap-4 mt-2">
                 <button 
                   onClick={() => setView('gallery')}
                   className={`text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all ${view === 'gallery' ? 'text-primary' : 'opacity-40 hover:opacity-100'}`}
                 >
                   <ImageIcon size={14}/> Galerie
                 </button>
                 <div className="h-3 w-px bg-white/10"></div>
                 <button 
                   onClick={() => setView('boards')}
                   className={`text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all ${view === 'boards' ? 'text-primary' : 'opacity-40 hover:opacity-100'}`}
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
                <label className="btn btn-primary btn-sm md:btn-md rounded-full shadow-xl shadow-primary/30 flex items-center gap-2 px-8 font-black hover:scale-105 active:scale-95 transition-all cursor-pointer">
                  <Plus size={20} />
                  <span className="hidden md:inline">Importer</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleUpload} />
                </label>
              </>
            ) : (
              <button 
                onClick={() => {
                  console.log("Create Board Clicked");
                  setShowCreateModal(true);
                }}
                className="btn btn-primary btn-sm md:btn-md rounded-full shadow-xl shadow-primary/30 flex items-center gap-2 px-8 font-black hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={20} />
                <span>Nouveau Tableau</span>
              </button>
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
                Object.keys(groups).map(date => (
                  <section key={date} className="mb-20">
                    <div className="flex items-center gap-6 mb-10">
                      <div className="h-1 lg:h-2 w-16 bg-primary rounded-full shadow-[0_0_20px_rgba(54,211,153,0.4)]"></div>
                      <h2 className="text-3xl font-black text-base-content/90 tracking-tight">{date}</h2>
                      <div className="badge badge-primary bg-primary/10 border-none text-[10px] font-black tracking-widest px-4 py-3 opacity-60 uppercase">{groups[date].length} PHOTOS</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
                      {groups[date].map(p => (
                        <div key={p.name} className="group relative aspect-[3/4] rounded-[40px] overflow-hidden bg-base-200 border border-white/5 cursor-pointer shadow-xl transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] active:scale-95">
                          <img
                            src={p.url}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            onClick={() => setSelectedPhoto(p)}
                          />
                          <div className="absolute top-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 relative z-20">
                            <button
                              className="btn btn-circle btn-sm btn-error shadow-2xl text-white border-none hover:scale-110 active:scale-90"
                              onClick={(e) => { e.stopPropagation(); setDeletingId(p.name); }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                             <div className="absolute bottom-6 left-6 right-6">
                               <p className="text-white text-[10px] font-black truncate uppercase tracking-widest opacity-80">{p.name}</p>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
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

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
           <form 
             onSubmit={handleCreateBoard}
             className="bg-base-100 p-10 rounded-[48px] max-w-lg w-full shadow-2xl border border-white/10 animate-in zoom-in duration-300 ring-1 ring-white/5"
           >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-3 rounded-2xl">
                    <Plus className="text-primary" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">Nouveau Tableau</h3>
                </div>
                <button type="button" className="btn btn-circle btn-ghost" onClick={() => setShowCreateModal(false)}><X/></button>
              </div>

              <div className="space-y-8">
                <div className="form-control w-full">
                   <label className="label uppercase font-black text-[10px] tracking-widest opacity-40 ml-2 mb-2">Nom du projet</label>
                   <input 
                     type="text" 
                     placeholder="ex: Voyage Islande 2024" 
                     className="input input-lg bg-base-300/50 border-none rounded-2xl font-bold focus:ring-4 ring-primary/20 transition-all"
                     value={newBoardName}
                     onChange={(e) => setNewBoardName(e.target.value)}
                     autoFocus
                   />
                </div>
                <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-center gap-4">
                   <Info className="text-primary" size={24} />
                   <p className="text-xs font-semibold leading-relaxed opacity-70">
                     Le tableau sera initialisé avec une taille standard de 1920x1080. Vous pourrez adapter les dimensions plus tard.
                   </p>
                </div>
                <button className="btn btn-primary btn-lg w-full rounded-2xl shadow-xl shadow-primary/30 font-black h-16">
                   CRÉER LE TABLEAU
                </button>
              </div>
           </form>
        </div>
      )}

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

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-base-100 p-10 rounded-[56px] max-w-md w-full shadow-2xl border border-white/10 animate-in zoom-in duration-400">
            <div className="bg-error/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-error/5">
              <Trash2 size={40} className="text-error" />
            </div>
            <h3 className="text-3xl font-black mb-4 text-center tracking-tight">Supprimer ?</h3>
            <p className="text-base-content/60 font-bold text-center mb-10 leading-relaxed px-4">
              Voulez-vous vraiment supprimer cet asset ? Cette action est irréversible.
            </p>
            <div className="flex flex-col gap-4">
              <button className="btn btn-error btn-lg rounded-2xl shadow-xl shadow-error/20 font-black text-white h-16" onClick={handleDelete}>SUPPRIMER MAINTENANT</button>
              <button className="btn btn-ghost btn-lg rounded-2xl font-black opacity-40 hover:opacity-100 tracking-widest text-[10px]" onClick={() => setDeletingId(null)}>ANNULER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
