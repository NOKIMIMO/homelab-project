import React, { useState, useEffect } from 'react';
import { Plus, Layout, Trash2, Calendar, Edit3, Image as ImageIcon } from 'lucide-react';

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
  last_update: string;
  previewsrc?: string;
  assets: BoardAsset[];
}

interface Props {
  onSelectBoard: (id: string) => void;
  onCreateBoard: () => void;
}

const BoardList: React.FC<Props> = ({ onSelectBoard, onCreateBoard }) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
      }
    } catch (err) {
      console.error("Failed to fetch boards", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoards(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer ce tableau ?")) return;
    try {
      const res = await fetch(`/api/boards/${id}`, { method: 'DELETE' });
      if (res.ok) fetchBoards();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black tracking-tight text-base-content/90">Mes Tableaux</h2>
        <button 
          className="btn btn-primary rounded-full px-8 shadow-lg shadow-primary/20 gap-2"
          onClick={onCreateBoard}
        >
          <Plus size={20} /> Nouveau Tableau
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-base-100/30 rounded-[48px] border-2 border-dashed border-white/5">
          <Layout size={64} className="opacity-10 mb-6" />
          <h3 className="text-xl font-bold opacity-40">Aucun tableau créé</h3>
          <p className="opacity-30 mt-2">Commencez par en créer un nouveau pour organiser vos photos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {boards.map(board => (
            <div 
              key={board.id} 
              className="group relative bg-base-100 p-6 rounded-[32px] border border-white/5 shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => onSelectBoard(board.id)}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <Layout className="text-primary w-6 h-6" />
                </div>
                <button 
                  className="btn btn-circle btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(e, board.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <h3 className="text-xl font-black mb-2 truncate">{board.name}</h3>
              
              <div className="flex flex-wrap gap-4 text-xs font-medium opacity-50 mb-6">
                <span className="flex items-center gap-1.5"><ImageIcon size={14}/> {board.assets?.length || 0} Assets</span>
                <span className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(board.last_update).toLocaleDateString('fr-FR')}</span>
              </div>

              <div className="h-40 bg-base-300/50 rounded-2xl border border-white/5 overflow-hidden relative">
                {board.previewsrc ? (
                   <img src={board.previewsrc} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Preview" />
                ) : board.assets && board.assets.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 p-1 h-full opacity-60 group-hover:opacity-100 transition-opacity">
                    {board.assets.slice(0, 9).map((a, i) => (
                      <div key={i} className="bg-base-200 rounded-md overflow-hidden">
                        <img src={a.src} className="w-full h-full object-cover" alt="" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10">
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-base-100/80 to-transparent flex items-end p-4">
                   <span className="text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-2">
                     ÉDITER <Edit3 size={10} />
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardList;
