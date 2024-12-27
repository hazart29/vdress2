import Image from 'next/image';

interface BoxItemProps {
  imageUrl: string;
  altText: string;
}

const BoxItem: React.FC<BoxItemProps> = ({ imageUrl, altText }) => {
  return (
    <div className="lg:w-24 lg:h-24 w-14 h-14 bg-yellow-400 rounded-lg flex items-center justify-center">
      <Image
        src={imageUrl}
        alt={altText}
        width={80} 
        height={80} 
      />
    </div>
  );
};

export default BoxItem;