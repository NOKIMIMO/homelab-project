import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Plus, Layout, Trash2, X, Move, RotateCw, Maximize, Save, 
  Image as ImageIcon, Layers, Zap, AlertCircle, Loader2, MousePointer2
} from 'lucide-react';
import { apiUrl } from '../../../lib/api';

interface Photo {
  name: string;
  url: string;
  date: number;
}

interface BoardAsset {
  asset_name: string;
  src: string;
  scale: number;
  rotation: number;
  x_position: number;
  y_position: number;
}

interface Board {
  id: string;
  name: string;
  height: number;
  width: number;
  assets: BoardAsset[];
}

interface Props {
  boardId: string;
  onClose: () => void;
}
//TODO: trop gros, je commence meme pas a expliquer
// split la zone canvas du reste
const BoardEditor: React.FC<Props> = ({ boardId, onClose }) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [library, setLibrary] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Viewport/Zoom state
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, assetX: 0, assetY: 0 });

  const fetchEverything = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [boardRes, photoRes] = await Promise.all([
        fetch(apiUrl(`/api/boards/${boardId}`)),
        fetch(apiUrl('/api/photos'))
      ]);
      
      if (!boardRes.ok) throw new Error("Failed to load board");
      const boardData = await boardRes.json();
      setBoard(boardData);

      if (photoRes.ok) {
        setLibrary(await photoRes.json());
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Connection error");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => { fetchEverything(); }, [fetchEverything]);

  // Handle Container Resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const zoom = useMemo(() => {
    if (!board || !containerSize.width) return 1;
    const padding = 60;
    const availableW = containerSize.width - padding;
    const availableH = containerSize.height - padding;
    return Math.min(availableW / board.width, availableH / board.height, 1);
  }, [board, containerSize]);

  const handleSave = async () => {
    if (!board) return;
    setIsSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/boards/${boardId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(board)
      });
      if (!res.ok) throw new Error("Save failed");
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const addAsset = (photo: Photo) => {
    if (!board) return;
    const newAsset: BoardAsset = {
      asset_name: photo.name,
      src: photo.url,
      scale: 1,
      rotation: 0,
      x_position: board.width / 2 - 150,
      y_position: board.height / 2 - 150
    };
    setBoard({ ...board, assets: [...(board.assets || []), newAsset] });
    setSelectedIdx((board.assets?.length || 0));
  };

  const updateAsset = (idx: number, patch: Partial<BoardAsset>) => {
    if (!board) return;
    const newAssets = [...board.assets];
    newAssets[idx] = { ...newAssets[idx], ...patch };
    setBoard({ ...board, assets: newAssets });
  };

  const removeAsset = (idx: number) => {
    if (!board) return;
    const newAssets = board.assets.filter((_, i) => i !== idx);
    setBoard({ ...board, assets: newAssets });
    setSelectedIdx(null);
  };

  // Drag Handlers
  const onMouseDown = (e: React.MouseEvent, idx: number) => {
    if (idx === null) return;
    e.stopPropagation();
    setSelectedIdx(idx);
    setIsDragging(true);
    
    const asset = board!.assets[idx];
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      assetX: asset.x_position,
      assetY: asset.y_position
    };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedIdx === null || !board) return;
    
    const dx = (e.clientX - dragStart.current.x) / zoom;
    const dy = (e.clientY - dragStart.current.y) / zoom;
    
    updateAsset(selectedIdx, {
      x_position: dragStart.current.assetX + dx,
      y_position: dragStart.current.assetY + dy
    });
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-base-300 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-black uppercase tracking-widest text-xs opacity-50">Chargement du studio...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="fixed inset-0 z-[100] bg-base-300 flex flex-col items-center justify-center gap-6">
        <div className="bg-error/20 p-6 rounded-full"><AlertCircle className="w-12 h-12 text-error" /></div>
        <div className="text-center">
          <h2 className="text-2xl font-black mb-2">Oups !</h2>
          <p className="opacity-50 font-medium">{error || "Impossible de charger le tableau"}</p>
        </div>
        <button className="btn btn-primary rounded-full px-10" onClick={onClose}>Retour</button>
      </div>
    );
  }

  const selectedAsset = selectedIdx !== null ? board.assets[selectedIdx] : null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-base-200 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-500"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      
      {/* 1. Header */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-base-100/60 backdrop-blur-3xl border-b border-white/5 z-40 flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <button className="btn btn-circle btn-ghost" onClick={onClose}><X size={24}/></button>
          <div className="h-8 w-px bg-white/10"></div>
          <div>
            <h1 className="text-xl font-black tracking-tight">{board.name}</h1>
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{board.width} x {board.height} pixels</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className={`btn btn-primary rounded-full px-8 gap-3 font-black shadow-xl shadow-primary/20 ${isSaving ? 'loading' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {!isSaving && <Save size={18} />} {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* 2. Side Panel */}
      <div className="w-full md:w-80 h-full bg-base-100 border-r border-white/5 flex flex-col z-[45] pt-20">
        <div className="tabs tabs-boxed bg-base-200 m-6 rounded-2xl p-1.5 shadow-inner">
          <button 
            className={`tab flex-1 rounded-xl transition-all font-bold ${!showLibrary ? 'tab-active bg-primary text-white shadow-lg' : 'opacity-50'}`}
            onClick={() => setShowLibrary(false)}
          >
            <Layers size={14} className="mr-2" /> Design
          </button>
          <button 
            className={`tab flex-1 rounded-xl transition-all font-bold ${showLibrary ? 'tab-active bg-primary text-white shadow-lg' : 'opacity-50'}`}
            onClick={() => setShowLibrary(true)}
          >
            <ImageIcon size={14} className="mr-2" /> Photos
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-12">
          {/* doit devenir son propre truc */}
          {!showLibrary ? (
            <div className="space-y-10 py-4">
              {selectedAsset ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-base-300 aspect-video shadow-inner">
                      <img src={selectedAsset.src} alt="" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          className="btn btn-circle btn-error shadow-2xl scale-75 group-hover:scale-100 transition-transform"
                          onClick={() => removeAsset(selectedIdx!)}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2 pr-2">
                             <Move size={12} /> Position
                          </label>
                          <span className="text-[10px] font-mono opacity-50 bg-base-300 px-2 py-1 rounded-md">{Math.round(selectedAsset.x_position)}, {Math.round(selectedAsset.y_position)}</span>
                        </div>
                        <div className="space-y-6 bg-base-200/50 p-4 rounded-2xl border border-white/5">
                          <input type="range" min="0" max={board.width} step="1" value={selectedAsset.x_position} className="range range-xs range-primary" onChange={(e) => updateAsset(selectedIdx!, { x_position: Number(e.target.value) })} />
                          <input type="range" min="0" max={board.height} step="1" value={selectedAsset.y_position} className="range range-xs range-primary" onChange={(e) => updateAsset(selectedIdx!, { y_position: Number(e.target.value) })} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                             <Maximize size={12} /> Échelle
                          </label>
                          <span className="text-[10px] font-mono opacity-50">{selectedAsset.scale.toFixed(2)}x</span>
                        </div>
                        <input type="range" min="0.1" max="5.0" step="0.05" value={selectedAsset.scale} className="range range-xs range-primary" onChange={(e) => updateAsset(selectedIdx!, { scale: Number(e.target.value) })} />
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                             <RotateCw size={12} /> Rotation
                          </label>
                          <span className="text-[10px] font-mono opacity-50">{selectedAsset.rotation}°</span>
                        </div>
                        <input type="range" min="0" max="360" step="1" value={selectedAsset.rotation} className="range range-xs range-primary" onChange={(e) => updateAsset(selectedIdx!, { rotation: Number(e.target.value) })} />
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-base-200/30 rounded-[40px] border-2 border-dashed border-white/5 px-6">
                   <div className="w-16 h-16 bg-base-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl"><MousePointer2 size={32} className="opacity-20 translate-x-1" /></div>
                   <p className="text-center text-xs font-bold leading-relaxed opacity-30 uppercase tracking-widest">
                     Sélectionnez une photo pour l'éditer
                   </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 py-4 animate-in fade-in duration-500">
              {library.length === 0 ? (
                <div className="col-span-2 text-center py-10 opacity-30 text-xs font-bold">Aucune photo dans la galerie</div>
              ) : library.map(photo => (
                 <div 
                   key={photo.name} 
                   className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer hover:ring-4 ring-primary/50 transition-all bg-base-300 shadow-lg"
                   onClick={() => addAsset(photo)}
                 >
                   <img src={photo.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                   <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="bg-white p-2 rounded-full shadow-2xl text-primary"><Plus /></div>
                   </div>
                 </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. The Canvas */}
      {/* Doit devenir son propre truc */}
      <div 
        ref={containerRef}
        className="flex-1 h-full bg-base-300 relative flex items-center justify-center p-20 pt-24 cursor-default overflow-hidden"
        onClick={() => setSelectedIdx(null)}
      >
        <div 
          className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] relative transition-transform duration-300 ease-out preserve-3d"
          style={{ 
            width: `${board.width}px`, 
            height: `${board.height}px`,
            transform: `scale(${zoom})`,
            backgroundImage: 'radial-gradient(#e5e7eb 2px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        >
          {board.assets?.map((asset, i) => (
             <div 
               key={`${asset.asset_name}-${i}`}
               className={`absolute cursor-move select-none transition-shadow ${selectedIdx === i ? 'ring-8 ring-primary z-30 shadow-2xl scale-[1.02]' : 'hover:ring-4 ring-primary/30 z-10'}`}
               onMouseDown={(e) => onMouseDown(e, i)}
               style={{
                 left: `${asset.x_position}px`,
                 top: `${asset.y_position}px`,
                 transform: `rotate(${asset.rotation}deg) scale(${asset.scale})`,
                 transformOrigin: 'center center',
                 width: 'fit-content'
               }}
             >
                <img 
                  src={asset.src} 
                  draggable={false}
                  className="max-w-[400px] h-auto shadow-2xl block"
                  alt="" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/400x400?text=Image+Introuvable';
                  }}
                />
             </div>
          ))}
        </div>

        {/* Visual Cues */}
        <div className="absolute bottom-10 right-10 bg-base-100/40 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 flex items-center gap-6 shadow-2xl z-50">
           <div className="flex items-center gap-3">
             <Layout size={14} className="text-primary" />
             <span className="text-[10px] font-black tracking-[0.2em] opacity-60">ZOOM: {(zoom * 100).toFixed(0)}%</span>
           </div>
           <div className="h-4 w-px bg-white/10"></div>
           <div className="flex items-center gap-3">
             <Zap size={14} className="text-primary" />
             <span className="text-[10px] font-black tracking-[0.2em] opacity-60">ASSETS: {board.assets?.length || 0}</span>
           </div>
        </div>
      </div>

    </div>
  );
};

export default BoardEditor;

