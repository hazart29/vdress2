import React from 'react';

const ModalWardrobe = ({ isOpen, onClose, children }: Readonly<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}>) => {
  if (!isOpen) return null;

  return (
    <div className='absolute inset-0 z-50 flex flex-col select-non items-center justify-end p-2'>
      <div id='modal-wardrobe' className='flex flex-none w-1/2 select-none bg-gray-100 items-center justify-between p-2 mb-6 gap-4 rounded-lg border border-1 shadow-md'>
        <div className='flex flex-1 h-full bg-gray-300 rounded-lg'>
          {children}
        </div>
        <div className='flex flex-col flex-none max-w-fit gap-2 justify-end'>
          <button type='button' onClick={onClose} className='p-2 text-white text-sm text-md font-bold bg-blue-600 rounded-lg hover:bg-blue-500 hover:transform hover:scale-110'>Pakai</button>
          <button type='button' onClick={onClose} className='p-2 text-white text-sm text-md font-bold bg-red-600 rounded-lg hover:bg-red-500 hover:transform hover:scale-110'>Tutup</button>
        </div>
      </div>
    </div>
  );
};

export default ModalWardrobe;
