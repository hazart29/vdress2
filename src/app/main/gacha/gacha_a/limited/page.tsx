'use client'
import React, { useEffect, useState, useMemo, useCallback } from "react"
import Image from "next/image"
import dynamic from 'next/dynamic';
import { Users, GachaItem } from "@/app/interface";
import ErrorAlert from "@/app/component/ErrorAlert";
import sjcl from 'sjcl';
import { useRefresh } from "@/app/component/RefreshContext";
import Loading from "@/app/component/Loading";


// --- Constants (Good Practice: Keep these at the top) ---
const PASSWORD = 'virtualdressing';  // Use a strong password!
const BASE_SSR_PROBABILITY = 0.0075;
const BASE_SR_PROBABILITY = 0.01;
const CONSOLIDATED_SSR_PROBABILITY = 0.02;
const CONSOLIDATED_SR_PROBABILITY = 0.12;
const SOFT_PITY = 60;
const HARD_PITY = 80;
const SSR_DUPLICATE_TOKENS = 10;
const SR_DUPLICATE_TOKENS = 2;
const SSR_NEW_ITEM_TOKENS = 1;
const SR_NEW_ITEM_TOKENS = 1;
const ESSENCE_TO_GEMS_RATIO = 150;
const ACTIVE_TAB = 'limited';

interface ResourceInfo {
    tokens: string;
}

// --- Dynamically Imported Components (Critical for Code Splitting) ---
// Only load these components when they are actually needed.  This is a HUGE performance win.
const DynamicBoxItem = dynamic(() => import("@/app/component/gacha/BoxItem"), { ssr: false });
const DynamicGachaButton = dynamic(() => import("@/app/component/gacha/GachaButton"), { ssr: false, });
const DynamicModal = dynamic(() => import('@/app/component/modal'), { ssr: false });
// No need Dynamic for LimitedImage, because LimitedImage is very small component

// --- Helper Function: Optimized Random Number Generator ---
function createCombinedRNG(seed: number) {
    let state = seed;

    const mcrng = () => {
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        state = (a * state + c) % m;
        return state / m;
    };

    const xorshift32 = () => {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        return state;
    };

    return () => {
        const mcrngOutput = mcrng();
        return ((xorshift32() ^ mcrngOutput) >>> 0) / 2 ** 32;
    };
}

// --- Centralized API Function (with Retries and Error Handling) ---
async function fetchGachaApi<T>(typeFetch: string, dataFetch?: any, retries = 3): Promise<T> {
    const uid = localStorage.getItem('uid');
    if (!uid) {
        throw new Error('UID not found in localStorage'); // Clear error if no UID
    }

    const requestBody = {
        uid,
        typeFetch,
        ...(dataFetch || {}) // Efficiently merge dataFetch
    };

    const encryptedData = sjcl.encrypt(PASSWORD, JSON.stringify(requestBody));

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch('/api/gacha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ encryptedData }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Network response not ok (status ${response.status}): ${errorText}`); // More informative error
            }

            const responseData = await response.json();
            return responseData as T; // Type assertion
        } catch (error: any) {
            console.error(`Error fetching (attempt ${i + 1}):`, error);
            if (i === retries - 1) {
                throw error; // Re-throw the error on the last attempt
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (2 ** i))); // Exponential backoff
        }
    }
    throw new Error('Fetch retries exceeded'); // Should never reach here, but good practice
}

// --- Gacha System Class (Optimized) ---
class GachaSystem {
    private random: () => number;
    private srPity: number = 0;
    public itemsToUpload: GachaItem[] = [];  // Public, but we'll manage it carefully
    public fashionToken: number = 0;        // Public, but we'll manage it carefully

    constructor(seed: number, private isRateUp: boolean, private pity: number, private localGachaData: GachaItem[]) {
        this.random = createCombinedRNG(seed); // Use the optimized RNG
    }

    private calculateProbabilities() {
        const pityProgress = this.pity / SOFT_PITY;
        const probabilitySSRNow = this.pity >= HARD_PITY ? 1 :
            this.pity >= SOFT_PITY ? CONSOLIDATED_SSR_PROBABILITY + (1 - CONSOLIDATED_SSR_PROBABILITY) * (1 - Math.exp(-5 * (this.pity - SOFT_PITY) / (HARD_PITY - SOFT_PITY))) :
                BASE_SSR_PROBABILITY + (CONSOLIDATED_SSR_PROBABILITY - BASE_SSR_PROBABILITY) * pityProgress;

        const probabilitySRNow = this.srPity >= 9 ? 1 : BASE_SR_PROBABILITY + (CONSOLIDATED_SR_PROBABILITY - BASE_SR_PROBABILITY) * (this.srPity / 9);
        return { probabilitySSRNow, probabilitySRNow };
    }

