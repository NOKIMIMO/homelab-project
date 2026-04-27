import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import styles from '../../lib/style';

const cx = (...values: (string | false | null | undefined)[]) => values.filter(Boolean).join(' ');

interface ViewToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const ViewToggleButton = ({ active, onClick, children }: ViewToggleButtonProps) => (
  <button onClick={onClick} className={cx(styles.viewToggle, active ? 'text-primary' : styles.viewTogglePassive)}>
    {children}
  </button>
);

interface SortButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export const SortButton = ({ active, label, onClick }: SortButtonProps) => (
  <button className={cx(styles.sortButton, active ? styles.sortButtonActive : styles.sortButtonPassive)} onClick={onClick}>
    {label}
  </button>
);

export const EmptyGalleryState = () => (
  <div className="flex flex-col items-center justify-center min-h-125 bg-base-100/20 rounded-[64px] border-4 border-dashed border-white/5 scale-100 transition-transform">
    <div className="bg-base-100 p-12 rounded-full shadow-2xl mb-8 ring-8 ring-white/5">
      <ImageIcon size={72} className="opacity-10 text-primary animate-pulse" />
    </div>
    <h2 className="text-3xl font-black opacity-30 tracking-tight">Galerie Vide</h2>
    <p className="opacity-20 mt-2 font-black uppercase tracking-widest text-xs">Importez vos premiers souvenirs</p>
  </div>
);

export default {
  ViewToggleButton,
  SortButton,
  EmptyGalleryState
};
