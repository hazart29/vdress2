'use client'
import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import BoxItem from "@/app/component/gacha/BoxItem";
import GachaButton from "@/app/component/gacha/GachaButton";
import { Users, GachaItem } from "@/app/interface";
import Modal from '@/app/component/modal';
import ErrorAlert from "@/app/component/ErrorAlert";
import sjcl from 'sjcl';
import { useRefresh } from "@/app/component/RefreshContext";
import Loading from "@/app/component/Loading";

// Define the ResourceInfo type (important!)
interface ResourceInfo {
    dust: string;
    tokens: string;
}

const Standard_A = () => {
    const [userData, setUserData] = useState<Users | null>(null);
    const [gachaItem, setGachaItem] = useState<GachaItem[] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInsufficientModalOpen, setIsInsufficientModalOpen] = useState(false); // State for insufficient gems modal
    const videoRef = useRef<HTMLVideoElement>(null);
    const [pulledItems, setPulledItems] = useState<GachaItem[]>([]);    
    const [resourceInfo, setResourceInfo] = useState<ResourceInfo[]>([]);

    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [exchangeAmount, setExchangeAmount] = useState(0);

    const { refresh } = useRefresh();
    const [isLoading, setIsLoading] = useState(false);

    let baseSSRProbability: number = 0.006;
    let baseSRProbability: number = 0.051;
    let ProbabilitySSRNow: number;
    let ProbabilitySRNow: number;
    let standard_pity: number;
    const activeTab = 'standard';

    useEffect(() => {
        fetchGachaApi("getUserData", null);
    }, []); // Empty dependency array ensures this runs once on component mount

    const fetchGachaApi = async (typeFetch: string, dataFetch?: any) => {
        try {
            const uid = sessionStorage.getItem('uid'); // Pastikan uid tersedia

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
                case "getStandardPity":
                    const pityData = await response.json();
                    standard_pity = Number(pityData[0].standard_pity);
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

        refresh()
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

        if (userData.user_resources[0].shimmering_essence < essenceCost) {
            const gemsNeeded = essenceCost * 160;
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
                type: 'shimmering_essence',
                glamour_gems: (exchangeAmount * 160).toString(),
                shimmering_essence: exchangeAmount.toString()
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

    useEffect(() => {
        if (gachaItem) {
            listGacha(gachaItem);
        }
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
                            await fetchGachaApi('updateFashionTokens', { fashion_tokens: '25' });
                        } else if (pulledCharacterOrItem.rarity === "SR") {
                            await fetchGachaApi('updateFashionTokens', { fashion_tokens: '5' });
                        }
                        // You might want to add a notification here to inform the user about the duplicate and token conversion
                    } else {
                        // If not duplicate, update inventory and add initial tokens
                        await fetchGachaApi('upInven', {
                            rarity: pulledCharacterOrItem.rarity,
                            item_name: pulledCharacterOrItem.item_name,
                            part_outfit: pulledCharacterOrItem.part_outfit,
                            layer: pulledCharacterOrItem.layer,
                            gacha_type: 'Symphony_of_Silk'
                        });

                        if (pulledCharacterOrItem.rarity === "SSR") {
                            await fetchGachaApi('updateFashionTokens', { fashion_tokens: '10' });
                        } else if (pulledCharacterOrItem.rarity === "SR") {
                            await fetchGachaApi('updateFashionTokens', { fashion_tokens: '2' });
                        }
                    }

                    // Update history regardless of duplicate status
                    await fetchGachaApi('upHistoryA', {
                        rarity: pulledCharacterOrItem.rarity,
                        item_name: pulledCharacterOrItem.item_name,
                        part_outfit: pulledCharacterOrItem.part_outfit,
                        gacha_type: 'Symphony_of_Silk'
                    });

                    // Update glamour dust for R rarity
                    if (rarity === "R") {
                        await fetchGachaApi('updateGlamourDust', { glamour_dust: '15' });
                    }
                }

                if (rarity === "SSR") {
                    standard_pity = 0;
                } else {
                    standard_pity += 1;
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
                return currentInventory.some(inventoryItem => inventoryItem.item_name === item.item_name);
            } catch (error) {
                console.error('Error checking duplicate item:', error);
                return false;
            }
        }

        calculateRarity() {
            let rand = random(); // Gunakan generator MCRNG 
            // console.log(rand, ':', ProbabilitySSRNow)

            if (rand < ProbabilitySSRNow || (standard_pity + 1) >= 90) {
                return "SSR";
            } else if (rand < ProbabilitySRNow || (standard_pity + 1) % 10 === 0) {
                return "SR";
            } else {
                return "R";
            }
        }


        async pullCharacterOrItem(rarity: string) {
            let pulledCharacterOrItem: any;
            const dataFetch = { rarity };
            let data;

            if (rarity === "SSR") {

                // Rate ON: Ambil item limited
                data = await fetchGachaApi('getStandardItem', dataFetch);

                // Pilih item dari data yang sudah difilter
                const keys = Object.keys(data);
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                const randomItem = data[randomKey];
                console.log('rand item : ', randomItem);
                pulledCharacterOrItem = randomItem;

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
            await fetchGachaApi('getStandardPity');

            for (let i = 0; i < a; i++) {
                // Hitung probabilitas SR dan SSR berdasarkan pity saat ini
                ProbabilitySRNow = baseSRProbability + ((standard_pity % 10) * 0.0087);
                ProbabilitySSRNow = baseSSRProbability + (standard_pity * 0.00111);
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

            // console.log('pity after loop:', standard_pity);

            // Update pity di server
            await fetchGachaApi('incPity', {
                incPity: standard_pity,
                type: 'standard'
            });

            // Update glamour_gems di server (pastikan endpoint API Anda mengharapkan string)
            const ShimmeringEssence = (a).toString();
            await fetchGachaApi('updateEssence', {
                essence: ShimmeringEssence,
                type: 'standard'
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
        const sortedTenpull = sortPulledItems(tenpull);
        setPulledItems(sortedTenpull);

        // Assuming fetchGachaApi("getUserData", null) has been called before listGacha
        const currentInventory = userData?.inventory || [];

        // Create ResourceInfo objects with filtered values
        const resourceInfo = tenpull.map((item) => {
            const rarity = item.rarity.trim();
            const isDuplicate = currentInventory.some(inventoryItem => inventoryItem.item_name === item.item_name);

            return {
                dust: rarity === "R" ? '+15' : '',
                tokens: rarity === "SR"
                    ? (isDuplicate ? '+5' : '+2')
                    : (rarity === "SSR" ? (isDuplicate ? '+25' : '+10') : ''),
            };
        }).filter(resource => resource.dust !== '' || resource.tokens !== '');

        // Update state with the resourceInfo array
        setResourceInfo(resourceInfo);
    };

    const gacha = new GachaSystem();

    return (
        <>
            {isLoading && (
                <Loading />
            )}
            {!isLoading && (
                <>
                    <div className="flex flex-1 lg:pt-10 pt-4 bg-gacha2 bg-cover lg:blur-md blur-sm animate-pulse" />
                    <div className="absolute w-full h-full flex flex-1 pt-10 bg-gradient-to-b from-transparent via-transparent to-black to-100% z-10" />
                    <div className="absolute w-full h-full flex flex-1 z-20 lg:pt-20 pt-14">
                        <div className="flex flex-none flex-shrink w-2/5">
                            <div className="relative h-full w-full transition-transform duration-200">
                                <div className="absolute flex justify-end w-full h-full -bottom-28 -right-10">
                                    <Image
                                        id="mikoImg"
                                        src={"/banner/avatar/standardA.png"}
                                        alt={"miko"}
                                        layout="fill"
                                        objectFit="contain"
                                        objectPosition="bottom"
                                        className="scale-150"
                                    />
                                </div>
                                <div className="absolute flex justify-end w-full h-full -bottom-32 -right-52">
                                    <Image
                                        id="mikoImg"
                                        src={"/banner/avatar/standardB.png"}
                                        alt={"miko"}
                                        layout="fill"
                                        objectFit="contain"
                                        objectPosition="bottom"
                                        className="scale-95"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="relative flex flex-1">
                            <div className="absolute z-40 flex flex-1 w-full h-full flex-col lg:gap-4 gap-2">
                                <div className="absolute flex items-center justify-end px-12 transform -skew-x-12 bg-gradient-to-r from-transparent via-violet-600 to-violet-600 to-100% bg-opacity-50 -right-10 transition-opacity duration-1000">
                                    <p className="lg:text-8xl text-5xl text-end font-black transform skew-x-12 text-white pr-12">CELESTIAL MAIDENS</p>
                                </div>

                                {/* transparent div */}
                                <div className="flex items-end justify-end px-12 transform -skew-x-12 bg-transparent">
                                    <p className="lg:text-8xl text-5xl text-end font-black transform skew-x-12 text-transparent pr-12">Celestial Maidens</p>
                                </div>
                                {/* transparent div */}

                                <div className="flex flex-none items-start justify-end pr-16">
                                    <p className="text-end lg:text-sm text-[9px] lg:w-5/6 w-full">Dalam sebuah kerajaan yang jauh, para maid adalah sosok yang sangat dihormati. Mereka dikenal karena kecantikan, keanggunan, dan dedikasi mereka yang tinggi. Dengan kostum yang mencerminkan status sosial mereka, para maid ini adalah simbol keindahan dan kemewahan. Dapatkan kostum maid ekslusif dan jadilah bagian dari kisah mereka.</p>
                                </div>
                                <div className="flex flex-1 flex-col gap-12">
                                    <div className="flex flex-1 items-end justify-end gap-8 pr-16">
                                        <BoxItem imageUrl={"/icons/outfit/A/maidA.png"} altText={"maid a"} />
                                        <BoxItem imageUrl={"/icons/outfit/B/maidB.png"} altText={"maid b"} />
                                        <BoxItem imageUrl={"/icons/outfit/C/maidC.png"} altText={"maid c"} />
                                        <p className=" flex flex-none h-20 justify-center items-center animate-pulse text-yellow-400">Rate Up!</p>
                                    </div>
                                    <div className="flex flex-none flex-col gap-4 pr-16 pb-10 justify-center">
                                        <GachaButton onClick={openModal} activeTab={activeTab} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gacha Modal */}
                    <Modal isOpen={isModalOpen} onClose={closeModal} >
                        <div className="relative w-full h-full flex flex-1 flex-col items-center justify-center">
                            <div className="flex flex-1 flex-col w-full h-full justify-between bg-white p-8">
                                <div className="flex flex-1 flex-col items-center justify-center">
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
                                            <p key={index} className="flex flex-none flex-row gap-2 justify-center items-center text-black w-24 font-bold">
                                                {resource.dust !== '' && (
                                                    <>
                                                        <Image src={"/icons/currency/glamour_dust.png"} alt={"glamour_dust"} width={12} height={12} />
                                                        {resource.dust}
                                                    </>
                                                )}
                                                {resource.tokens !== '' && (
                                                    <>
                                                        <Image src={"/icons/currency/fashion_tokens.png"} alt={"fashion_tokens"} width={12} height={12} />
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
                    </Modal >

                    {/* Insufficient Gems Modal */}
                    <Modal isOpen={isInsufficientModalOpen} onClose={closeInsufficientModal} >
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
                    </Modal >

                    {/* Modal Konfirmasi Penukaran */}
                    <Modal isOpen={showExchangeModal} onClose={() => setShowExchangeModal(false)}>
                        <div className="p-4 flex flex-col flex-none w-2/5 justify-center items-center bg-white rounded-lg py-8">
                            <p className="text-black mb-4 text-center">
                                Shimmering Essence tidak cukup! <br />
                                Tukarkan <span className="text-amber-400">{exchangeAmount * 160} Glamour Gems</span> dengan <span className="text-blue-400">{exchangeAmount} Shimmering Essence</span>?
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
                    </Modal >
                </>
            )}

        </>
    )
}

export default Standard_A;