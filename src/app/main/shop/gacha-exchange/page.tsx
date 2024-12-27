// app/shop/page.tsx
"use client";
import Loading from '@/app/component/Loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/main/shop/gacha-exchange/token-exchange');
  }, [router]);

  return (
    <Loading/>
  );
};

export default Page;