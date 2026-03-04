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
        {/* Material Symbols — reduced axes + display=swap for instant rendering */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
        {/* Hide icon text until font is loaded */}
        <style dangerouslySetInnerHTML={{
          __html: `
          .material-symbols-outlined {
            font-size: 24px;
            visibility: hidden;
          }
          .fonts-loaded .material-symbols-outlined {
            visibility: visible;
          }
        `}} />
        <script dangerouslySetInnerHTML={{
          __html: `
          if (document.fonts) {
            document.fonts.load('24px "Material Symbols Outlined"').then(function() {
              document.documentElement.classList.add('fonts-loaded');
            }).catch(function() {
              document.documentElement.classList.add('fonts-loaded');
            });
            // Fallback: show after 2s max regardless
            setTimeout(function() { document.documentElement.classList.add('fonts-loaded'); }, 2000);
          } else {
            document.documentElement.classList.add('fonts-loaded');
          }
        `}} />
      </head>
      <body className={`${inter.variable} bg-background-light dark:bg-background-dark font-display antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
