// components/MobileLandingPage.tsx
import Image from 'next/image';

const MobileLandingPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen p-4 bg-gradient-to-r from-slate-800 via-slate-900 to-black text-white">
            {/* Logo atau Icon */}
            <div className="rounded-full overflow-hidden shadow-lg mb-8 p-2"> {/* Tambahkan shadow dan margin bottom */}
                <Image src="/ui/iconVD-192x192.png" alt="Game Icon" width={72} height={72} />
            </div>

            <h1 className="text-3xl text-center font-bold mb-4 animate-pulse">Game Unavailable on Mobile</h1> {/* Animasi pulse */}

            <p className="text-lg text-center px-4 mb-6">
                This game is currently only available on PC. We are working hard to bring it to mobile devices soon!
            </p>

            {/* Tombol atau Link (opsional) */}
            {/* <a href="your-website-link" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Learn More
            </a> */}

            {/* Footer atau Informasi Tambahan */}
            <div className="mt-8 text-center text-gray-400">
                &copy; {new Date().getFullYear()} Hazart Studio
            </div>
        </div>
    );
};

export default MobileLandingPage;