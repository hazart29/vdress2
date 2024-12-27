'use client'
import { useRouter } from "next/navigation";
import Image from 'next/image'

export default function MenuButton() {
    const router = useRouter();
    const handleMenu = (menu: any) => {
        if (menu === 'logout') {
            // Clear session token from sessionStorage
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('uid');

            // Redirect to login page
            router.push('/');
        } else if (menu === 'outfit') {
            router.push('/main/outfit');
        } else if (menu === 'shop') {
            router.push('/main/shop');
        } else if (menu === 'gacha_a') {
            router.push('/main/gacha/gacha_a');
        } else if (menu === 'gacha_b') {
            router.push('/main/gacha/gacha_b');
        } else if (menu === 'gameplay') {
            router.push('/main/gameplay');
        }
    }


    return (
        <div className="relative flex flex-1 flex-col justify-end items-center">
            <div className="flex flex-1 flex-col gap-4">
                {/* Tombol Gameplay */}
                {/* <button
                    type="button"
                    onClick={() => handleMenu('gameplay')}
                    className="flex items-center justify-between gap-2 bg-white text-slate-700 font-semibold py-4 px-6 transform -skew-x-12 hover:bg-cyan-300 transition-all duration-100 hover:scale-125 hover:mb-2 ease-in-out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-person-standing-dress" viewBox="0 0 16 16">
                        <path d="M8 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m-.5 12.25V12h1v3.25a.75.75 0 0 0 1.5 0V12h1l-1-5v-.215a.285.285 0 0 1 .56-.078l.793 2.777a.711.711 0 1 0 1.364-.405l-1.065-3.461A3 3 0 0 0 8.784 3.5H7.216a3 3 0 0 0-2.868 2.118L3.283 9.079a.711.711 0 1 0 1.365.405l.793-2.777a.285.285 0 0 1 .56.078V7l-1 5h1v3.25a.75.75 0 0 0 1.5 0Z" />
                    </svg>
                    <p className="flex text-base md:text-4xl">Play Now!</p>
                </button> */}

                {/* Tombol Outfit */}
                <button
                    type="button"
                    onClick={() => handleMenu('outfit')}
                    className="flex items-center justify-between gap-2 bg-white text-slate-700 font-semibold py-4 px-6 transform -skew-x-12 hover:bg-cyan-300 transition-all duration-100 hover:scale-125 hover:mb-2 ease-in-out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-person-standing-dress" viewBox="0 0 16 16">
                        <path d="M8 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m-.5 12.25V12h1v3.25a.75.75 0 0 0 1.5 0V12h1l-1-5v-.215a.285.285 0 0 1 .56-.078l.793 2.777a.711.711 0 1 0 1.364-.405l-1.065-3.461A3 3 0 0 0 8.784 3.5H7.216a3 3 0 0 0-2.868 2.118L3.283 9.079a.711.711 0 1 0 1.365.405l.793-2.777a.285.285 0 0 1 .56.078V7l-1 5h1v3.25a.75.75 0 0 0 1.5 0Z" />
                    </svg>
                    <p className="flex text-base md:text-4xl">Outfit</p>
                </button>

                {/* Tombol Gacha */}
                <div className="flex">
                    <button
                        type="button"
                        onClick={() => handleMenu('gacha_a')}
                        className="flex flex-1 items-center justify-between gap-2 bg-white text-slate-700 font-semibold py-4 px-6 transform -skew-x-12 hover:bg-yellow-300 transition-all duration-100 hover:scale-125 hover:z-50 ease-in-out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-credit-card-2-back-fill" viewBox="0 0 16 16">
                            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5H0zm11.5 1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM0 11v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1z"
                            />
                        </svg>
                        <span className="flex gap-2 md:text-lg text-base">
                            {/*<Image src={'/ui/Genshin_Impact_logo.svg'} height={36} width={100} alt="genshin-logo"/>*/}
                            <p className="">GachaA</p>
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleMenu('gacha_b')}
                        className="flex flex-1 items-center justify-between gap-2 bg-white text-slate-700 font-semibold py-4 px-6 transform -skew-x-12 hover:bg-yellow-300 transition-all duration-100 hover:scale-125 hover:z-50 ease-in-out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-credit-card-2-back-fill" viewBox="0 0 16 16">
                            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5H0zm11.5 1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM0 11v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1z"
                            />
                        </svg>
                        <span className="flex gap-2 md:text-lg text-base">
                            <p className="p-1">GachaB</p>
                        </span>
                    </button>
                </div>

                {/* Tombol Shop */}
                <button
                    type="button"
                    onClick={() => handleMenu('shop')}
                    className="flex items-center justify-between gap-2 bg-white text-slate-700 font-semibold py-4 px-6 transform -skew-x-12 hover:bg-cyan-300 transition-all duration-100 hover:scale-125 hover:mb-2 ease-in-out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-cart-fill" viewBox="0 0 16 16">
                        <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
                    </svg>
                    <p className="md:text-3xl text-base">Shop</p>
                </button>

                {/* Tombol Logout */}
                <button
                    type="button"
                    onClick={() => handleMenu('logout')}
                    className="flex items-center justify-between gap-2 bg-white text-slate-700 font-semibold py-4 px-6 transform -skew-x-12 hover:bg-red-500 transition-all duration-100 hover:scale-125 hover:mt-2 ease-in-out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-door-open-fill" viewBox="0 0 16 16">
                        <path d="M1.5 15a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1H13V2.5A1.5 1.5 0 0 0 11.5 1H11V.5a.5.5 0 0 0-.57-.495l-7 1A.5.5 0 0 0 3 1.5V15zM11 2h.5a.5.5 0 0 1 .5.5V15h-1zm-2.5 8c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1" />
                    </svg>
                    <p className="md:text-4xl text-base">Logout</p>
                </button>
            </div>

        </div>
    );
}