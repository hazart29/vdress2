'use client'
import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import BoxItem from "@/app/component/gacha/BoxItem";
import GachaButton from "@/app/component/gacha/GachaButton";
import { Users, GachaItem, User_resources } from "@/app/interface";
import Modal from '@/app/component/modal';
import ErrorAlert from "@/app/component/ErrorAlert";
import sjcl from 'sjcl';
import { useRefresh } from "@/app/component/RefreshContext"; // Import context
import Loading from "@/app/component/Loading";
import { UUID } from "crypto";

// Define the ResourceInfo type (important!)
interface ResourceInfo {
    tokens: string;
}

const Limited_A = () => {
    const [userData, setUserData] = useState<Users | null>(null);
    const [userResourceData, setUserResourceData] = useState<User_resources | null>(null);
    const [gachaItem, setGachaItem] = useState<GachaItem[] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInsufficientModalOpen, setIsInsufficientModalOpen] = useState(false); // State for insufficient gems modal
    const videoRef = useRef<HTMLVideoElement>(null);
    const [pulledItems, setPulledItems] = useState<GachaItem[]>([]);
    // const [dustInfo, setDustInfo] = useState<string[]>([]);
    // const [tokenInfo, setTokenInfo] = useState<string[]>([]);
    const [resourceInfo, setResourceInfo] = useState<ResourceInfo[]>([]);

    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [exchangeAmount, setExchangeAmount] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const { refresh } = useRefresh();
    const uid: any = sessionStorage.getItem('uid'); // Pastikan uid tersedia

    let baseSSRProbability: number = 0.006;
    let baseSRProbability: number = 0.051;
    let ProbabilitySSRNow: number;
    let ProbabilitySRNow: number;
    let pity: number;
    const activeTab = 'limited';

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchGachaApi("getUserData", null);
            } finally {
                setIsLoading(false); // Set loading ke false setelah data diterima (atau error)
            }
        };

        fetchData();
    }, []); // Empty dependency array ensures this runs once on component mount

    const fetchGachaApi = async (typeFetch: string, dataFetch?: any) => {
        try {

            // Gabungkan data yang akan dikirimkan dalam body
            const requestBody = {
                uid: uid!,
                typeFetch: typeFetch,
                ...(dataFetch || {}) // Gabungkan dataFetch jika ada
            };

            // Enkripsi data dengan SJCL
            const password = 'virtualdressing'; // Ganti dengan password yang lebih kuat dan aman
            const encryptedData = sjcl.encrypt(password, JSON.stringify(requestBody));

            const response = await fetch('/api/gacha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ encryptedData }), // Kirim data sebagai JSON
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Tangani response berdasarkan typeFetch
            switch (typeFetch) {
                case "getUserData":
                    const reqData: Users = await response.json();
                    setUserData(reqData);
                    break;
                case "getPity":
                    const pityData = await response.json();
                    pity = Number(pityData[0].pity);
                    break;
                case "getRateUpItem":
                    const RateUpItems = await response.json();
                    return RateUpItems;
                case "getRateOn":
                    const isRateOn = await response.json();
                    return isRateOn;
                default:
                    const responseData = await response.json();
                    return responseData;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            return <ErrorAlert message='Terjadi kesalahan. Muat ulang kembali.' />;
        }
    }


    const closeModal = () => {
        setIsModalOpen(false);

        refresh();
    };

    const closeInsufficientModal = () => {
        setIsInsufficientModalOpen(false);
    };

    const openModal = async (a: number) => {
        if (!userData || !userData.user_resources || userData.user_resources.length === 0) {
            console.error('User data or user resources not available');
            return;
        }

        await fetchGachaApi("getUserData", null);
        // console.log('ge: ', userData.user_resources[0].glimmering_essence);

        const essenceCost = a === 1 ? 1 : 10;

        if (userData.user_resources[0].glimmering_essence < essenceCost) {
            const gemsNeeded = essenceCost * 160;
            console.log('gems now : ', userData.user_resources[0].glamour_gems)
            if (userData.user_resources[0].glamour_gems < gemsNeeded) {
                setIsInsufficientModalOpen(true);
                return;
            } else {
                // Tampilkan modal konfirmasi penukaran
                setShowExchangeModal(true);
                setExchangeAmount(essenceCost);
            }
        } else {
            // Jika essence cukup, langsung jalankan gacha
            setIsModalOpen(true);
            setIsLoading(true);
            try {
                const pulledItems = await pull(a);
                setGachaItem(pulledItems);
            } catch (error) {
                console.error('Error during gacha pull:', error);
            } finally {
                setIsLoading(false); // Nonaktifkan loading indicator setelah selesai
            }
        }
        await fetchGachaApi("getUserData", null);
    };

    const handleExchange = async () => {
        try {
            await fetchGachaApi('exchangeGemsForEssence', {
                type: 'glimmering_essence',
                glamour_gems: (exchangeAmount * 160).toString(),
                glimmering_essence: exchangeAmount.toString()
            });
            await fetchGachaApi("getUserData", null);

            setShowExchangeModal(false); // Tutup modal konfirmasi 

            // Jalankan gacha setelah penukaran berhasil
            setIsModalOpen(true);
            try {
                const pulledItems = await pull(exchangeAmount === 1 ? 1 : 10);
                setGachaItem(pulledItems);
            } catch (error) {
                console.error('Error during gacha pull:', error);
            }

            await fetchGachaApi("getUserData", null);

        } catch (error) {
            console.error('Error exchanging gems:', error);
        }
    }

    const handleVideoEnd = async () => {
        const videoDiv = document.getElementById('video');
        if (videoRef.current) {
            videoDiv?.classList.add('hidden');
            videoRef.current.style.display = 'none';
            // if (gachaItem) {
            //     listGacha(gachaItem);
            // }
        }
    };

    const getDataResources = async (uid: UUID) => {
        try {
            const response = await fetch('/api/user_resources', { // Your API endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid }),
            });

            if (!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            const data = await response.json();

            console.log(data.data)
            setUserResourceData(data.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setUserResourceData(null);
        }
    };

    useEffect(() => {
        if (gachaItem) {
            listGacha(gachaItem);
        }
        if (uid) getDataResources(uid.toString());
    }, [gachaItem]);

    function multiplicativeCRNG(seed: number) {
        const a = 1664525; // Multiplier
        const c = 1013904223; // Increment (can be 0 for multiplicative)
        const m = Math.pow(2, 32); // Modulus
        let xn = seed;

        return function () {
            xn = (a * xn + c) % m;
            return xn / m; // Normalize to 0 - 1 range
        }
    }

    // Inisialisasi generator MCRNG dengan seed
    let random = multiplicativeCRNG(Date.now());

    class GachaSystem {
        async makeWish() {
            try {
                let rarity = this.calculateRarity();
                let pulledCharacterOrItem = await this.pullCharacterOrItem(rarity);

                if (pulledCharacterOrItem) {
                    // Check for duplicates using existing getUserData API
                    const isDuplicate = await this.checkDuplicateItem(pulledCharacterOrItem);

                    if (isDuplicate) {
                        // If duplicate, update fashion tokens based on rarity
                        if (pulledCharacterOrItem.rarity === "SSR") {
                            await fetchGachaApi('updateFashionTokens', { fashion_tokens: '11' });
                        } else if (pulledCharacterOrItem.rarity === "SR") {
                            await fetchGachaApi('updateFashionTokens', { fashion_tokens: '2' });
                        } else {
                            await fetchGachaApi('updateFashionTokens', { fashion_tokens: '1' });
                        }
                        // You might want to add a notification here to inform the user about the duplicate and token conversion
                    } else {
                        // If not duplicate, update inventory and add initial tokens
                        const dataFetch = {
                            rarity: pulledCharacterOrItem.rarity,
                            item_name: pulledCharacterOrItem.item_name,
                            part_outfit: pulledCharacterOrItem.part_outfit,
                            layer: pulledCharacterOrItem.layer,
                            gacha_type: 'Whisper_of_Silk'
                        };
                        await fetchGachaApi('upInven', dataFetch);
                        await fetchGachaApi('updateFashionTokens', { fashion_tokens: '1' });
                    }

                    // Update history regardless of duplicate status
                    await fetchGachaApi('upHistoryA', {
                        rarity: pulledCharacterOrItem.rarity,
                        item_name: pulledCharacterOrItem.item_name,
                        part_outfit: pulledCharacterOrItem.part_outfit,
                        gacha_type: 'Whispers_of_Silk'
                    });

                    // // Update glamour dust for R rarity
                    // if (rarity === "R") {
                    //     await fetchGachaApi('updateGlamourDust', { glamour_dust: '15' });
                    // }
                }

                if (rarity === "SSR") {
                    pity = 0;
                } else {
                    pity += 1;
                }

                return pulledCharacterOrItem;
            } catch (error) {
                console.error('Error in makeWish:', error);
                return null;
            }
        }

        async checkDuplicateItem(item: GachaItem): Promise<boolean> {
            try {
                await fetchGachaApi("getUserData", null); // Refresh user data
                const currentInventory = userData?.inventory || []; // Get updated inventory from userData

                // Check if item with the same name already exists
                const checked = currentInventory.some(inventoryItem => inventoryItem.item_name === item.item_name);
                console.log('cek dupe: ', checked)
                return checked;
            } catch (error) {
                console.error('Error checking duplicate item:', error);
                return false;
            }
        }

        calculateRarity() {
            let rand = random(); // Gunakan generator MCRNG 
            // console.log(rand, ':', ProbabilitySSRNow)

            if (rand < ProbabilitySSRNow || (pity + 1) >= 80) {
                return "SSR";
            } else if (rand < ProbabilitySRNow || (pity + 1) % 10 === 0) {
                return "SR";
            } else {
                return "R";
            }
        }


        async pullCharacterOrItem(rarity: string) {
            let pulledCharacterOrItem: any;
            const dataFetch = { rarity };
            let data;

            if (rarity === "SSR" || rarity === "SR") {
                // const isRateUp = await fetchGachaApi('getRateOn');

                // if (isRateUp && rarity === "SSR") {
                //     // Rate ON: Ambil item limited
                //     data = await fetchGachaApi('getRateUpItem', dataFetch);
                // } else {
                // Rate OFF: 50:50 limited atau tidak (untuk SSR dan SR)
                if (Math.random() < 0.5) {
                    data = await fetchGachaApi('getRateUpItem', dataFetch);
                } else {
                    data = await fetchGachaApi('getRateOffItem', dataFetch);
                }
                // }

                // Pilih item dari data yang sudah difilter
                const keys = Object.keys(data);
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                const randomItem = data[randomKey];
                console.log('rand item : ', randomItem);
                pulledCharacterOrItem = randomItem;

                // // Update is_rate (khusus SSR)
                // if (rarity === "SSR") {
                //     if (randomItem.islimited) {
                //         await fetchGachaApi('setRateOff');
                //     } else {
                //         await fetchGachaApi('setRateOn');
                //     }
                // }
            } else { // Untuk rarity R
                data = await fetchGachaApi('getGachaItem', dataFetch);

                // Pilih item dari data 
                const keys = Object.keys(data);
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                const randomItem = data[randomKey];
                // console.log('rand item : ', randomItem);
                pulledCharacterOrItem = randomItem;
            }

            // console.log('pulled : ', pulledCharacterOrItem)

            return pulledCharacterOrItem;
        }
    }

    async function pull(a: number): Promise<GachaItem[]> {
        let tenpull: GachaItem[] = [];

        try {
            await fetchGachaApi('getPity');

            for (let i = 0; i < a; i++) {
                // Hitung probabilitas SR dan SSR berdasarkan pity saat ini
                ProbabilitySRNow = baseSRProbability + ((pity % 10) * 0.0087);
                ProbabilitySSRNow = baseSSRProbability + (pity * 0.00111);
                // console.log('ProbabilitySRNow', ProbabilitySRNow)
                // console.log('ProbabilitySSRNow', ProbabilitySSRNow)

                const result = await gacha.makeWish();
                // Gunakan if-else untuk incSRProbability
                if (ProbabilitySRNow >= 1) {
                    ProbabilitySSRNow = baseSRProbability;
                }

                // Gunakan if-else untuk incSSRProbability
                if (ProbabilitySSRNow >= 1) {
                    ProbabilitySSRNow = baseSSRProbability;
                }

                tenpull[i] = result;
            }

            // console.log('pity after loop:', pity);

            // Update pity di server
            await fetchGachaApi('incPity', {
                incPity: pity,
                type: 'limited'
            });

            // Update glamour_gems di server (pastikan endpoint API Anda mengharapkan string)
            const GlimmeringEssence = (a).toString();
            await fetchGachaApi('updateEssence', {
                essence: GlimmeringEssence,
                type: 'limited'
            });

            return tenpull;

        } catch (error) {
            console.error('Error fetching API:', error);
            return [];
        }
    }

    const sortPulledItems = (pulledItems: GachaItem[]) => {
        return pulledItems.sort((a, b) => {
            const rarityOrder = { R: 0, SR: 1, SSR: 2 };
            return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
        });
    };

    const listGacha = async (tenpull: any[]) => {
        // const sortedTenpull = sortPulledItems(tenpull);
        setPulledItems(tenpull);

        // Assuming fetchGachaApi("getUserData", null) has been called before listGacha
        const currentInventory = userData?.inventory || [];

        // Create ResourceInfo objects with filtered values
        const resourceInfo = tenpull.map((item) => {
            const rarity = item.rarity.trim();
            const isDuplicate = currentInventory.some(inventoryItem => inventoryItem.item_name === item.item_name);

            return {
                tokens:
                    rarity === "SR"
                        ? (isDuplicate ? '+2' : '+1')
                        : (rarity === "SSR"
                            ? (isDuplicate ? '+11' : '+1')
                            : (rarity === "R" ? '+1' : '')),
            };

        }).filter(resource => resource.tokens !== '');

        // Update state with the resourceInfo array
        setResourceInfo(resourceInfo);
    };

    const gacha = new GachaSystem();

    return (
        <>
            {isLoading && (
                <Loading />
            )}
            {!isLoading && ( // Render konten hanya jika isLoading false
                <>
                    <div className="flex flex-1 lg:pt-10 pt-4 bg-gacha1 bg-cover lg:blur-md blur-sm animate-pulse" />
                    <div className="absolute w-full h-full flex flex-1 bg-gradient-to-b from-transparent via-transparent to-black to-100% z-10" />
                    <div className="absolute w-full h-full flex flex-1 z-20 lg:pt-20 pt-14">
                        <div className="flex flex-1">
                            <div className="relative flex flex-none w-1/3 justify-start p-8">
                                <div className="absolute w-full h-full">
                                    <Image
                                        id="imgbanner"
                                        src={"/banner/avatar/limitedA.png"}
                                        alt={"imgbanner"}
                                        fill
                                        objectFit="cover"
                                        objectPosition="top"
                                    />
                                </div>
                            </div>

                            <div className="relative flex flex-auto flex-col lg:gap-4 gap-2">
                                <div className="absolute -right-12 flex items-start justify-start px-12 transform -skew-x-12 bg-gradient-to-r from-transparent via-red-600 to-red-600 to-100% bg-opacity-50 transition-opacity duration-1000">
                                    <p className="lg:text-8xl text-end text-5xl font-black transform skew-x-12 text-white pr-12">JAPANESE MIKO</p>
                                </div>

                                {/* transparent div */}
                                <div className="flex items-end justify-end px-12 transform -skew-x-12 bg-transparent">
                                    <p className="lg:text-8xl text-5xl font-black transform skew-x-12 text-transparent pr-12">JAPANESE MIKO</p>
                                </div>
                                {/* transparent div */}

                                <div className="flex flex-none items-start justify-end pr-16">
                                    <p className="text-end lg:text-sm text-[9px] lg:w-5/6 w-full">Rasakan keagungan kuil dengan gacha Miko terbaru! Dapatkan kostum gadis kuil yang cantik dengan jubah putih bersih dan rok merah menyala, lengkap dengan aksesoris seperti gohei dan ofuda. Raih kesempatan untuk memanggil roh keberuntungan dan keindahan! Jangan lewatkan kesempatan langka ini, tersedia untuk waktu terbatas!</p>
                                </div>
                                <div className="absolute flex flex-auto flex-col gap-8 bottom-0 right-0">
                                    <div className="flex flex-1 items-end justify-end gap-8 pr-16">
                                        <BoxItem imageUrl={"/icons/outfit/A/MikoA.png"} altText={"Miko a"} />
                                        <BoxItem imageUrl={"/icons/outfit/B/MikoB.png"} altText={"Miko b"} />
                                        <BoxItem imageUrl={"/icons/outfit/C/MikoC.png"} altText={"Miko c"} />
                                        <p className=" flex flex-none h-20 justify-center items-center animate-pulse text-yellow-400">Rate Up!</p>
                                    </div>
                                    <div className="flex flex-1 pr-20 ">
                                        <div className="relative flex flex-1 h-5 bg-gray-200">
                                            <div className="absolute -top-4 -left-0 bg-red-500 px-1 transform -skew-x-12">
                                                <p className="text-white font-bold ">Guarantee bar :</p>
                                            </div>
                                            <div className="absolute -right-3 -top-1 bg-red-500 font-bold px-1 transform -skew-x-12">
                                                <p className="text-2xl text-white skew-x-12">/80</p>
                                            </div>
                                            {userResourceData && (
                                                <div
                                                    className="flex flex-none justify-end items-center bg-blue-500 px-2"
                                                    style={{ width: `${(userResourceData.pity / 80) * 100}%` }}>
                                                    <p className="text-xs font-semibold font-sans">{userResourceData.pity}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-none flex-col gap-4 pr-16 pb-10 justify-center">
                                        <GachaButton onClick={openModal} activeTab={activeTab} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gacha Modal */}
                    <Modal isOpen={isModalOpen} onClose={closeModal}>
                        <div className="relative w-full h-full flex flex-1 flex-col items-center justify-center">
                            <div className="flex flex-1 flex-col w-full h-full justify-between bg-white p-8">
                                <div className="flex flex-1 flex-col flex-wrap items-center justify-center">

                                    <div id="diDapat" className="flex flex-none flex-row w-full justify-center items-center gap-1 animate-pulse">
                                        {pulledItems.map((item, index) => (
                                            <img
                                                key={index}
                                                src={`/icons/outfit/${item.layer.toLocaleUpperCase()}/${item.item_name}.png`}
                                                alt={item.item_name}
                                                className={`w-24 h-24 ${item.rarity.trim() === "SSR" ? 'bg-yellow-400' : item.rarity.trim() === "SR" ? 'bg-purple-400' : 'bg-gray-500'} opacity-100 transition-opacity duration-500`}
                                                onLoad={(e) => {
                                                    (e.target as HTMLImageElement).classList.add('opacity-100');
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <div id="addResource" className="flex flex-none flex-row w-full justify-center items-center gap-1 animate-pulse text-[8px]">
                                        {resourceInfo.length > 0 && resourceInfo.map((resource, index) => (
                                            <p key={index} className="flex flex-none flex-row gap-1 justify-center items-center text-black w-24 font-bold">
                                                {resource.tokens !== '' && (
                                                    <>
                                                        <Image src={"/icons/currency/fashion_tokens.png"} alt={"fashion_tokens"} width={24} height={24} />
                                                        {resource.tokens}
                                                    </>
                                                )}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 focus:outline-none font-bold text-2xl text-gray-400 animate-pulse"
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>

                        </div>
                    </Modal>

                    {/* Insufficient Gems Modal */}
                    <Modal isOpen={isInsufficientModalOpen} onClose={closeInsufficientModal}>
                        <div className="p-4 flex flex-col flex-none w-2/5 justify-center items-center bg-white rounded-lg py-8">
                            <p className="text-black">Glamour Gems tidak cukup!</p>
                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={closeInsufficientModal}
                                    className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* Modal Konfirmasi Penukaran */}
                    <Modal isOpen={showExchangeModal} onClose={() => setShowExchangeModal(false)}>
                        <div className="p-4 flex flex-col flex-none w-2/5 justify-center items-center bg-white rounded-lg py-8">
                            <p className="text-black mb-4 text-center">
                                Glimmering Essence tidak cukup! <br />
                                Tukarkan <span className="text-amber-400">{exchangeAmount * 160} Glamour Gems</span> dengan <span className="text-blue-400">{exchangeAmount} Glimmering Essence</span>?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    onClick={handleExchange}

                                >
                                    Ya, Tukar
                                </button>
                                <button
                                    className="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                                    onClick={() => setShowExchangeModal(false)}
                                >
                                    Tidak
                                </button>
                            </div>
                        </div>
                    </Modal>

                </>
            )}

        </>
    )
}

export default Limited_A;