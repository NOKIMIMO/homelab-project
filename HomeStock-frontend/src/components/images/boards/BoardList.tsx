import React, { useState, useEffect } from 'react';
import { Plus, Layout } from 'lucide-react';
import { apiUrl } from '../../../lib/api';
import AppButton from '../../ui/AppButton';
import BoardCard from './BoardCard';


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
      const res = await fetch(apiUrl('/api/boards'));
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
      const res = await fetch(apiUrl(`/api/boards/${id}`), { method: 'DELETE' });
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
        <AppButton className="rounded-2xl px-8 gap-2" onClick={onCreateBoard}>
          <Plus size={20} /> Nouveau Tableau
        </AppButton>
      </div>

      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-base-100/30 rounded-[48px] border-2 border-dashed border-white/5">
          <Layout size={64} className="opacity-10 mb-6" />
          <h3 className="text-xl font-bold opacity-40">Aucun tableau créé</h3>
          <p className="opacity-30 mt-2">Commencez par en créer un nouveau pour organiser vos photos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onSelect={onSelectBoard}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardList;
