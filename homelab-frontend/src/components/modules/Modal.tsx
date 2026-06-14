import React from 'react';

interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  content?: React.ReactNode;
  title?: string;
  isImageContent?: boolean; 
}
export const Modal: React.FC<ModalProps> = ({
  visible, onClose, children, content, isImageContent,
}) => {
  if (!visible) return null;
  const resolvedContent = content ?? children;

  console.log('Rendering Modal with content:', resolvedContent, 'isImageContent:', isImageContent);

  if (isImageContent) {
    return (
      <div
        className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()}>
          {resolvedContent}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 overflow-auto p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 mx-auto w-fit max-w-[95vw]">
        {resolvedContent}
      </div>
    </div>
  );
};