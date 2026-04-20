import React from 'react';
import { Info, Plus, X } from 'lucide-react';
import AppButton from '../../ui/AppButton';


interface Props {
  open: boolean;
  boardName: string;
  onBoardNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CreateBoardModal: React.FC<Props> = ({
  open,
  boardName,
  onBoardNameChange,
  onClose,
  onSubmit
}) => {
  if (!open) return null;

  const handleClose = () => {
    onBoardNameChange('');
    onClose();
  };

  // thing that makes you close if click outside of modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <form
        onSubmit={onSubmit}
        className="bg-base-100 p-10 rounded-[48px] max-w-lg w-full shadow-2xl border border-white/10 animate-in zoom-in duration-300 ring-1 ring-white/5"
      >
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl">
              <Plus className="text-primary" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">Nouveau Tableau</h3>
          </div>
          <AppButton type="button" variant="ghost" size="icon" className="rounded-full" onClick={handleClose}>
            <X />
          </AppButton>
        </div>

        <div className="space-y-8">
          <div className="form-control w-full">
            <label className="label uppercase font-black text-[10px] tracking-widest opacity-40 ml-2 mb-2">Nom du projet</label>
            <input
              type="text"
              placeholder="ex: Voyage Islande 2024"
              className="input input-lg bg-base-300/50 border-none rounded-2xl font-bold focus:ring-4 ring-primary/20 transition-all"
              value={boardName}
              onChange={(e) => onBoardNameChange(e.target.value)}
              autoFocus
            />
          </div>
          <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-center gap-4">
            <Info className="text-primary" size={24} />
            <p className="text-xs font-semibold leading-relaxed opacity-70">
              Le tableau sera initialise avec une taille standard de 1920x1080. Vous pourrez adapter les dimensions plus tard.
            </p>
          </div>
          <AppButton className="h-16 rounded-2xl" fullWidth>
            CREER LE TABLEAU
          </AppButton>
        </div>
      </form>
    </div>
  );
};

export default CreateBoardModal;
