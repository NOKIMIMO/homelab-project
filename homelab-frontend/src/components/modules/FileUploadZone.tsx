import React, { useRef } from 'react';

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  onFilesSelected?: (files: File[]) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ 
  accept = '*', 
  multiple = true,
  onFilesSelected 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected?.(files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesSelected?.(files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <div 
        className="file-upload-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <p>Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
      </div>
      <input 
        ref={inputRef}
        type="file" 
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </>
  );
};
