// app/login/page.tsx
'use client'

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ModalAlert from '@/app/component/ModalAlert';
import Image from 'next/image';

interface FormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      //  Ambil token JWT dari sessionStorage atau cookie
      const token = sessionStorage.getItem('token'); 
      if (token) {
        // Jika ada token, redirect ke halaman /main
        router.push('/main'); 
      }
    };
    checkAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/auth', { // Sesuaikan dengan endpoint API Anda
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Login berhasil
        sessionStorage.setItem('token', data.token); // Simpan token di sessionStorage
        sessionStorage.setItem('uid', data.user.uid); // Simpan token di sessionStorage
        router.push('/main');
      } else {
        // Tangani error dari API
        setError(data.message || 'Login failed'); 
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      setError("An unexpected error occurred.");
    }
  };

  return (
    <div className='relative flex flex-none w-1/3 flex-col items-center justify-center gap-2'>
      <Image src="/ui/logo2.svg" alt="logo" className='pointer-events-none select-none' width={200} height={70} priority />

      {/* Modal Alert */}
      {error && ( 
        <ModalAlert
          isOpen={!!error} 
          onConfirm={() => setError(null)} 
          title="Error"
          imageSrc="/ui/galat_img.svg"
        >
          <p>{error}</p>
        </ModalAlert>
      )}

      <form onSubmit={handleSubmit} className='flex flex-col flex-none w-1/2 items-center justify-center gap-4'>
        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          name="email"
          className='flex flex-1 w-full rounded-md p-2 text-black text-sm lg:text-md'
          value={formData.email}
          onChange={handleChange}
          required
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          name="password"
          className='flex flex-1 w-full rounded-md p-2 text-black text-sm lg:text-md'
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* Buttons */}
        <div className='flex flex-1 gap-2 w-full justify-center items-center'>
          <Link href="/daftar">
            <p className="flex-1 bg-transparent border-2 border-white text-white font-bold p-2 rounded-lg hover:bg-white hover:text-green-500 transition-all duration-300">
              DAFTAR
            </p>
          </Link>
          <button
            type="submit"
            className="flex-1 bg-transparent border-2 border-white text-white font-bold p-2 rounded-lg hover:bg-white hover:text-blue-500 transition-all duration-300">
            MASUK
          </button>
        </div>
      </form>

      {/* Footer */}
      <p className='text-xs text-white font-sans pt-4'>Hazart Studio @2024</p>
    </div>
  );
};

export default Login;