    private calculateRarity() {
        const { probabilitySSRNow, probabilitySRNow } = this.calculateProbabilities();
        const rand = this.random();
        if (rand < probabilitySSRNow || this.pity + 1 >= HARD_PITY) return "SSR";
        if (rand < probabilitySRNow || (this.srPity + 1) % 10 === 0) return "SR";
        return "R";
    }

    private async pullItem(rarity: string): Promise<GachaItem | null> {
        let availableItems = this.localGachaData.filter(item => item.rarity === rarity);

        if ((rarity === "SSR" || rarity === "SR")) {
            const rateUpItems = availableItems.filter(item => item.rate_up);
            const rateOffItems = availableItems.filter(item => !item.rate_up);
            availableItems = this.isRateUp ? rateUpItems : (this.random() < 0.5 ? rateOffItems : rateUpItems);
            if (!availableItems.length) availableItems = this.localGachaData.filter(item => item.rarity === rarity);
        }

        const randomItem = availableItems[Math.floor(this.random() * availableItems.length)];
        return randomItem;

    }

    private isDuplicateItem(item: GachaItem, inventory: GachaItem[]): boolean {
        return inventory.some(inventoryItem => inventoryItem.item_name === item.item_name);
    }

    private handleDuplicate(item: GachaItem) {
        const tokens = item.rarity === "SSR" ? SSR_DUPLICATE_TOKENS : (item.rarity === "SR" ? SR_DUPLICATE_TOKENS : 0);
        this.fashionToken += tokens;
    }


    private resetSSR() { this.pity = 0; }
    private resetSR() { this.srPity = this.srPity % 10; }  // Correctly resets SR pity
    private incrementPity() { this.pity += 1; this.srPity += 1; }

    // --- Public API of the Gacha System ---

    public async makeWish(inventory: GachaItem[]): Promise<GachaItem | null> {
        const rarity = this.calculateRarity();
        const pulledItem = await this.pullItem(rarity);

        if (!pulledItem) {
            return null; // Handle the case where no item could be pulled
        }

        const isDuplicate = this.isDuplicateItem(pulledItem, inventory);

        if (!isDuplicate) {
            this.itemsToUpload.push(pulledItem);
            this.fashionToken += rarity === "SSR" ? SSR_NEW_ITEM_TOKENS : (rarity === "SR" ? SR_NEW_ITEM_TOKENS : 0);
        } else {
            this.handleDuplicate(pulledItem);
        }

        if (rarity === "SSR") {
            this.isRateUp = !pulledItem.islimited; //check rate up, limited gacha
            this.resetSSR();
        } else if (rarity === "SR") {
            this.incrementPity();
            this.resetSR();
        } else {
            this.incrementPity();
        }

        return pulledItem;
    }
    public getPity(): number {
        return this.pity;
    }
    public getIsRateUp(): boolean {
        return this.isRateUp;
    }
}


