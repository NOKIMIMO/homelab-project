import { Info, X, Settings, Image as ImageIcon, HardDrive, Calendar, Trash2 } from 'lucide-react';
import styles from '../../../lib/style';
import type { Photo } from '../../../types/photo';

interface PhotoDetailModalProps {
  photo: Photo;
  showMeta: boolean;
  onToggleMeta: () => void;
  onClose: () => void;
  onDelete: (photoName: string) => void;
}
const PHOTO_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

const formatPhotoDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleString('fr-FR', PHOTO_DATE_FORMAT);

const getFileType = (fileName: string): string | undefined =>
  fileName.split('.').pop()?.toUpperCase();

const formatSizeInMb = (bytes: number): string =>
  (bytes / 1024 / 1024).toFixed(2);

const PhotoDetailModal = ({
  photo,
  showMeta,
  onToggleMeta,
  onClose,
  onDelete
}: PhotoDetailModalProps) => {
  const exif = photo.metadata.exif;
  const hasExif = Boolean(exif && Object.keys(exif).length > 0);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden transition-all animate-in fade-in duration-500">
      <div className="absolute top-8 right-8 flex gap-4 z-[110]">
        <button
          className={showMeta ? 'btn btn-circle btn-lg btn-primary shadow-xl shadow-primary/40' : styles.circleGhostButton}
          onClick={onToggleMeta}
        >
          <Info size={28} />
        </button>
        <button className={styles.circleGhostButton} onClick={onClose}>
          <X size={28} />
        </button>
      </div>

      <div className={'flex flex-col lg:flex-row w-full h-full transition-all duration-700 ease-out-expo' + (showMeta ? ' lg:pr-[400px]' : '')}>
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <img
            src={photo.url}
            alt="full"
            className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 animate-in zoom-in-90 duration-700"
          />
        </div>
      </div>

      {showMeta && (
        <div className="absolute top-0 right-0 w-full lg:w-[400px] h-full bg-base-100/40 backdrop-blur-[60px] border-l border-white/10 p-10 pt-32 overflow-y-auto animate-in slide-in-from-right duration-700">
          <h3 className="text-3xl font-black mb-10 flex items-center gap-4">
            <Settings size={28} className="text-primary" /> Fichier
          </h3>

          <div className="space-y-10">
            <div className={styles.modalCard}>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl"></div>
              <p className={styles.modalLabel + ' text-primary'}>MÉTADONNÉES SYSTÈME</p>
              <ul className="space-y-5 font-bold text-sm">
                <li className={styles.modalRow}>
                  <span className={styles.modalMetaLabel}>
                    <ImageIcon size={16} /> Type
                  </span>
                  <span className="badge badge-primary bg-primary/20 border-none text-primary px-3">
                    {getFileType(photo.name)}
                  </span>
                </li>
                <li className={styles.modalRow}>
                  <span className={styles.modalMetaLabel}>
                    <HardDrive size={16} /> Taille
                  </span>
                  <span>{formatSizeInMb(photo.metadata.stats.size)} Mo</span>
                </li>
                <li className="flex flex-col gap-3 mt-8 pt-6 border-t border-white/5">
                  <span className="opacity-40 flex items-center gap-3 text-[10px] tracking-widest uppercase">
                    <Calendar size={14} /> Date la plus ancienne
                  </span>
                  <span className="bg-base-300/80 p-4 rounded-2xl text-center text-xs tracking-wide">
                    {formatPhotoDate(photo.date)}
                  </span>
                </li>
              </ul>
            </div>

            {hasExif && (
                <div className={styles.modalCard}>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/5 rounded-full blur-3xl"></div>
                <p className={styles.modalLabel + ' text-base-content/40'}>PROPRIÉTÉS EXIF</p>
                <div className="grid grid-cols-1 gap-5 text-sm font-bold">
                  {exif.Make && (
                    <div className="flex justify-between">
                      <span className="opacity-40">Marque</span>
                      <span>{exif.Make}</span>
                    </div>
                  )}
                  {exif.Model && (
                    <div className="flex justify-between">
                      <span className="opacity-40">Modèle</span>
                      <span className="text-primary">{exif.Model}</span>
                    </div>
                  )}
                  <div className="h-px bg-white/5 my-2"></div>
                  {exif.ExposureTime && (
                    <div className="flex justify-between">
                      <span className="opacity-40">Expo</span>
                      <span>1/{Math.round(1 / exif.ExposureTime)}s</span>
                    </div>
                  )}
                  {exif.FNumber && (
                    <div className="flex justify-between">
                      <span className="opacity-40">Ouverture</span>
                      <span>f/{exif.FNumber}</span>
                    </div>
                  )}
                  {exif.ISO && (
                    <div className="flex justify-between">
                      <span className="opacity-40">ISO</span>
                      <span>{exif.ISO}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              className="btn btn-error btn-outline w-full rounded-[24px] gap-3 h-16 font-black tracking-widest text-[10px] hover:bg-error hover:text-white border-2"
              onClick={() => onDelete(photo.name)}
            >
              <Trash2 size={18} /> SUPPRIMER DÉFINITIVEMENT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoDetailModal;