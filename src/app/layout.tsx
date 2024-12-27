import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const APP_NAME = "V-DRESS";
const APP_DEFAULT_TITLE = "Virtual Dressing";
const APP_TITLE_TEMPLATE = "%s - VDress";
const APP_DESCRIPTION = "Your Virtual Dressing Girl";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

// export const metadata: Metadata = {
//   title: "V-DRESS",
//   description: "Your Virtual Dressing Girl",
//   icons: [
//     {
//       url: "/favicon.ico",
//       sizes: "32x32",
//       type: "image/png",
//     },
//   ],
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <link crossOrigin="use-credentials" rel="manifest" href="/manifest.json" />
      <body contextMenu="return false" className={inter.className}>
        <div className='relative select-none h-screen bg-gradient-to-br from-blue-500 to-purple-500 flex flex-1 flex-col items-center justify-center overflow-hidden'>
          <div className="absolute inset-0 flex items-center justify-center z-50">
            {children}
          </div>
          <div id="bg1" className="absolute inset-0 flex items-center justify-center z-20">
            {/* <div className="bg-white opacity-30 rounded-full h-96 w-96"></div> */}
          </div>
          <div id="bg2" className="absolute inset-0 flex items-center justify-center z-10">
            {/* <div className="bg-white opacity-10 rounded-full h-64 w-64"></div> */}
          </div>
          <div id="bg3" className="absolute inset-0 flex items-center justify-center z-10"/>
        </div>

      </body>
    </html>
  );
}
