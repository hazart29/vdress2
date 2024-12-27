'use client'
import { useEffect, useState } from "react";
import React from "react";
import { User_resources } from "@/app/interface"; // Adjust path if needed
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRefresh } from "@/app/component/RefreshContext"; // Import context
import { UUID } from "crypto";

interface CurrencyResourceProps {
    activeTab: string;
}

const CurrencyResource: React.FC<CurrencyResourceProps> = ({ activeTab }) => {
    const [userData, setUserData] = useState<User_resources | null>(null);
    const router = useRouter();
    const { refresh } = useRefresh();
    const uid: any = sessionStorage.getItem('uid');

    const getData = async (uid: UUID) => {
        try {
            const response = await fetch('/api/user_resources', { // Your API endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid }),
            });

            if (!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            const data = await response.json();

            console.log(data.data)
            setUserData(data.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setUserData(null);
        }
    };

    useEffect(() => {
        console.log(uid)
        if (uid) getData(uid.toString());
        else {
            console.error("User ID not found.");
            setUserData(null);
            router.push('/login'); // Or handle as needed
        }
    }, [uid, activeTab, refresh, router]);

    return (
        <>
            <div className='flex gap-2 flex-1 lg:text-xs text-[10px] p-1 items-center justify-end'>
                <div className='px-2 py-1 items-center justify-center flex gap-2 rounded-full bg-white w-20'>
                    <Image src={"/icons/currency/fashion_tokens.png"} alt={"fashion_tokens"} width={20} height={20} />
                    <p className='text-slate-900'>
                        {userData?.fashion_tokens || 0}
                    </p>
                </div>
                <div className='px-2 py-1 items-center justify-center flex gap-2 rounded-full bg-white w-20'>
                    <Image src={"/icons/currency/glamour_dust.png"} alt={"fashion_tokens"} width={20} height={20} />
                    <p className='text-slate-900'>
                        {userData?.glamour_dust || 0}
                    </p>
                </div>
                {activeTab !== 'SHOP' && (
                    <div id="essence" className='px-2 py-1 items-center justify-center flex gap-2 rounded-full bg-white w-20'>
                        {activeTab === 'limited' ?
                            <Image src={"/icons/currency/glimmering_essence.png"} alt={"fashion_tokens"} width={20} height={20} />
                            :
                            <Image src={"/icons/currency/shimmering_essence.png"} alt={"fashion_tokens"} width={20} height={20} />
                        }

                        <p className='text-slate-900'>
                            {activeTab === 'limited' ? (userData?.glimmering_essence || 0) : (userData?.shimmering_essence || 0)}
                        </p>
                    </div>
                )}
                <div className='px-2 py-1 items-center justify-between flex gap-2 rounded-full bg-white w-fit'>
                    <Image src={"/icons/currency/glamour_gems.png"} alt={"fashion_tokens"} width={20} height={20} />
                    <span className="flex gap-1">
                        <p className='flex text-slate-900'>
                            {userData?.glamour_gems || 0}
                        </p>
                        <a href={"/main/shop/top-up"} className="font-bold flex items-center justify-center text-black bg-gray-200 rounded-full px-1">
                            +
                        </a>
                    </span>
                </div>
            </div>
        </>
    );
}

export default CurrencyResource;