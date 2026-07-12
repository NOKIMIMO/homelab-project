import { useEffect, useRef, useState } from 'react';

interface Props {
  existingIconUrl: string | null;
  onFileSelected: (file: File | null) => void;
}

export default function IconUploader({ existingIconUrl, onFileSelected }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingIconUrl);
  const stagedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (stagedUrlRef.current) URL.revokeObjectURL(stagedUrlRef.current);
    };
  }, []);

  const handleFileChange = (file: File | null) => {
    if (stagedUrlRef.current) URL.revokeObjectURL(stagedUrlRef.current);
    const nextUrl = file ? URL.createObjectURL(file) : null;
    stagedUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl ?? existingIconUrl);
    onFileSelected(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center overflow-hidden shrink-0">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] opacity-40 text-center px-1">Icône</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">Icône du module</label>
        <input
          type="file"
          accept="image/*"
          className="file-input file-input-bordered file-input-xs"
          onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}
