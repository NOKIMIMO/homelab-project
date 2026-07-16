import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadZoneProps {
  id?: string;
  accept?: string;
  multiple?: boolean;
  onFilesSelected?: (formData: FormData, files: File[]) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ 
  id,
  accept = '*', 
  multiple = true,
  onFilesSelected 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const handleOpenRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{ targetId?: string }>;
      if (!id || customEvent.detail?.targetId !== id) {
        return;
      }

      // console.log('[FileUploadZone] open request received', { id, accept, multiple });
      inputRef.current?.click();
    };

    window.addEventListener('module:file-upload-open', handleOpenRequest as EventListener);

    return () => {
      window.removeEventListener('module:file-upload-open', handleOpenRequest as EventListener);
    };
  }, [accept, id, multiple]);

  const buildUploadPayload = (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('file', file));
    // console.log('[FileUploadZone] FormData payload', Array.from(formData.entries()).map(([key, value]) => [
    //   key,
    //   value instanceof File
    //     ? {
    //         name: value.name,
    //         size: value.size,
    //         type: value.type,
    //       }
    //     : value,
    // ]));
    return formData;
  };

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
    // logFiles('drop', files);
    const formData = buildUploadPayload(files);
    onFilesSelected?.(formData, files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // logFiles('input', files);
    const formData = buildUploadPayload(files);
    onFilesSelected?.(formData, files);
    e.target.value = '';
  };

  const handleClick = () => {
    // console.log('[FileUploadZone] opening native picker', { id, accept, multiple });
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
        <p className="text-lg font-medium">Drag and drop your files here</p>
        <p className="text-sm opacity-60 mt-2">or click to select from your computer</p>
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

