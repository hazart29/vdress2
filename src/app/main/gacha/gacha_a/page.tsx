'use client'
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const Gacha_A = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/main/gacha/gacha_a') {
      router.push('/main/gacha/gacha_a/limited'); 
    }
  }, [pathname, router]);

  return null; // This component doesn't render anything directly
}

export default Gacha_A;