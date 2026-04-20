import React from 'react';
import { Trash2 } from 'lucide-react';
import AppButton from '../ui/AppButton';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<Props> = ({
  open,
  title = 'Supprimer ?',
  message,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="bg-base-100 p-10 rounded-[56px] max-w-md w-full shadow-2xl border border-white/10 animate-in zoom-in duration-400">
        <div className="bg-error/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-error/5">
          <Trash2 size={40} className="text-error" />
        </div>
        <h3 className="text-3xl font-black mb-4 text-center tracking-tight">{title}</h3>
        <p className="text-base-content/60 font-bold text-center mb-10 leading-relaxed px-4">{message}</p>
        <div className="flex flex-col gap-4">
          <AppButton variant="danger" size="lg" fullWidth className="h-16 rounded-2xl" onClick={onConfirm}>
            SUPPRIMER MAINTENANT
          </AppButton>
          <AppButton variant="ghost" size="lg" fullWidth className="rounded-2xl font-black opacity-40 hover:opacity-100 tracking-widest text-[10px]" onClick={onCancel}>
            ANNULER
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
