import React, { useEffect, useRef } from 'react';

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
      dialogRef.current?.showModal();
    } else {
      document.body.style.overflow = 'auto';
      dialogRef.current?.close();
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [visible]);

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className="modal-box p-0 max-w-4xl bg-base-100/95 backdrop-blur">
        {title && (
          <div className="flex justify-between items-center p-4 border-b border-base-200">
            <h3 className="font-bold text-lg">{title}</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
          </div>
        )}
        
        <div className="p-4">
          {content || children}
        </div>
        
        {actions && (
          <div className="modal-action p-4 border-t border-base-200 m-0">
            {actions}
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>Fermer</button>
      </form>
    </dialog>
  );
};
