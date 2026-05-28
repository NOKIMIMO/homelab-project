import React from 'react';

interface ImageViewerProps {
  src?: string;
  alt?: string;
  loading?: boolean;
  error?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  src, 
  alt = 'Image',
  loading = false,
  error 
}) => {
  if (loading) {
    return (
      <div className="image-viewer loading">
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="image-viewer error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="image-viewer">
      <img src={src} alt={alt} />
    </div>
  );
};
