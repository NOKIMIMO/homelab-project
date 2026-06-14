import React, { useEffect, useState, useRef } from 'react';
import { useModuleRendererContext } from './useModuleRendererContext';
import { ImageViewer } from './ImageViewer';

interface Photo {
  file?: string;
  file_name?: string;
}

interface GroupContentRow {
  id?: string | number;
  photos?: Photo | Photo[];
  url?: string;
  photo_url?: string;
  fileUrl?: string;
}

interface ReaderCarouselProps {
  sourceData?: unknown;
  items?: GroupContentRow[];
  params?: Record<string, unknown>;
  props?: {
    itemImageField?: string;
    fullscreenStateKey?: string;
  };
  loading?: boolean;
  error?: string;
}

const extractItems = (value: unknown): GroupContentRow[] => {
  if (Array.isArray(value)) return value as GroupContentRow[];

  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (Array.isArray(v['LIST'])) return v['LIST'] as GroupContentRow[];

    const read = v['READ'];
    if (read && typeof read === 'object') {
      const r = read as Record<string, unknown>;
      if (Array.isArray(r['rows'])) return r['rows'] as GroupContentRow[];
    }
  }

  return [];
};

export const ReaderCarousel: React.FC<ReaderCarouselProps> = ({
  sourceData,
  items: itemsProp,
  props = {},
  loading = false,
  error,
}) => {
  const { baseContext, setStateValue } = useModuleRendererContext();
  const items = itemsProp ?? extractItems(sourceData);
  const fullscreenKey = props.fullscreenStateKey ?? 'fullscreenPhotoId';

  const currentId = baseContext[fullscreenKey] as string | number | null | undefined;

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const prevBlobRef = useRef<string | null>(null);

  const findItemById = (id?: string | number | null) => {
    if (id === undefined || id === null) return null;
    return (
      items.find((it) => {
        const val = it.id;
        if (val === undefined) return false;
        return String(val) === String(id);
      }) ?? null
    );
  };

  const resolveImageFromItem = (item?: GroupContentRow | null): string | null => {
    if (!item) return null;

    if (props.itemImageField) {
      const val = (item as Record<string, unknown>)[props.itemImageField];
      if (typeof val === 'string' && val.length > 0) return val;
    }

    const photos = item.photos;
    if (Array.isArray(photos) && photos.length > 0) {
      const p = photos[0];
      if (p) {
        if (typeof p.file === 'string' && p.file.length) return p.file;
        if (typeof p.file_name === 'string' && p.file_name.length) return p.file_name;
      }
    } else if (photos && typeof photos === 'object') {
      const p = photos as Photo;
      if (typeof p.file === 'string' && p.file.length) return p.file;
      if (typeof p.file_name === 'string' && p.file_name.length) return p.file_name;
    }

    if (typeof item.url === 'string' && item.url.length) return item.url;
    if (typeof item.photo_url === 'string' && item.photo_url.length) return item.photo_url;
    if (typeof item.fileUrl === 'string' && item.fileUrl.length) return item.fileUrl;

    return null;
  };

  useEffect(() => {
    let mounted = true;

    const loadForId = async (id?: string | number | null) => {
      if (id === undefined || id === null) {
        setImageSrc(null);
        return;
      }

      const item = findItemById(id);
      const url = resolveImageFromItem(item);

      if (typeof url === 'string' && url.length > 0) {
        if (prevBlobRef.current && prevBlobRef.current !== url && prevBlobRef.current.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(prevBlobRef.current);
          } catch {
            /* ignore */
          }
          prevBlobRef.current = null;
        }
        if (mounted) setImageSrc(url);
        return;
      }

      if (mounted) setImageSrc(null);
    };

    void loadForId(currentId);

    return () => {
      mounted = false;
    };
  }, [currentId, items, props.itemImageField]);

  useEffect(() => {
    return () => {
      if (prevBlobRef.current && prevBlobRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prevBlobRef.current);
        } catch {
          /* ignore */
        }
        prevBlobRef.current = null;
      }
    };
  }, []);

  const currentIndex = (() => {
    if (currentId === undefined || currentId === null) return 0;
    const idx = items.findIndex((it) => {
      const val = it.id;
      return val !== undefined && String(val) === String(currentId);
    });
    return idx >= 0 ? idx : 0;
  })();

  const goToIndex = (idx: number) => {
    if (!items || items.length === 0) return;
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    const next = items[clamped];
    const nextId = next.id ?? null;
    setStateValue(fullscreenKey, nextId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full h-80 bg-base-200 rounded-xl">
        <span className="loading loading-spinner text-primary"></span>
        <p className="ml-2">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center w-full h-80 bg-error/10 text-error rounded-xl">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="w-full flex items-center justify-between gap-4">
        <button className="btn btn-ghost" onClick={() => goToIndex(currentIndex - 1)} disabled={currentIndex <= 0}>
          ‹
        </button>
        <div className="flex-1">
          <ImageViewer src={imageSrc ?? undefined} loading={!imageSrc} alt={`Image ${currentIndex + 1}`} />
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => goToIndex(currentIndex + 1)}
          disabled={items ? currentIndex >= items.length - 1 : true}
        >
          ›
        </button>
      </div>
      <div className="text-sm opacity-60">{items && items.length > 0 ? `${currentIndex + 1} / ${items.length}` : 'Aucune image'}</div>
    </div>
  );
};

export default ReaderCarousel;
