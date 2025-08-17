import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className = "" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className={`relative bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto ${className}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
