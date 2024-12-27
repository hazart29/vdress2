// components/Modal.tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  title?: string;
  imageSrc?: string; // Prop untuk sumber gambar
  children: React.ReactNode;
}

const ModalAlert: React.FC<ModalProps> = ({ isOpen, onConfirm, title, imageSrc, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center text-center gap-2 bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-xs p-4 relative">
        {imageSrc && <img src={imageSrc} className="mx-auto mb-4" alt="Error Image" />} {/* Tampilkan gambar sebelum judul jika ada */}
        {title && <h2 className="text-2xl font-bold">{title}</h2>}
        <div className="mb-6">
          {children}
        </div>
        <div className="flex justify-center">
          <button
            onClick={onConfirm}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-all duration-300"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAlert;
