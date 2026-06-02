import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

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
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
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
    <div className="mb-8">
      <div 
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-primary bg-primary/10 scale-[1.02]' 
            : 'border-base-content/20 hover:border-primary/50 hover:bg-base-200/50'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <UploadCloud size={48} className={`mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-base-content/40'}`} />
        <p className="text-lg font-medium">Glissez-déposez vos fichiers ici</p>
        <p className="text-sm opacity-60 mt-2">ou cliquez pour sélectionner depuis votre ordinateur</p>
      </div>
      <input 
        ref={inputRef}
        type="file" 
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};
