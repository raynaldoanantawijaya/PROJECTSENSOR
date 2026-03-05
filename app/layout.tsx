import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Sensor Monitoring System",
  description: "Industrial Machine Sensor Monitoring Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect for fastest possible font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* 
          Material Symbols — loaded from Google CDN (woff2 optimized, ~200-300KB).
          display=block prevents FOUT (Flash of Unstyled Text).
          Much faster than old 3.8 MB local file.
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
        />
      </head>
      <body className={`${inter.variable} bg-background-light dark:bg-background-dark font-display antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
