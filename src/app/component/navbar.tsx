'use client'

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    const router = useRouter()
    return (
        <nav className="flex h-full w-full select-none gap-4 items-center p-2">
            {navigatiunRoute.map((singleRoute) => {
                return (
                    <NavigationLink
                        href={`/${singleRoute.href}`}
                        btn={singleRoute.btn}
                        router={router}
                        key={singleRoute.href}
                    />
                )
            })}
        </nav>
    )
}

function NavigationLink({
    href, btn, router,
}: Readonly<{
    href: any;
    btn: any;
    router: any;
}>) {
    const isActive = usePathname()
    return (
        <Link href={href} passHref className="flex flex-1 h-full p-1" legacyBehavior>
            <a
                className={`relative flex-1 w-full h-full p-1 rounded-lg ${isActive === href ? 'hover:bg-blue-300 bg-blue-400 focus:bg-blue-400' : ''} hover:bg-blue-300 focus:bg-blue-400`}
            >
                <Image src={btn} alt='menu' className='flex h-12 p-2' fill priority/>
            </a>
        </Link>
    )
}

const navigatiunRoute = [
    {
        href: "main",
        asPath: "main",
        btn: "/ui/btn_home.svg"
    },
    {
        href: "main/outfit",
        asPath: "main/outfit",
        btn: "/ui/btn_outfit.svg"
    },
    {
        href: "main/gacha",
        asPath: "main/gacha",
        btn: "/ui/btn_gacha.svg"
    },
    {
        href: "main/room",
        asPath: "room",
        btn: "/ui/btn_room.svg"
    },
]