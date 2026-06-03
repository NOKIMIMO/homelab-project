import React, { useEffect } from 'react';

interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  content?: React.ReactNode;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  visible, 
  onClose,
  children,
  actions,
  content,
  title 
}) => {
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-base-content/30 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-7xl max-h-full overflow-hidden rounded-2xl border border-base-content/10 bg-base-100/95 shadow-2xl backdrop-blur">
        {title && (
          <div className="flex justify-between items-center p-4 border-b border-base-200">
            <h3 className="font-bold text-lg">{title}</h3>
            <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
          </div>
        )}
        
        <div className="max-h-[calc(100vh-10rem)] overflow-auto p-4">
          {content || children}
        </div>
        
        {actions && (
          <div className="modal-action p-4 border-t border-base-200 m-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
