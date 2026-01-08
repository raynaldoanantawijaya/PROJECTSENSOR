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
      </head>
      <body className={`${inter.variable} bg-background-light dark:bg-background-dark font-display antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
