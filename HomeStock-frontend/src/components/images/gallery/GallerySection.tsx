import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Photo } from '../../../types/photo';

interface Props {
  date: string;
  photos: Photo[];
  onSelectPhoto: (photo: Photo) => void;
  onDeletePhoto: (photoName: string) => void;
}

const GallerySection: React.FC<Props> = ({ date, photos, onSelectPhoto, onDeletePhoto }) => {
  return (
    <section className="mb-20">
      <div className="flex items-center gap-6 mb-10">
        <div className="h-1 lg:h-2 w-16 bg-primary rounded-full shadow-[0_0_20px_rgba(54,211,153,0.4)]"></div>
        <h2 className="text-3xl font-black text-base-content/90 tracking-tight">{date}</h2>
        <div className="badge badge-primary bg-primary/10 border-none text-[10px] font-black tracking-widest px-4 py-3 opacity-60 uppercase">
          {photos.length} PHOTOS
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
        {photos.map((photo) => (
          <div
            key={photo.name}
            className="group relative aspect-[3/4] rounded-[40px] overflow-hidden bg-base-200 border border-white/5 cursor-pointer shadow-xl transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] active:scale-95"
          >
            <img
              src={photo.url}
              alt={photo.name}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              onClick={() => onSelectPhoto(photo)}
            />
            <div className="absolute top-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 relative z-20">
              <button
                className="btn btn-circle btn-sm btn-error shadow-2xl text-white border-none hover:scale-110 active:scale-90"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(photo.name);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white text-[10px] font-black truncate uppercase tracking-widest opacity-80">{photo.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GallerySection;
