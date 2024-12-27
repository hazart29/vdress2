'use client';
import React from "react";
import Image from "next/image";

interface GachaButtonProps {
  onClick: (type: number) => void;
  activeTab: string; // Tambahkan props activeTab
}

const GachaButton: React.FC<GachaButtonProps> = ({ onClick, activeTab }) => { // Terima props activeTab
  const currencyImage = activeTab === "limited"
    ? "/icons/currency/glimmering_essence.png"
    : "/icons/currency/shimmering_essence.png";

  return (
    <div className="flex flex-1 gap-4 justify-end items-center lg:text-4xl text-base">
      {[1, 10].map((type) => (
        <button
          key={type}
          className="bg-white text-gray-800 font-bold py-2 px-4 rounded-md shadow-md 
                     hover:bg-gray-100 hover:scale-105 hover:-translate-y-1 hover:shadow-lg 
                     transition-all duration-200 ease-in-out flex items-center"
          onClick={() => onClick(type)}
        >
          <span className="mr-2">{type}x Draw</span>
          <span className="flex gap-0 items-center">
            <Image
              src={currencyImage}
              alt={currencyImage}
              width={32}
              height={32}
              className="transition-transform duration-200 hover:rotate-12"
            />
            <span className="text-sm">x{type}</span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default GachaButton;