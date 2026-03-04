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
        {/* Preconnect for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols — reduced axes + display=block to guarantee NO text flash */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block" />

        {/* Anti text-flash (FOUT) mechanism for slow connections */}
        <style dangerouslySetInnerHTML={{
          __html: `
          .material-symbols-outlined {
            color: transparent !important;
            display: inline-block;
            width: 1em;
            height: 1em;
            overflow: hidden;
            white-space: nowrap;
          }
          .fonts-loaded .material-symbols-outlined {
            color: inherit !important;
            width: auto;
            height: auto;
            overflow: visible;
          }
        `}} />
        <script dangerouslySetInnerHTML={{
          __html: `
          if ('fonts' in document) {
            document.fonts.ready.then(function() {
              document.documentElement.classList.add('fonts-loaded');
            });
            // Absolute fallback (3s max)
            setTimeout(function() { document.documentElement.classList.add('fonts-loaded'); }, 3000);
          } else {
            document.documentElement.classList.add('fonts-loaded');
          }
        `}} />
      </head>
      <body className={`${inter.variable} bg-background-light dark:bg-background-dark font-display antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
