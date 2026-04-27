import { Camera, Layout, Plus } from "lucide-react";
import styles from "@lib/style";
import { useNavigate } from "react-router";
import { EmptyGalleryState, SortButton, ViewToggleButton } from "@components/ui/Controls";
import { useEffect, useMemo, useState } from "react";
import GallerySection from "@components/images/gallery/GallerySection";
import type { Photo } from "@spe_types/photo";
import AppButton from "@components/ui/AppButton";
import ImageDetailDrawer from "@components/images/gallery/ImageDetailDrawer";
import formatGroupDate from "@services/helper/dateFormater";
import ImageService from "@services/images/imageService";

type SortOrder = 'asc' | 'desc';


const ImagesDisplayer = () => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMeta, setShowMeta] = useState(false);

    const sortedPhotos = useMemo(() => {
        return [...photos].sort((a, b) =>
        sortOrder === 'desc' ? b.date - a.date : a.date - b.date
        );
    }, [photos, sortOrder]);

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
        const success = await ImageService.deletePhoto(deletingId);
        if (success) {
            if (selectedPhoto?.name === deletingId) {
                setSelectedPhoto(null);
            }
            await fetchPhotos();
        }
        setDeletingId(null);
        setShowDeleteConfirm(false);
        setLoading(false);
    };

    const cancelDelete = () => {
        setDeletingId(null);
        setShowDeleteConfirm(false);
    };

    const fetchPhotos = async () => {
        setLoading(true);
        const photos = await ImageService.fetchPhotos();
        setPhotos(photos);
        setLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setLoading(true);
        await ImageService.uploadPhotos(e.target.files);
        await fetchPhotos();
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

    useEffect(() => {
    fetchPhotos();
    }, []);


    // Passage en shadow un jour
    // Phantom dans son component par contre
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
                        <h1 className="text-4xl font-black tracking-tight bg-linear-to-br from-white to-white/40 bg-clip-text text-transparent">ImageDisplay</h1>
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
                    <ImageDetailDrawer
                        selectedPhoto={selectedPhoto}
                        showMeta={showMeta}
                        setShowMeta={setShowMeta}
                        unselectPhoto={() => setSelectedPhoto(null)}
                        requestDelete={requestDelete}
                    />
                )}

                {showDeleteConfirm && (
                    <div
                        className="fixed inset-0 z-270 bg-black/60 flex items-center justify-center p-4"
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

