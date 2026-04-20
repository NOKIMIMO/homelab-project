import React from 'react';
import { Calendar, Edit3, Image as ImageIcon, Layout, Trash2 } from 'lucide-react';

interface BoardAsset {
  src: string;
}

interface Board {
  id: string;
  name: string;
  last_update: string;
  previewsrc?: string;
  assets: BoardAsset[];
}

interface Props {
  board: Board;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

const BoardCard: React.FC<Props> = ({ board, onSelect, onDelete }) => {
  return (
    <div
      className="group relative bg-base-100 p-6 rounded-[32px] border border-white/5 shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => onSelect(board.id)}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <Layout className="text-primary w-6 h-6" />
        </div>
        <button
          className="btn btn-circle btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => onDelete(e, board.id)}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <h3 className="text-xl font-black mb-2 truncate">{board.name}</h3>

      <div className="flex flex-wrap gap-4 text-xs font-medium opacity-50 mb-6">
        <span className="flex items-center gap-1.5">
          <ImageIcon size={14} /> {board.assets?.length || 0} Assets
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={14} /> {new Date(board.last_update).toLocaleDateString('fr-FR')}
        </span>
      </div>

      <div className="h-40 bg-base-300/50 rounded-2xl border border-white/5 overflow-hidden relative">
        {board.previewsrc ? (
          <img src={board.previewsrc} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Preview" />
        ) : board.assets && board.assets.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 p-1 h-full opacity-60 group-hover:opacity-100 transition-opacity">
            {board.assets.slice(0, 9).map((asset, index) => (
              <div key={index} className="bg-base-200 rounded-md overflow-hidden">
                <img src={asset.src} className="w-full h-full object-cover" alt="" />
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
            EDITER <Edit3 size={10} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default BoardCard;
