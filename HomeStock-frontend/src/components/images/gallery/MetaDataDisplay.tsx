import { ImageIcon, HardDrive, Calendar } from "lucide-react"

interface MetaDataProps {
    name: String,
    size: number,
    date: number,
    metadata?: {
        exif?: {
            Make?: string;
            Model?: string;
            ExposureTime?: number;
            FNumber?: number;
            ISO?: number;
        };
    };
}

const MetaDataDisplay:React.FC<MetaDataProps> =({name,size,date,metadata}) => {
    return (
        <div className="space-y-10">
            <div className="bg-base-100/50 p-6 rounded-4xl border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl"></div>
                <p className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mb-6">MÉTADONNÉES SYSTÈME</p>
                <ul className="space-y-5 font-bold text-sm">
                    <li className="flex justify-between items-center"><span className="opacity-40 flex items-center gap-3"><ImageIcon size={16} /> Type</span> <span className="badge badge-primary bg-primary/20 border-none text-primary px-3">{name.split('.').pop()?.toUpperCase()}</span></li>
                    <li className="flex justify-between items-center"><span className="opacity-40 flex items-center gap-3"><HardDrive size={16} /> Taille</span> <span>{(size / 1024 / 1024).toFixed(2)} Mo</span></li>
                    <li className="flex flex-col gap-3 mt-8 pt-6 border-t border-white/5">
                        <span className="opacity-40 flex items-center gap-3 text-[10px] tracking-widest uppercase"><Calendar size={14} /> Date la plus ancienne</span>
                        <span className="bg-base-300/80 p-4 rounded-2xl text-center text-xs tracking-wide">
                            {new Date(date).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </li>
                </ul>
            </div>

            {metadata?.exif && Object.keys(metadata.exif).length > 0 && (
                <div className="bg-base-100/50 p-6 rounded-4xl border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/5 rounded-full blur-3xl"></div>
                    <p className="text-[10px] uppercase font-black text-base-content/40 tracking-[0.2em] mb-6">PROPRIÉTÉS EXIF</p>
                    <div className="grid grid-cols-1 gap-5 text-sm font-bold">
                        {metadata.exif.Make && <div className="flex justify-between"><span className="opacity-40">Marque</span><span>{metadata.exif.Make}</span></div>}
                        {metadata.exif.Model && <div className="flex justify-between"><span className="opacity-40">Modèle</span><span className="text-primary">{metadata.exif.Model}</span></div>}
                        <div className="h-px bg-white/5 my-2"></div>
                        {metadata.exif.ExposureTime && <div className="flex justify-between"><span className="opacity-40">Expo</span><span>1/{Math.round(1 / metadata.exif.ExposureTime)}s</span></div>}
                        {metadata.exif.FNumber && <div className="flex justify-between"><span className="opacity-40">Ouverture</span><span>f/{metadata.exif.FNumber}</span></div>}
                        {metadata.exif.ISO && <div className="flex justify-between"><span className="opacity-40">ISO</span><span>{metadata.exif.ISO}</span></div>}
                    </div>
                </div>
            )}
        </div>
    )
}

export default MetaDataDisplay