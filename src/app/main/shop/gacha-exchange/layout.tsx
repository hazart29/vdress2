"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const ShopLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (pathname === '/main/shop/gacha-exchange/token-exchange') {
      setActiveTab(1);
    } else if (pathname === '/main/shop/gacha-exchange/glamour-dust-exchange') {
      setActiveTab(2);
    } else if (pathname === '/main/shop/gacha-exchange/gems-exchange') {
      setActiveTab(3);
    }
  }, [pathname]);

  const tabClasses = "relative w-full p-4 font-semibold transition-colors duration-200 rounded-md";
  const activeTabClasses = "bg-gradient-to-r from-[#c77dff] to-[#80ffea] border-slate-800 border-2 shadow-md text-slate-800";
  const nonActiveTabClasses = "text-gray-300 hover:text-[#80ffea] border border-white border-2 hover:border-[#80ffea]";

  return (
    <div className="relative flex flex-col flex-1 h-full">
      <div className="flex flex-1 flex-col items-center justify-center w-full h-full">
        {/* Tab Navigation */}
        <nav className="relative z-10 w-2/3 my-10 px-8 py-4">
          <ul className="flex flex-1 gap-4 justify-center drop-shadow-md shadow-black">
            <li>
              <Link href="/main/shop/gacha-exchange/token-exchange">
                <button
                  onClick={() => setActiveTab(1)}
                  className={tabClasses + (activeTab === 1 ? ` ${activeTabClasses}` : ` ${nonActiveTabClasses}`)}
                >
                  Token Exchange
                </button>
              </Link>
            </li>
            <li>
              <Link href="/main/shop/gacha-exchange/glamour-dust-exchange">
                <button
                  onClick={() => setActiveTab(2)}
                  className={tabClasses + (activeTab === 2 ? ` ${activeTabClasses}` : ` ${nonActiveTabClasses}`)}
                >
                  Dust Exchange
                </button>
              </Link>
            </li>
            <li>
              <Link href="/main/shop/gacha-exchange/gems-exchange">
                <button
                  onClick={() => setActiveTab(3)}
                  className={tabClasses + (activeTab === 3 ? ` ${activeTabClasses}` : ` ${nonActiveTabClasses}`)}
                >
                  Gems Exchange
                </button>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="container relative z-10 flex flex-1 mx-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ShopLayout;