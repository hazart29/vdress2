'use client'
import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import BoxItem from "@/app/component/gacha/BoxItem";
import GachaButton from "@/app/component/gacha/GachaButton";
import { Users, GachaItem, User_resources } from "@/app/interface";
import Modal from '@/app/component/modal';
import ErrorAlert from "@/app/component/ErrorAlert";
import sjcl from 'sjcl';
import { useRefresh } from "@/app/component/RefreshContext";
import Loading from "@/app/component/Loading";
import { UUID } from "crypto";

// Define the ResourceInfo type (important!)
interface ResourceInfo {
    dust: string;
}

const Standard_A = () => {
    const [userData, setUserData] = useState<Users | null>(null);
    const [userResourceData, setUserResourceData] = useState<User_resources | null>(null);
    const [gachaItem, setGachaItem] = useState<GachaItem[] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInsufficientModalOpen, setIsInsufficientModalOpen] = useState(false); // State for insufficient gems modal
    const videoRef = useRef<HTMLVideoElement>(null);
    const [pulledItems, setPulledItems] = useState<GachaItem[]>([]);
    const [resourceInfo, setResourceInfo] = useState<ResourceInfo[]>([]);
    const [localGachaData, setLocalGachaData] = useState<GachaItem[]>([]);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [exchangeAmount, setExchangeAmount] = useState(0);
    const { refresh } = useRefresh();
    const uid: any = localStorage.getItem('uid'); // Pastikan uid tersedia
    const [isLoading, setIsLoading] = useState(false);
    let tenpull: GachaItem[] = [];
    let baseSSRProbability = 0.0075; // 0.75%
    let baseSRProbability = 0.01;    // 1%
    const consolidatedSSRProbability = 0.02; // 2%
    const consolidatedSRProbability = 0.12; // 12%
    const softPity = 60;
    const hardPity = 80;
    let ProbabilitySSRNow: number;
    let ProbabilitySRNow: number;
    let standard_pity: number;
    const activeTab = 'standard';

    useEffect(() => {
        fetchGachaApi("getUserData", null);
        fetchAllGachaItems()
    }, []); // Empty dependency array ensures this runs once on component mount

    async function fetchAllGachaItems() {
        try {
            const data = await fetchGachaApi('getAllGachaItems');
            // console.log('data gacha: ', data.gachaItem)
            setLocalGachaData(data.gachaItem); // Simpan ke state lokal
        } catch (error) {
            console.error('Error fetching all gacha items:', error);
        }
    }

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
        tenpull = [];
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
            const gemsNeeded = essenceCost * 150;
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
                glamour_gems: (exchangeAmount * 150).toString(),
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

    function xorshift32(state: number) {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        return state;
    }

    function combinedRandom(seed: number) {
        const mcrng = multiplicativeCRNG(seed);
        let xorshiftState = seed; // Use seed as initial state for Xorshift

        return function () {
            const mcrngOutput = mcrng();
            xorshiftState = xorshift32(xorshiftState ^ mcrngOutput); // XOR MCRNG output with Xorshift state
            return (xorshiftState >>> 0) / Math.pow(2, 32); // Return unsigned Xorshift state normalized to 0-1
        };
    }

    // Usage
    let random = combinedRandom(Date.now());

    class GachaSystem {
        static PITY_HARD_SSR = 80;
        static PITY_SOFT_SSR = 60; // Soft standard_pity for increased SSR chance
        static PITY_SR = 10;
        static PITY_THRESHOLD = 80;
        static SSR_DUPLICATE_DUSTS = 10;  // Example value
        static SR_DUPLICATE_DUSTS = 2;
        static SSR_NEW_ITEM_DUSTS = 1;
        static SR_NEW_ITEM_DUSTS = 1;
        srPity: number = 0;  // Track SR standard_pity
        static isRateUp: boolean;
        static itemsToUpload: GachaItem[] = [];
        static glamourDust: number = 0;

        async makeWish() {
            try {
                const rarity = this.calculateRarity();
                const pulledCharacterOrItem = await this.pullCharacterOrItem(rarity);

                if (pulledCharacterOrItem) {
                    const isDuplicate = await this.checkDuplicateItem(pulledCharacterOrItem);

                    if (isDuplicate) {
                        await this.handleDuplicate(pulledCharacterOrItem); // Handle duplicate item
                    } else {
                        await this.addItemToInventory(pulledCharacterOrItem); // Add new item to inventory
                    }

                    // await this.updateHistory(pulledCharacterOrItem); // Update history with the item
                }

                // Update standard_pity based on rarity
                if (rarity === "SSR") {
                    this.resetPitySSR();
                } else if (rarity === "SR") {
                    this.resetPitySR();
                    this.incrementPitySSR();
                } else {
                    this.incrementPitySSR();
                    this.incrementPitySR();
                }

                return pulledCharacterOrItem;
            } catch (error) {
                console.error('Error in makeWish:', error);
                return null;
            }
        }

        /// Calculate SSR and SR probabilities based on standard_pity
        calculatePityProbabilities() {
            console.log('standard_pity now : ', standard_pity + 1);

            // SSR probability (before soft standard_pity, soft standard_pity, and hard standard_pity)
            if (standard_pity < softPity) {
                // Before soft standard_pity: Linearly increase SSR probability up to 2%
                const progress = standard_pity / softPity; // Progression between 0 and 1
                ProbabilitySSRNow = baseSSRProbability +
                    (consolidatedSSRProbability - baseSSRProbability) * progress;
            } else if (standard_pity >= softPity && standard_pity < hardPity) {
                // Soft standard_pity: Exponentially increase SSR probability
                const progress = (standard_pity - softPity) / (hardPity - softPity); // Progression between 0 and 1
                ProbabilitySSRNow = consolidatedSSRProbability +
                    (1 - consolidatedSSRProbability) * (1 - Math.exp(-5 * progress));
            } else if (standard_pity >= hardPity) {
                // Hard standard_pity: Guaranteed SSR
                ProbabilitySSRNow = 1;
            } else {
                // Base probability
                ProbabilitySSRNow = baseSSRProbability;
            }

            // SR probability (before 10th pull and guarantee)
            if (this.srPity < 9) {
                // Before 10th pull: Linearly increase SR probability up to 12%
                const progress = this.srPity / 9; // Progression between 0 and 1
                ProbabilitySRNow = baseSRProbability +
                    (consolidatedSRProbability - baseSRProbability) * progress;
            } else {
                // Guarantee SR at 10th pull
                ProbabilitySRNow = 1;
            }
        }

        calculateRarity() {
            const rand = random(); // Use MCRNG generator
            console.log('random : ', rand);
            if (rand < ProbabilitySSRNow || (standard_pity + 1) >= GachaSystem.PITY_THRESHOLD) {
                return "SSR";
            } else if (rand < ProbabilitySRNow || (this.srPity + 1) % 10 === 0) {
                return "SR";
            } else {
                return "R";
            }
        }

        async pullCharacterOrItem(rarity: string) {
            try {
                let data;

                if (rarity === "SSR") {
                    data = localGachaData.filter(item => item.rarity === rarity && item.rate_up === false);
                } else {
                    data = localGachaData.filter(item => item.rarity === rarity);
                }

                const randomItem = this.selectRandomItem(data);
                return randomItem;
            } catch (error) {
                console.error('Error pulling character or item:', error);
                return null;
            }
        }

        selectRandomItem(data: { [x: string]: any; }) {
            const keys = Object.keys(data);
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            return data[randomKey];
        }

        async checkDuplicateItem(item: GachaItem): Promise<boolean> {
            try {
                await fetchGachaApi("getUserData", null);
                const currentInventory = userData?.inventory || [];
                return currentInventory.some(inventoryItem => inventoryItem.item_name === item.item_name);
            } catch (error) {
                console.error('Error checking duplicate item:', error);
                return false;
            }
        }

        // Add the functions you provided here
        async handleDuplicate(item: { rarity: string; }) {
            try {
                const dusts = item.rarity === "SSR"
                    ? GachaSystem.SSR_DUPLICATE_DUSTS
                    : item.rarity === "SR"
                        ? GachaSystem.SR_DUPLICATE_DUSTS
                        : 1;

                GachaSystem.glamourDust += dusts;
            } catch (error) {
                console.error('Error handling duplicate item:', error);
            }
        }

        async addItemToInventory(pulledCharacterOrItem: GachaItem) {
            try {
                GachaSystem.itemsToUpload.push(pulledCharacterOrItem);

                const dusts = pulledCharacterOrItem.rarity === "SSR"
                    ? GachaSystem.SSR_NEW_ITEM_DUSTS
                    : pulledCharacterOrItem.rarity === "SR"
                        ? GachaSystem.SR_NEW_ITEM_DUSTS
                        : 1;

                GachaSystem.glamourDust += dusts;
            } catch (error) {
                console.error('Error adding item to inventory:', error);
            }
        }

        resetPitySSR() {
            standard_pity = 0;
        }

        resetPitySR() {
            this.srPity = 0;
        }

        incrementPitySSR() {
            standard_pity += 1;
        }

        incrementPitySR() {
            this.srPity += 1;
        }
    }

    async function pull(a: number): Promise<GachaItem[]> {
        tenpull = [];

        try {
            await fetchGachaApi('getStandardPity');

            for (let i = 0; i < a; i++) {
                // Hitung probabilitas berdasarkan standard_pity
                gacha.calculatePityProbabilities();

                // Simulasi gacha
                const result = await gacha.makeWish();
                tenpull[i] = result;
            }

            // Upload semua hasil gacha sekaligus
            if (GachaSystem.itemsToUpload.length > 0) await uploadInventory(GachaSystem.itemsToUpload);
            if (GachaSystem.glamourDust !== 0) await updateGlamourDust(GachaSystem.glamourDust);

            // Reset after the upload
            GachaSystem.itemsToUpload = [];
            GachaSystem.glamourDust = 0;

            // Update standard_pity dan essence di server
            await fetchGachaApi('incPity', {
                incPity: standard_pity,
                type: 'standard',
            });

            const ShimmeringEssence = a.toString();
            await fetchGachaApi('updateEssence', {
                essence: ShimmeringEssence,
                type: 'standard',
            });

            await updateHistory(tenpull);

            return tenpull;
        } catch (error) {
            console.error('Error pulling gacha:', error);
            return [];
        }
    }

    async function updateGlamourDust(amount: number) {
        try {
            await fetchGachaApi('updateGlamourDust', { glamour_dust: amount });
        } catch (error) {
            console.error('Error updating glamour dust:', error);
        }
    }

    async function updateHistory(items: GachaItem[]) {
        try {
            const dataFetch = items.map(item => ({
                rarity: item.rarity,
                item_name: item.item_name,
                part_outfit: item.part_outfit,
                gacha_type: 'Symphony_of_Silk'
            }));
            await fetchGachaApi('batchUpHistory', { items: dataFetch });
        } catch (error) {
            console.error('Error updating history:', error);
        }
    }

    // Fungsi untuk mengunggah hasil gacha ke inventory sekaligus
    async function uploadInventory(items: GachaItem[]) {
        try {
            const dataFetch = items.map(item => ({
                rarity: item.rarity,
                item_name: item.item_name,
                part_outfit: item.part_outfit,
                layer: item.layer,
                gacha_type: 'Symphony_of_Silk',
            }));
            await fetchGachaApi('batchUpInven', { items: dataFetch });
        } catch (error) {
            console.error('Error uploading inventory:', error);
        }
    }

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
                dust:
                    rarity === "SR"
                        ? (isDuplicate ? '+2' : '+1')
                        : (rarity === "SSR"
                            ? (isDuplicate ? '+11' : '+1')
                            : (rarity === "R" ? '+1' : '')),
            };

        }).filter(resource => resource.dust !== '');

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
                    <div className="flex flex-1 lg:pt-10 pt-4 bg-gacha1 bg-cover lg:blur-md blur-sm animate-pulse" />
                    <div className="absolute w-full h-full flex flex-1 bg-gradient-to-b from-transparent via-transparent to-black to-100% z-10" />
                    <div className="absolute w-full h-full flex flex-1 z-20 lg:pt-20 pt-14">
                        <div className="flex flex-1">
                            <div className="relative flex flex-none w-1/3 justify-start p-8">
                                <div className="absolute w-full h-full">
                                    <Image
                                        id="imgbanner"
                                        src={"/banner/avatar/standardA.png"}
                                        alt={"imgbanner"}
                                        fill
                                        objectFit="cover"
                                        objectPosition="top"
                                    />
                                </div>
                            </div>

                            <div className="relative flex flex-auto flex-col lg:gap-4 gap-2">
                                <div className="absolute -right-12 flex items-start justify-start px-12 transform -skew-x-12 bg-gradient-to-r from-transparent via-violet-600 to-violet-600 to-100% bg-opacity-50 transition-opacity duration-1000">
                                    <p className="lg:text-8xl text-5xl text-end font-black transform skew-x-12 text-white pr-12">CELESTIAL MAIDENS</p>
                                </div>

                                {/* transparent div */}
                                <div className="flex items-end justify-end px-12 transform -skew-x-12 bg-transparent">
                                    <p className="lg:text-8xl text-5xl text-end font-black transform skew-x-12 text-transparent pr-12">CELESTIAL MAIDENS</p>
                                </div>
                                {/* transparent div */}

                                <div className="flex flex-none items-start justify-end pr-16">
                                    <p className="text-end lg:text-sm text-[9px] lg:w-5/6 w-full">Dalam sebuah kerajaan yang jauh, para Maid adalah sosok yang sangat dihormati. Mereka dikenal karena kecantikan, keanggunan, dan dedikasi mereka yang tinggi. Dengan kostum yang mencerminkan status sosial mereka, para Maid ini adalah simbol keindahan dan kemewahan. Dapatkan kostum Maid ekslusif dan jadilah bagian dari kisah mereka.</p>
                                </div>
                                <div className="absolute flex flex-auto flex-col gap-8 bottom-0 right-0">
                                    <div className="flex flex-1 items-end justify-end gap-8 pr-16">
                                        <BoxItem imageUrl={"/icons/outfit/A/MaidA.png"} altText={"Maid a"} />
                                        <BoxItem imageUrl={"/icons/outfit/B/MaidB.png"} altText={"Maid b"} />
                                        <BoxItem imageUrl={"/icons/outfit/C/MaidC.png"} altText={"Maid c"} />
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
                                                    style={{ width: `${(userResourceData.standard_pity / 80) * 100}%` }}>
                                                    <p className="text-xs font-semibold font-sans">{userResourceData.standard_pity}</p>
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
                                            <p key={index} className="flex flex-none flex-row gap-1 justify-center items-center text-black w-24 font-bold">
                                                {resource.dust !== '' && (
                                                    <>
                                                        <Image src={"/icons/currency/glamour_dust.png"} alt={"glamour_dust"} width={24} height={24} />
                                                        {resource.dust}
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
                                Tukarkan <span className="text-amber-400">{exchangeAmount * 150} Glamour Gems</span> dengan <span className="text-blue-400">{exchangeAmount} Shimmering Essence</span>?
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