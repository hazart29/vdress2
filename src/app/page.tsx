'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import LoginForm from './component/login-form';
import PWAInstallPrompt from './component/PWAInstallPompt';
import { useRouter } from 'next/navigation';

function Home() {
  const icon = '/ui/iconVD.svg';
  const [isLoading, setLoading] = useState(true);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const router = useRouter(); // Add the useRouter hook

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '.'
      }).then(function (registration) {
        console.log('Laravel PWA: ServiceWorker registration successful with scope: ', registration.scope);
      }, function (err) {
        console.log('Laravel PWA: ServiceWorker registration failed: ', err);
      });
    }

    if ((window.matchMedia('(display-mode: fullscreen)').matches) || (window.matchMedia('(display-mode: standalone)').matches)) {
      setIsInstalled(true);
    }

    // Redirect to /login after loading and checking installation
    const redirectToLogin = () => {
      if (!isLoading) {
        router.push('/login');
      }
    };
    redirectToLogin();

    setLoading(false); // Set loading to false after checks
  }, [router, isLoading]); // Add isLoading to the dependency array

  if (isLoading) {
    return (
      <div className='absolute flex w-full h-full z-[999] top-0 left-0 justify-center items-center'>
        <Image src={icon} alt="none" width={40} height={40} className='animate-ping' />
      </div>
    );
  }

  // The PWAInstallPrompt component will not be rendered since the user is 
  // immediately redirected to /login
  // if (!isInstalled) { 
  //   return <PWAInstallPrompt />; 
  // }

}

export default Home;