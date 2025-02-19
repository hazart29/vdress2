// components/OptimizedBackgroundImage.js (Create this new component)
import Image from 'next/image';

interface OptimizedBackgroundImageProps {
  src: string;
  alt: string;
  priority?: boolean; // Add priority prop
  placeholder?: 'blur' | 'empty'; // Add for placeholder (blur is best)
  blurDataURL?: string; // Add for blur placeholder
}

const OptimizedBackgroundImage: React.FC<OptimizedBackgroundImageProps> = ({
  src,
  alt,
  priority = false, // Default to false
  placeholder = 'blur',
  blurDataURL
}) => {
  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt={alt}
        layout="fill"
        objectFit="cover"
        objectPosition="center"
        priority={priority} // Use the priority prop
        placeholder={placeholder}
        blurDataURL={blurDataURL}
      />
    </div>
  );
};

export default OptimizedBackgroundImage;