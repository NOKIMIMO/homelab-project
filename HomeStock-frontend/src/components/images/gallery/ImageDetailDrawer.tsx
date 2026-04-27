import { Info, X, ChevronLeft, Settings, Trash2 } from "lucide-react";
import MetaDataDisplay from "./MetaDataDisplay";
import type { Photo } from "../../../types/photo";

interface ImageDetailDrawerProps {
    selectedPhoto: Photo,
    showMeta: boolean,
    setShowMeta: (show: boolean) => void,
    unselectPhoto: () => void,
    requestDelete: (photoName: string) => void,
}

const ImageDetailDrawer: React.FC<ImageDetailDrawerProps> = ({ selectedPhoto, showMeta, setShowMeta, unselectPhoto, requestDelete }) => {
    return (
        <div className="fixed inset-0 z-260 bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden transition-all animate-in fade-in duration-300">
            <div className="absolute top-6 right-6 flex gap-4 z-270">
                <button className={`btn btn-circle btn-lg ${showMeta ? 'btn-primary shadow-xl shadow-primary/40' : 'btn-ghost bg-white/10 text-white'}`} onClick={() => setShowMeta(!showMeta)}>
                    <Info size={20} />
                </button>
                <button className="btn btn-circle btn-lg btn-ghost bg-white/10 text-white" onClick={() => { unselectPhoto(); setShowMeta(false); }}>
                    <X size={20} />
                </button>
            </div>


            <div className={`flex flex-col lg:flex-row w-full h-full transition-all duration-700 ease-out-expo ${showMeta ? 'lg:pr-100' : ''}`}>
                <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                    <img src={selectedPhoto.url} alt={selectedPhoto.name} className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 animate-in zoom-in-90 duration-700" />
                </div>
            </div>

            {showMeta && (
                <div className="absolute top-0 right-0 w-full lg:w-100 h-full bg-base-100/40 backdrop-blur-[60px] border-l border-white/10 p-10 pt-32 overflow-y-auto animate-in slide-in-from-right duration-700 z-275">
                    <div className="absolute top-6 left-6 z-285">
                        <button className="btn btn-circle btn-lg btn-ghost bg-white/10 text-white" onClick={() => setShowMeta(false)}>
                            <ChevronLeft size={20} />
                        </button>
                    </div>
                    <h3 className="text-3xl font-black mb-10 flex items-center gap-4">
                        <Settings size={20} className="text-primary" /> Fichier
                    </h3>

                    <MetaDataDisplay
                        name={selectedPhoto.name}
                        size={selectedPhoto.metadata?.stats?.size || 0}
                        date={selectedPhoto.date}
                        metadata={selectedPhoto.metadata}
                    />

                    <div className="pt-4">
                        <button className="btn btn-error btn-outline w-full rounded-3xl gap-3 h-16 font-black tracking-widest text-[10px] hover:bg-error hover:text-white border-2" onClick={() => requestDelete(selectedPhoto.name)}>
                            <Trash2 size={18} /> SUPPRIMER DÉFINITIVEMENT
                        </button>
                    </div>
                    
                </div>
            )}
        </div>
    )
} 

export default ImageDetailDrawer