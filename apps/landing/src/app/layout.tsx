import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/constants/BRAND";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  'Create, animate, and publish 2D games directly from your browser. Powerful sprite editor, AI-assisted asset generation, and one-click deployment to Vercel.';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.SITE_URL),
  title: `${BRAND.FULL_NAME} - Build 2D Games in Your Browser`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${BRAND.FULL_NAME} - Build 2D Games in Your Browser`,
    description: SITE_DESCRIPTION,
    siteName: BRAND.FULL_NAME,
    url: BRAND.SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
