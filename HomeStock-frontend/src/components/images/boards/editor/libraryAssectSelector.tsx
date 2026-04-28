import { Photo } from "@spe_types/photo";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface LibraryAssetSelectorProps {
    addAsset: (photo: Photo) => void;
}

const libraryAssetSelector: React.FC<LibraryAssetSelectorProps> = ({ addAsset }) => {

    const [library, setLibrary] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLibrary = useCallback(async () => {
        try {
        const res = await fetch('/api/photos');
        if (res.ok) {
            const data = await res.json();
            setLibrary(data);
        }
        } catch (err) {
        console.error("Failed to fetch library", err);
        } 
        finally{
            setLoading(false)
        }
    }, []);


    useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

    if (loading) {
        return (
        <div className="col-span-2 text-center py-10 opacity-30">
            <Loader2 className="w-8 h-8 mx-auto animate-spin" />
        </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 py-4 animate-in fade-in duration-500">
            {library.length === 0 ? (
            <div className="col-span-2 text-center py-10 opacity-30 text-xs font-bold">Aucune photo dans la galerie</div>
            ) : library.map(photo => (
                <div 
                key={photo.name} 
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer hover:ring-4 ring-primary/50 transition-all bg-base-300 shadow-lg"
                onClick={() => addAsset(photo)}
                >
                <img src={photo.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="bg-white p-2 rounded-full shadow-2xl text-primary"><Plus /></div>
                </div>
                </div>
            ))}
        </div>
    )
}

export default libraryAssetSelector;