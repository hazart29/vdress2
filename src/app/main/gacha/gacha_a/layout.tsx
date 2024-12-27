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
                <div className="relative flex flex-1 flex-col">
                    <div className="absolute w-full p-6 lg:h-20 h-16 z-[60] flex flex-row items-center inset-0 top-0 transition-transform duration-300">
                        <div className="flex flex-1 justify-start gap-4 items-center text-xs lg:text-base">
                            <BackButton href="/main" />
                            <p className="font-bold transition-opacity duration-300">
                                {pathname.includes("standard") ? "Symphony of Silk" : "Whispers of Silk"} {/* Perbarui teks judul */}
                            </p>
                        </div>
                        <div className="flex flex-1 justify-end items-center">
                            <CurrencyResource activeTab={pathname.includes("standard") ? "standard" : "limited"} /> {/* Kirim activeTab ke CurrencyResource */}
                        </div>
                    </div>

                    {/* Content */}
                    <div className=" flex flex-1 bg-black transition-opacity duration-500 ease-in-out">
                        {children} {/* Render children (Limited_A atau Standard_A) */}
                    </div>
                </div>

                {/* Side Buttons (gunakan Link) */}
                <div className="absolute flex flex-col gap-4 -left-8 lg:bottom-36 bottom-16 z-50">
                    <Link href="/main/gacha/gacha_a/limited"> {/* Gunakan Link untuk navigasi */}
                        <button className={`flex flex-1 lg:p-8 p-4 shadow-black shadow-xl transform skew-x-12 pl-12
                            ${pathname.includes("limited") ? "bg-white opacity-70 text-black" : "bg-black opacity-50"}
                            hover:bg-white hover:text-black hover:opacity-100 duration-300 hover:scale-105 transform transition-transform`}>
                            <p className="transform -skew-x-12 lg:text-2xl text-xs font-bold pl-4">Japanese Miko</p>
                        </button>
                    </Link>
                    <Link href="/main/gacha/gacha_a/standard"> {/* Gunakan Link untuk navigasi */}
                        <button className={`flex flex-1 lg:p-8 p-4 shadow-black shadow-xl transform skew-x-12 pl-12
                            ${pathname.includes("standard") ? "bg-white opacity-70 text-black" : "bg-black opacity-50"}
                            hover:bg-white hover:text-black hover:opacity-100 duration-300 hover:scale-105 transform transition-transform`}>
                            <p className="transform -skew-x-12 lg:text-2xl text-xs font-bold pl-4">Symphony of Silk</p>
                        </button>
                    </Link>
                </div>

                {/* More Box */}
                <div className="absolute flex flex-col gap-4 lg:left-44 lg:bottom-16 left-10 bottom-4 z-[70]">
                    <MoreBox activeTab={pathname.includes("standard") ? "standard" : "limited"} />
                </div>
            </div>
        </RefreshProvider>
    );
}