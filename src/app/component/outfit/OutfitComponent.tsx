import React from 'react';
import Image from 'next/image';

interface OutfitComponentProps {
  loc: string;
  src: string;
  openModal: (loc: string) => void;
}

const OutfitComponent: React.FC<OutfitComponentProps> = ({ loc, src, openModal }) => {
  return (
    <div 
      onClick={() => openModal(loc)} 
      className='flex bg-white w-20 h-20 items-center justify-center rounded-md shadow-md border-2 border-gray-400 transition-all duration-100 ease-in-out hover:scale-110'
    >
      <Image 
        src={src} 
        alt="none" 
        sizes='33vw' 
        width={60} 
        height={60} 
        priority 
      />
    </div>
  );
};

export default OutfitComponent;
