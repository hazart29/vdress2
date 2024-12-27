import React, { useState, useEffect } from 'react';
import Image from 'next/image'
import ReactDOM from 'react-dom/client';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('beforeinstallprompt',
                (event) => {
                    event.preventDefault();
                    setDeferredPrompt(event);
                });
        }
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: { outcome: string; }) => {
                if (choiceResult.outcome
                    === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                    window.location.reload();
                } else {
                    console.log('User dismissed the A2HS prompt');

                }
                setDeferredPrompt(null);
            });
        }
    };


    if (isInstalled) {
        return null;
    }

    return (
        <div className="install-prompt select-none bg-white flex flex-1 h-full justify-center items-center portrait:flex portrait:flex-col">
            <Image src={'ui/imgavaatar.svg'} width={250} height={0} alt='avatar' className='pointer-events-none max-h-screen p-10' />
            <span className='flex flex-col gap-4 portrait:justify-center portrait:items-center flex-none w-1/3 portrait:w-full'>
                <span className='flex flex-1 flex-col gap-0'>
                    <p className='text-blue-500 text-5xl md:text-7xl font-bold'>V-Dress</p>
                    <p className='text-gray-500 text-2xl font-bold'>Virtual Dressing</p>
                </span>
                <button onClick={handleInstallClick} className='flex bg-blue-500 hover:bg-blue-400 text-white animate-pulse hover:animate-none font-bold max-w-fit transition-all duration-150 ease-in-out hover:scale-110 rounded-sm py-2 px-4'>
                    <span className='flex gap-2 items-center justify-center'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-cloud-download" viewBox="0 0 16 16">
                            <path d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383" />
                            <path d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V5.5a.5.5 0 0 0-1 0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708z" />
                        </svg>
                        <p>Install</p>
                    </span>
                </button>
            </span>
        </div>
    );
};

export default PWAInstallPrompt;