const Limited_A = () => {
    const [userData, setUserData] = useState<Users | null>(null);
    const [pulledItems, setPulledItems] = useState<GachaItem[]>([]); // Store pulled items
    const [resourceInfo, setResourceInfo] = useState<ResourceInfo[]>([]);
    const [localGachaData, setLocalGachaData] = useState<GachaItem[]>([]); // Keep track of all gacha items
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInsufficientModalOpen, setIsInsufficientModalOpen] = useState(false);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [exchangeAmount, setExchangeAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);  // Single loading state
    const { refresh } = useRefresh();

    // --- Memoized Gacha System ---
    const gachaSystem = useMemo(() => {
        if (userData && localGachaData.length > 0) {
            // Initialize with current pity and rate up status from userData
            return new GachaSystem(Date.now(), !!userData.user_resources[0]?.is_rate, userData.user_resources[0]?.pity, localGachaData);
        }
        return null;
    }, [userData, localGachaData]);


    // --- useCallback for Event Handlers (Prevent Unnecessary Re-renders) ---

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setPulledItems([]); // Clear pulled items when closing
        setResourceInfo([]);
        refresh();  // Trigger a refresh to update user data
    }, [refresh]);

    const closeInsufficientModal = useCallback(() => {
        setIsInsufficientModalOpen(false);
    }, []);

    // --- useEffect for Initial Data Fetching (Optimized) ---

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch user data and gacha items *concurrently* (faster!)
                const [userDataResult, gachaItemsResult]: any = await Promise.all([
                    fetchGachaApi<Users>("getUserData"),
                    fetchGachaApi("getAllGachaItems"),
                ]);
                setUserData(userDataResult);
                setLocalGachaData(gachaItemsResult.gachaItem); // Store gacha items
            } catch (error) {
                console.error('Error fetching initial data:', error);
                // Consider showing an error message to the user.
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [refresh]); // Re-fetch when 'refresh' changes (from your context)

    // --- Helper Functions (for cleaner code) ---

    const performPull = async (pullCount: number): Promise<GachaItem[]> => {
        if (!gachaSystem) return []; // Don't attempt to pull if gachaSystem isn't ready
        let newPulledItems: GachaItem[] = [];

        const inventory: any = userData?.inventory || []; // Get inventory *once*

        for (let i = 0; i < pullCount; i++) {
            const item = await gachaSystem.makeWish(inventory);
            if (item) {
                newPulledItems.push(item);
            }
        }

        // Batch updates (all at once)
        if (gachaSystem.itemsToUpload.length > 0) await uploadInventory(gachaSystem.itemsToUpload);
        if (gachaSystem.fashionToken !== 0) await updateFashionToken(gachaSystem.fashionToken);

        await fetchGachaApi('incPity', { incPity: gachaSystem.getPity(), type: 'limited' });
        await fetchGachaApi('updateEssence', { essence: pullCount.toString(), type: 'limited' });
        await updateHistory(newPulledItems);

        // Reset gacha system variables *after* API calls
        gachaSystem.itemsToUpload = [];
        gachaSystem.fashionToken = 0;

        return newPulledItems;
    };


    const openModal = async (pullCount: number) => {
        if (!userData?.user_resources?.length) {
            console.error('User data or user resources not available');
            return;
        }

        const essenceCost = pullCount;
        const gemsNeeded = essenceCost * ESSENCE_TO_GEMS_RATIO;

        if (userData.user_resources[0].glimmering_essence < essenceCost) {
            if (userData.user_resources[0].glamour_gems < gemsNeeded) {
                setIsInsufficientModalOpen(true); // Show "not enough gems" modal
                return;
            }
            setShowExchangeModal(true); // Show exchange modal
            setExchangeAmount(essenceCost);
            return;
        }
        // If enough essence, proceed with the pull
        setIsLoading(true);
        try {
            const newPulledItems = await performPull(pullCount); // Use helper function
            setPulledItems(newPulledItems);
            if (userData && localGachaData.length > 0) { //verify if user data is exist
                listGacha(newPulledItems) //list gacha
            }

            setIsModalOpen(true); // Show results modal
        } catch (error) {
            console.error("Error during gacha pull:", error);
            // Consider showing an error message to the user.
        } finally {
            setIsLoading(false);
        }
    };


    // --- Gem Exchange Handler ---
    const handleExchange = async () => {
        setIsLoading(true); // Show loading indicator
        try {
            await fetchGachaApi('exchangeGemsForEssence', {
                type: 'glimmering_essence',
                glamour_gems: (exchangeAmount * ESSENCE_TO_GEMS_RATIO).toString(),
                glimmering_essence: exchangeAmount.toString()
            });
            setShowExchangeModal(false); // Hide exchange modal

            // Refresh user data *after* successful exchange
            const userDataResult = await fetchGachaApi<Users>("getUserData");
            setUserData(userDataResult);

            // *Then* open the modal to perform the pull
            openModal(exchangeAmount);

        } catch (error) {
            console.error('Error exchanging gems:', error);
            // Consider showing an error message to the user
        } finally {
            setIsLoading(false); // Hide loading indicator
        }
    };

    // --- API Update Functions (Batching is Key) ---

    async function updateHistory(items: GachaItem[]) {
        if (items.length === 0) return; // Don't update if no items
        try {
            const dataFetch = items.map(item => ({
                rarity: item.rarity,
                item_name: item.item_name,
                part_outfit: item.part_outfit,
                gacha_type: 'Whispers_of_Silk'
            }));
            await fetchGachaApi('batchUpHistory', { items: dataFetch });
        } catch (error) {
            console.error('Error updating history:', error);
        }
    }

    async function updateFashionToken(amount: number) {
        if (amount === 0) return; // Don't update if amount is zero
        try {
            await fetchGachaApi('updateFashionTokens', { fashion_tokens: amount });
        } catch (error) {
            console.error('Error updating fashion tokens:', error);
        }
    }

    async function uploadInventory(items: GachaItem[]) {
        if (items.length === 0) return; // Don't upload if no items
        try {
            const dataFetch = items.map(item => ({
                rarity: item.rarity,
                item_name: item.item_name,
                part_outfit: item.part_outfit,
                layer: item.layer,
                stat: item.stat,
                power: item.power,
                gacha_type: 'Whisper_of_Silk',
            }));
            await fetchGachaApi('batchUpInven', { items: dataFetch });
        } catch (error) {
            console.error('Error uploading inventory:', error);
        }
    }

    const sortPulledItems = useCallback((pulledItems: GachaItem[]) => {
        return [...pulledItems].sort((a, b) => {
            const rarityOrder = { "R": 0, "SR": 1, "SSR": 2 };
            return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
        });
    }, []);

    const listGacha = useCallback(async (tenpull: GachaItem[]) => {
        const sortedTenpull = sortPulledItems(tenpull);
        setPulledItems(sortedTenpull);

        const currentInventory = userData?.inventory || [];
        const newResourceInfo = tenpull.map((item) => {
            const rarity = item.rarity.trim();
            const isDuplicate = currentInventory.some((inventoryItem: { item_name: any; }) => inventoryItem.item_name === item.item_name);

            return {
                tokens:
                    rarity === "SR"
                        ? (isDuplicate ? '+2' : '+1')
                        : (rarity === "SSR"
                            ? (isDuplicate ? '+11' : '+1')
                            : (rarity === "R" ? '+1' : '')),
            };
        }).filter(resource => resource.tokens !== '');

        setResourceInfo(newResourceInfo);
    }, [userData?.inventory, sortPulledItems]);


    return (
        <>
            {isLoading && (
                <Loading />
            )}
            {!isLoading && ( // Render content only if isLoading is false
                <>
                    {/* Main Background and Overlay */}
                    {/* Optimize: Use next/image for background, preload, and responsive sizes. */}
                    <div className="relative flex flex-1 lg:pt-10 pt-4  lg:blur-md blur-sm animate-pulse">
                        <Image
                            src="/banner/limited/gacha1.webp" // Replace with the correct path and WebP format!
                            alt="Gacha Background"
                            layout="fill"
                            objectFit="cover"
                            objectPosition="center"
                            priority // Important for LCP!
                            placeholder="blur"
                        />
                    </div>
                    <div className="absolute w-full h-full flex flex-1 pt-10 bg-gradient-to-b from-transparent via-transparent to-black to-100% z-10" />

                    {/* Main Content Container */}
                    <div className="absolute w-full h-full flex flex-1 z-20 lg:pt-20 pt-14">
                        <div className="flex flex-1">
                            <div className="relative flex flex-none w-1/3 justify-start p-8">
                                {/* Removed LimitedImage - handle background with next/image above */}
                                <div className="absolute w-full h-full">
                                    <Image
                                        id="MikoImg"
                                        src={"/banner/avatar/limitedA.png"}
                                        alt={"Miko"}
                                        layout="fill"
                                        objectFit="contain"
                                        objectPosition="bottom"
                                        className="scale-110"
                                        priority
                                    />
                                </div>
                            </div>

                            <div className="relative flex flex-auto flex-col lg:gap-4 gap-2">
                                {/* Title */}
                                <div className="absolute -right-12 flex items-start justify-start px-12 transform -skew-x-12 bg-gradient-to-r from-transparent via-red-600 to-red-600 to-100% bg-opacity-50 transition-opacity duration-1000">
                                    <p className="lg:text-8xl text-end text-5xl font-black transform skew-x-12 text-white pr-12">JAPANESE MIKO</p>
                                </div>

                                {/* Transparent divs (consider removing if they don't serve a purpose) */}
                                <div className="flex items-end justify-end px-12 transform -skew-x-12 bg-transparent">
                                    <p className="lg:text-8xl text-5xl font-black transform skew-x-12 text-transparent pr-12">JAPANESE MIKO</p>
                                </div>

                                {/* Description */}
                                <div className="flex flex-none items-start justify-end pr-16">
                                    <p className="text-end lg:text-sm text-[9px] lg:w-5/6 w-full">Rasakan keagungan kuil dengan gacha Miko terbaru! Dapatkan kostum gadis kuil yang cantik dengan jubah putih bersih dan rok merah menyala, lengkap dengan aksesoris seperti gohei dan ofuda. Raih kesempatan untuk memanggil roh keberuntungan dan keindahan! Jangan lewatkan kesempatan langka ini, tersedia untuk waktu terbatas!</p>
                                </div>

                                {/* Content (BoxItems, GachaButton, Pity Bar) */}
                                <div className="absolute flex flex-auto flex-col gap-8 bottom-0 right-0">
                                    <div className="flex flex-1 items-end justify-end gap-8 pr-16">
                                        <DynamicBoxItem imageUrl={"/icons/outfit/A/MikoA.png"} altText={"Miko a"} />
                                        <DynamicBoxItem imageUrl={"/icons/outfit/B/MikoB.png"} altText={"Miko b"} />
                                        <DynamicBoxItem imageUrl={"/icons/outfit/C/MikoC.png"} altText={"Miko c"} />
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
                                            {/*  pity data show */}
                                            {userData && (
                                                <div
                                                    className="flex flex-none justify-end items-center bg-blue-500 px-2"
                                                    style={{ width: `${(userData.user_resources[0].pity / HARD_PITY) * 100}%` }}>
                                                    <p className="text-xs font-semibold font-sans">{userData.user_resources[0].pity}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-none flex-col gap-4 pr-16 pb-10 justify-center">
                                        <DynamicGachaButton onClick={openModal} activeTab={ACTIVE_TAB} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Modals (Dynamically Imported) --- */}
                    <DynamicModal isOpen={isModalOpen} onClose={closeModal}>
                        <div className="relative w-full h-full flex flex-1 flex-col items-center justify-center">
                            <div className="flex flex-1 flex-col w-full h-full justify-between bg-white p-8">
                                <div className="flex flex-1 flex-col flex-wrap gap-2 items-center justify-center">

                                    <div id="diDapat" className="flex flex-none flex-row w-full justify-center items-center gap-1 animate-pulse">
                                        {pulledItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className={`
                                               ${item.rarity.trim() === "SSR" ? 'bg-gradient-to-b from-transparent from-0% via-amber-500 via-50% to-transparent to-100%' :
                                                        item.rarity.trim() === "SR" ? 'bg-gradient-to-b from-transparent from-0% via-purple-800 via-50% to-transparent to-100%' :
                                                            'bg-gradient-to-b from-transparent from-0% via-gray-400 via-50% to-transparent to-100%'}
                                               h-32 flex items-center justify-center overflow-hidden opacity-0 p-1 transition-all duration-500 scale-0`}
                                                style={{ animationDelay: `${index * 0.2}s` }}
                                                onAnimationEnd={(e) => {
                                                    // On animation end, set opacity to 100 and scale
                                                    (e.target as HTMLDivElement).classList.add('opacity-100', 'scale-100');
                                                }}
                                            >
                                                <img
                                                    src={`/icons/outfit/${item.layer.toLocaleUpperCase()}/${item.item_name}.png`}
                                                    alt={item.item_name}
                                                    className={`w-24 h-24 object-cover `}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div id="addResource" className="flex flex-none flex-row w-full justify-center items-center gap-1 animate-pulse text-[8px]">
                                        {resourceInfo.length > 0 && resourceInfo.map((resource, index) => (
                                            <p key={index} className="flex flex-none flex-row gap-1 justify-center items-center text-black w-24 font-bold">
                                                {resource.tokens !== '' && (
                                                    <>
                                                        <Image src={"/icons/currency/fashion_tokens.png"} alt={"fashion_tokens"} width={12} height={12} priority />
                                                        {resource.tokens}
                                                    </>
                                                )}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        aria-label="close button"
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 focus:outline-none font-bold text-2xl text-gray-400 animate-pulse"
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>

                        </div>
                    </DynamicModal>

                    <DynamicModal isOpen={isInsufficientModalOpen} onClose={closeInsufficientModal}>
                        <div className="p-4 flex flex-col flex-none w-2/5 justify-center items-center bg-white rounded-lg py-8">
                            <p className="text-black">Glamour Gems tidak cukup!</p>
                            <div className="flex justify-end mt-4">
                                <button
                                    aria-label="close button"
                                    type="button"
                                    onClick={closeInsufficientModal}
                                    className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </DynamicModal>

                    <DynamicModal isOpen={showExchangeModal} onClose={() => setShowExchangeModal(false)}>
                        <div className="p-4 flex flex-col flex-none w-2/5 justify-center items-center bg-white rounded-lg py-8">
                            <p className="text-black mb-4 text-center">
                                Glimmering Essence tidak cukup! <br />
                                Tukarkan <span className="text-amber-400">{exchangeAmount * ESSENCE_TO_GEMS_RATIO} Glamour Gems</span> dengan <span className="text-blue-400">{exchangeAmount} Glimmering Essence</span>?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    aria-label="confirm exchange button"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    onClick={handleExchange}

                                >
                                    Ya, Tukar
                                </button>
                                <button
                                    aria-label="cancel exchange button"
                                    className="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                                    onClick={() => setShowExchangeModal(false)}
                                >
                                    Tidak
                                </button>
                            </div>
                        </div>
                    </DynamicModal>
                </>
            )}
        </>
    )
}
export default Limited_A