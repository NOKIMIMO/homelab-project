import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, X, Move, RotateCw, Maximize, Save, 
  Image as ImageIcon, Layers, AlertCircle, Loader2, MousePointer2
} from 'lucide-react';
import { useNavigate } from 'react-router';
import LibraryAssetSelector from './editor/libraryAssectSelector';
import { Photo } from '@spe_types/photo';
import { Board, BoardAsset } from '@spe_types/board';
import BoardCanva from './boardCanva';

interface Props {
  onClose: () => void;
}
//TODO: trop gros, je commence meme pas a expliquer
// split la zone canvas du reste
const BoardEditor: React.FC<Props> = ({ onClose }) => {
  // path /boards/:id -> fetch board data
  const [boardId] = useState(String(window.location.pathname.split("/").slice(-1)[0]));
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  
  const fetchBoards = useCallback(async () => {
    try {
        const res = await fetch(`/api/boards/${boardId}`);
        if (res.ok) {
            const data = await res.json();
            setBoard(data);
        }
    } catch (err) {
        console.error("Failed to fetch board", err);
    } finally {
        setLoading(false);
    }
  }, [boardId]);


  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const handleSave = async () => {
    if (!board) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-100 bg-base-300 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-black uppercase tracking-widest text-xs opacity-50">Chargement du studio...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="fixed inset-0 z-100 bg-base-300 flex flex-col items-center justify-center gap-6">
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
    >
      test
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
          {/* toast later */}
          <button 
            className={`btn btn-primary rounded-full px-8 gap-3 font-black shadow-xl shadow-primary/20 ${isSaving ? 'loading' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {!isSaving && <Save size={18} />}  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {/* bouton retour */}
          <button className='btn btn-warning rounded-full px-8 gap-3 font-black shadow-xl shadow-warning/20'
          onClick={() => navigate("/boards")}>
              <X size={18} /> Quitter
          </button>
        </div>
      </div>

      {/* 2. Side Panel */}
      <div className="w-full md:w-80 h-full bg-base-100 border-r border-white/5 flex flex-col z-45 pt-20">
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
            // img editor
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
            // img modifier
            <LibraryAssetSelector addAsset={addAsset} />
          )}
        </div>
      </div>

      {/* 3. The Canvas */}
        <BoardCanva
          board={board}
          selectedIdx={selectedIdx}
          setSelectedIdx={setSelectedIdx}
          updateAsset={updateAsset}
          removeAsset={removeAsset}
        />

    </div>
  );
};

export default BoardEditor;

