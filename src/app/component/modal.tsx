// Modal.tsx
import React from 'react';

const Modal = ({ isOpen, onClose, children }: Readonly<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}>) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-1 items-center justify-center backdrop-blur-sm">
      <div className="fixed inset-0 bg-black opacity-75" onClick={onClose}></div> {/* Tambahkan onClick di sini */}
      <div className="fixed w-full h-full flex flex-col flex-1 z-[110] items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default Modal;