'use client';
import React from "react";
import BackButton from "@/app/component/BackButton";
import CurrencyResource from "@/app/component/gacha/CurrencyResource";
import { usePathname, useRouter } from "next/navigation";
import Link from 'next/link'; // Import Link
import MoreBox from "@/app/component/gacha/MoreBox";
import { RefreshProvider } from "@/app/component/RefreshContext";

export default function GachaALayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <RefreshProvider>
            <div className="relative flex flex-col w-full h-screen">
                <div className="relative flex flex-1 flex-row bg-black">
                    <div className="absolute w-1/5 p-6 lg:h-20 h-16 z-[60] flex flex-row items-center justify-end right-0 top-0 transition-transform duration-300">
                        <div className="flex flex-1 justify-end items-center">
                            <CurrencyResource activeTab={pathname.includes("standard") ? "standard" : "limited"} /> {/* Kirim activeTab ke CurrencyResource */}
                        </div>
                    </div>

                    {/* Side Buttons (gunakan Link) */}
                    <div className="flex flex-none bg-black w-1/5 h-full flex-col gap-8 items-start justify-start p-8">
                        <div className="flex flex-none justify-start gap-4 text-xs lg:text-base">
                            <BackButton href="/main" />
                            <p className="flex items-center font-bold transition-opacity duration-300">
                                {pathname.includes("standard") ? "Symphony of Silk" : "Whispers of Silk"} {/* Perbarui teks judul */}
                            </p>
                        </div>

                        <Link href="/main/gacha/gacha_a/limited"> {/* Gunakan Link untuk navigasi */}
                            <button className={`flex flex-1 lg:p-8 p-4
                            ${pathname.includes("limited") ? "text-white" : "bg-black opacity-50"}
                            hover:opacity-100 duration-300 hover:scale-105 transform transition-transform`}>
                                <p className="transform -skew-x-12 lg:text-2xl text-xs font-bold pl-4">Japanese Miko</p>
                            </button>
                        </Link>
                        <Link href="/main/gacha/gacha_a/standard"> {/* Gunakan Link untuk navigasi */}
                            <button className={`flex flex-1 lg:p-8 p-4
                            ${pathname.includes("standard") ? "text-white" : "bg-black opacity-50"}
                            hover:opacity-100 duration-300 hover:scale-105 transform transition-transform`}>
                                <p className="transform -skew-x-12 lg:text-2xl text-xs font-bold pl-4">Symphony of Silk</p>
                            </button>   
                        </Link>
                    </div>

                    {/* Content */}
                    <div className="relative flex flex-none w-4/5 h-full bg-black transition-opacity duration-500 ease-in-out overflow-hidden">
                        {children} {/* Render children (Limited_A atau Standard_A) */}
                    </div>
                </div>



                {/* More Box */}
                <div className="absolute flex flex-col gap-4 lg:left-[20rem] lg:bottom-8 left-10 bottom-4 z-[70]">
                    <MoreBox activeTab={pathname.includes("standard") ? "standard" : "limited"} />
                </div>
            </div>
        </RefreshProvider>
    );
}