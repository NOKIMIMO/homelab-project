import React, { useEffect } from 'react';

interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  visible, 
  onClose,
  children,
  actions,
  title 
}) => {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        )}
        
        <div className="modal-content">
          {children}
        </div>
        
        {actions && (
          <div className="modal-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
