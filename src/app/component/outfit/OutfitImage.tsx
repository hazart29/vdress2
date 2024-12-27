import React from 'react';
import Image from 'next/image';

interface OutfitComponentProps {
  src: string;
  onClick?: () => void; // Add onClick prop
}

const OutfitImage: React.FC<OutfitComponentProps> = ({ src, onClick }) => { // Receive onClick
  return (
    <div onClick={onClick} className="cursor-pointer"> {/* Make the image clickable */}
      <Image
        src={src}
        alt="Outfit Item" 
        sizes='10vw'
        width={60}
        height={60}
        priority
      />
    </div>
  );
};

export default OutfitImage;