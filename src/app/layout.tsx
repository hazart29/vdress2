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
        <div className="lg:text-md text-xs select-none h-screen bg-gradient-to-br from-blue-500 to-purple-500 flex flex-col items-center justify-center overflow-hidden">
          <div className="relative flex flex-1 aspect-video bg-contain bg-center w-full max-h-min">
            <div id="bg3" className="absolute inset-0 flex items-center justify-center z-10" />
            <div className="flex flex-1 object-contain items-center justify-center z-20">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
