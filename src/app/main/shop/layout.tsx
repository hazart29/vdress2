"use client";
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image' // Assuming you'll use this later
import CurrencyResource from '@/app/component/gacha/CurrencyResource';
import BackButton from '@/app/component/BackButton';
import { RefreshProvider } from '@/app/component/RefreshContext';

const ShopLayout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(pathname === '/main/shop/top-up' ? 2 : 1);

    useEffect(() => {
        if (pathname === '/main/shop') {
            router.push('/main/shop/gacha-exchange');
        }
    }, [pathname, router]);

    const tabClasses = "relative w-full px-6 py-8 font-semibold transition-colors duration-200 rounded-md";
    const activeTabClasses = "bg-gradient-to-r from-[#c77dff] to-[#80ffea] shadow-md text-slate-800";
    const nonActiveTabClasses = "text-gray-300 hover:text-[#80ffea]";

    return (
        <RefreshProvider>
            <div className="relative flex flex-1 flex-col min-h-screen">
                {/* Background Styles */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] opacity-50 z-[-1]" />
                <div className="absolute inset-0 bg-shop bg-cover bg-center opacity-80 z-[-1]" />
                <div className='absolute z-[99] top-0 right-0 flex flex-none gap-4 items-center justify-center h-20 p-8 pt-12 text-white'>
                    <CurrencyResource activeTab={'SHOP'} />
                    <BackButton href={'/main'} />
                </div>
                <div className="flex flex-1 items-center justify-center w-full h-full">
                    {/* Sidebar Navigation */}
                    <div className="relative z-10 flex flex-col w-1/4 min-h-screen px-4 bg-zinc-900/80 backdrop-blur-lg shadow-md">
                        <div className='flex gap-2 px-6 py-8 text-[#80ffea] text-center w-full justify-center items-center font-bold'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-cart-fill" viewBox="0 0 16 16">
                                <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
                            </svg>
                            <span className="ml-2 text-5xl">Shop</span>
                        </div>

                        <ul className="flex flex-col text-2xl">
                            <li>
                                <Link href="/main/shop/gacha-exchange">
                                    <button
                                        onClick={() => setActiveTab(1)}
                                        className={tabClasses + (activeTab === 1 ? ` ${activeTabClasses}` : ` ${nonActiveTabClasses}`)}
                                    >
                                        Gacha Exchange
                                    </button>
                                </Link>
                            </li>
                            <li>
                                <Link href="/main/shop/top-up">
                                    <button
                                        onClick={() => setActiveTab(2)}
                                        className={tabClasses + (activeTab === 2 ? ` ${activeTabClasses}` : ` ${nonActiveTabClasses}`)}
                                    >
                                        Top Up
                                    </button>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Main Content Area */}
                    <main className="container relative z-10 flex flex-1 h-full pt-14 flex-col bg-black/40 backdrop-blur-md">
                        {children}
                    </main>
                </div>
            </div>
        </RefreshProvider>
    );
};

export default ShopLayout;