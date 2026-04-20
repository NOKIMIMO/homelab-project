import { Camera, ImageIcon, Layout, Plus, X, Trash2, Info, Settings, HardDrive, Calendar, ChevronLeft } from "lucide-react";
import styles from "../../lib/style";
import { useNavigate } from "react-router";
import { EmptyGalleryState, SortButton, ViewToggleButton } from "../../components/ui/Controls";
import { useEffect, useMemo, useState, useRef, type ChangeEvent } from "react";
import { apiUrl } from "../../lib/api";
import GallerySection from "../../components/images/gallery/GallerySection";
import type { Photo } from "../../types/photo";
import AppButton from "../../components/ui/AppButton";

type SortOrder = 'asc' | 'desc';
const GROUP_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
};

// TODO: split, trop large, trop de gestion multiple, le modal pourrai être un composant à part
const ImagesDisplayer = () => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMeta, setShowMeta] = useState(false);
    const imageRef = useRef<HTMLDivElement | null>(null);
    const metaRef = useRef<HTMLDivElement | null>(null);


    const sortedPhotos = useMemo(() => {
        return [...photos].sort((a, b) =>
        sortOrder === 'desc' ? b.date - a.date : a.date - b.date
        );
    }, [photos, sortOrder]);

    const formatGroupDate = (timestamp: number): string => {
        const parsedDate = new Date(timestamp);
        if (Number.isNaN(parsedDate.getTime())) {
            return 'Inconnue';
        }
        return parsedDate.toLocaleDateString('fr-FR', GROUP_DATE_FORMAT);
    };

    const groups = useMemo(() => {
        const map: Record<string, Photo[]> = {};
        sortedPhotos.forEach((photo) => {
        const key = formatGroupDate(photo.date);
        if (!map[key]) {
            map[key] = [];
        }
        map[key].push(photo);
        });
        return map;
    }, [sortedPhotos]);



    const requestDelete = (photoName: string) => {
        setDeletingId(photoName);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        setLoading(true);
        try {
        const res = await fetch(apiUrl(`/api/photos/${encodeURIComponent(deletingId)}`), { method: 'DELETE' });
        if (res.ok) {
            if (selectedPhoto?.name === deletingId) {
            setSelectedPhoto(null);
            }
            await fetchPhotos();
        }
        } catch (e) {
        console.error(e);
        }
        setDeletingId(null);
        setShowDeleteConfirm(false);
        setLoading(false);
    };

    const cancelDelete = () => {
        setDeletingId(null);
        setShowDeleteConfirm(false);
    };

        useEffect(() => {
            if (!selectedPhoto) return;
            const onKey = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    if (showDeleteConfirm) {
                        setDeletingId(null);
                        setShowDeleteConfirm(false);
                        return;
                    }
                    if (showMeta) {
                        setShowMeta(false);
                        return;
                    }
                    setSelectedPhoto(null);
                    setShowMeta(false);
                }
            };
            window.addEventListener('keydown', onKey);
            return () => window.removeEventListener('keydown', onKey);
        }, [selectedPhoto, showMeta, showDeleteConfirm]);

        
    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setLoading(true);
        for (const file of Array.from(e.target.files)) {
        const fd = new FormData();
        fd.append('photo', file);
        fd.append('lastModified', String(file.lastModified));
        try {
            await fetch(apiUrl('/api/photos'), { method: 'POST', body: fd });
        } catch {
            // Ignore per-file upload errors and continue other files.
        }
        }
        await fetchPhotos();
    };

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
    
      useEffect(() => {
        fetchPhotos();
      }, []);
    

    //   Passage en shadow in jour
    if (loading) {
        return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-4">
                <Camera className="w-12 h-12 text-primary animate-pulse" />
                <span className="text-lg font-medium">Loading...</span>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-300 text-base-content font-sans pb-20 selection:bg-primary selection:text-white">
        <div className="max-w-7xl mx-auto p-4 md:p-10">
            <header className={styles.navShell}>
                <div className={styles.navGlow}></div>
                {/* Maybe turn into generic? */}
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-primary/20 p-4 rounded-3xl shadow-inner ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
                        <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">ImageDisplay</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <ViewToggleButton active={true} onClick={() => navigate("/")}>
                                <Layout size={14} /> Galerie
                            </ViewToggleButton>
                            <ViewToggleButton active={false} onClick={() => navigate("/boards")}>
                                <Layout size={14} /> Board
                            </ViewToggleButton>
                        </div>
                    </div>
                </div>
            </header>
            {/* Actions */}
            <div className="flex justify-end flex-wrap items-center gap-4 w-full lg:w-auto relative z-10">
                <div className="join bg-base-300/50 rounded-full border border-white/5 p-1 shadow-inner backdrop-blur-md">
                <SortButton active={sortOrder === 'desc'} onClick={() => setSortOrder('desc')} label="Récents" />
                <SortButton active={sortOrder === 'asc'} onClick={() => setSortOrder('asc')} label="Anciens" />
                </div>
                <label className="btn btn-primary btn-sm md:btn-md rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-2 px-8 font-black hover:scale-105 active:scale-95 transition-all cursor-pointer">
                <Plus size={20} />
                <span className="hidden md:inline">Importer</span>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleUpload} />
                </label>
            </div>
            {/* Content */}
            <div>
                <main className="animate-in fade-in duration-700">
                        {photos.length === 0 ? (
                            <EmptyGalleryState />
                        ) : (
                            Object.entries(groups).map(([date, groupPhotos]) => (
                                <GallerySection
                                    key={date}
                                    date={date}
                                    photos={groupPhotos}
                                    onSelectPhoto={setSelectedPhoto}
                                    onDeletePhoto={requestDelete}
                                />
                            ))
                        )}
                    </main>                                                                                                                         
                        </div>
                </div>

                {selectedPhoto && (
                    <div className="fixed inset-0 z-[260] bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden transition-all animate-in fade-in duration-300">
                                <div className="absolute top-6 right-6 flex gap-4 z-[270]">
                                    <button className={`btn btn-circle btn-lg ${showMeta ? 'btn-primary shadow-xl shadow-primary/40' : 'btn-ghost bg-white/10 text-white'}`} onClick={() => setShowMeta(!showMeta)}>
                                        <Info size={20} />
                                    </button>
                                    <button className="btn btn-circle btn-lg btn-ghost bg-white/10 text-white" onClick={() => { setSelectedPhoto(null); setShowMeta(false); }}>
                                        <X size={20} />
                                    </button>
                                </div>


                                <div className={`flex flex-col lg:flex-row w-full h-full transition-all duration-700 ease-out-expo ${showMeta ? 'lg:pr-[400px]' : ''}`}>
                                    <div ref={imageRef} className="flex-1 flex items-center justify-center p-6 md:p-12">
                                        <img src={selectedPhoto.url} alt={selectedPhoto.name} className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 animate-in zoom-in-90 duration-700" />
                                    </div>
                                </div>

                                {showMeta && (
                                    <div ref={metaRef} className="absolute top-0 right-0 w-full lg:w-[400px] h-full bg-base-100/40 backdrop-blur-[60px] border-l border-white/10 p-10 pt-32 overflow-y-auto animate-in slide-in-from-right duration-700 z-[275]">
                                        <div className="absolute top-6 left-6 z-[285]">
                                            <button className="btn btn-circle btn-lg btn-ghost bg-white/10 text-white" onClick={() => setShowMeta(false)}>
                                                <ChevronLeft size={20} />
                                            </button>
                                        </div>
                                <h3 className="text-3xl font-black mb-10 flex items-center gap-4">
                                    <Settings size={20} className="text-primary" /> Fichier
                                </h3>

                                <div className="space-y-10">
                                    <div className="bg-base-100/50 p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
                                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl"></div>
                                        <p className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mb-6">MÉTADONNÉES SYSTÈME</p>
                                        <ul className="space-y-5 font-bold text-sm">
                                            <li className="flex justify-between items-center"><span className="opacity-40 flex items-center gap-3"><ImageIcon size={16} /> Type</span> <span className="badge badge-primary bg-primary/20 border-none text-primary px-3">{selectedPhoto.name.split('.').pop()?.toUpperCase()}</span></li>
                                            <li className="flex justify-between items-center"><span className="opacity-40 flex items-center gap-3"><HardDrive size={16} /> Taille</span> <span>{(selectedPhoto.metadata?.stats?.size / 1024 / 1024).toFixed(2)} Mo</span></li>
                                            <li className="flex flex-col gap-3 mt-8 pt-6 border-t border-white/5">
                                                <span className="opacity-40 flex items-center gap-3 text-[10px] tracking-widest uppercase"><Calendar size={14} /> Date la plus ancienne</span>
                                                <span className="bg-base-300/80 p-4 rounded-2xl text-center text-xs tracking-wide">
                                                    {new Date(selectedPhoto.date).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    {selectedPhoto.metadata?.exif && Object.keys(selectedPhoto.metadata.exif).length > 0 && (
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

                                    <button className="btn btn-error btn-outline w-full rounded-[24px] gap-3 h-16 font-black tracking-widest text-[10px] hover:bg-error hover:text-white border-2" onClick={() => requestDelete(selectedPhoto.name)}>
                                        <Trash2 size={18} /> SUPPRIMER DÉFINITIVEMENT
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {showDeleteConfirm && (
                    <div
                        className="fixed inset-0 z-[270] bg-black/60 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}
                    >
                        <div className="bg-base-100 p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl border border-white/10">
                            <p className="text-lg font-black mb-4">Supprimer cette photo ?</p>
                            <div className="flex justify-center gap-4">
                                <AppButton type="button" variant="ghost" onClick={cancelDelete}>Annuler</AppButton>
                                <AppButton type="button" variant="danger" onClick={confirmDelete}>Supprimer</AppButton>
                            </div>
                        </div>
                    </div>
                )}

        </div>

        )
}

export default ImagesDisplayer;

