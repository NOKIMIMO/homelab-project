import React from 'react';

type ImageViewerMode = 'light' | 'full';

export interface ImageViewerProps {
  src?: string;
  source?: string;
  sourceData?: string | { url?: string | null } | null;
  displayViewerMode?: ImageViewerMode;
  params?: Record<string, unknown>;
  alt?: string;
  loading?: boolean;
  error?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  src, 
  sourceData,
  displayViewerMode = 'light',
  alt = 'Image',
  loading = false,
  error 
}) => {

  const isFullMode = displayViewerMode === 'full';

  

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

  // Use src if provided directly, otherwise try to extract an image URL from sourceData
  const imageUrl = src || (typeof sourceData === 'string' ? sourceData : sourceData?.url);

  if (!imageUrl) {
    return (
      <div className="flex justify-center items-center w-full h-80 bg-base-200 rounded-xl text-base-content/50">
        <p>Image non disponible</p>
      </div>
    );
  }

  if (isFullMode) {
    console.log('Rendering full mode image viewer with URL:', imageUrl);
    return (
      <img
        src={imageUrl}
        alt={alt}
        className="block w-auto h-auto max-w-full max-h-full object-contain rounded-lg"
      />
    );
  }

  return (
    <div className="w-[400px] h-[300px] bg-base-200 flex items-center justify-center rounded-lg">
      <img
        src={imageUrl}
        alt={alt}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};
ImageViewer.displayName = 'ImageViewer';
