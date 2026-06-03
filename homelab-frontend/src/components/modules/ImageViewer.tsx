import React from 'react';

interface ImageViewerProps {
  src?: string;
  source?: string;
  sourceData?: string | { url?: string | null } | null;
  params?: Record<string, unknown>;
  alt?: string;
  loading?: boolean;
  error?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  src, 
  sourceData,
  alt = 'Image',
  loading = false,
  error 
}) => {
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

  return (
    <div className="flex justify-center items-center w-full">
      <img 
        src={imageUrl} 
        alt={alt} 
        className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
      />
    </div>
  );
};
