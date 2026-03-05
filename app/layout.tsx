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
          Material Symbols — SUBSETTED to only the ~40 icons used in this app.
          This reduces the font from 3.8 MB → ~15-20 KB.
          display=block prevents FOUT (Flash of Unstyled Text).
        */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=add,admin_panel_settings,analytics,arrow_back,aspect_ratio,badge,bolt,check_circle,chevron_right,close,dashboard,delete,delete_sweep,description,description_off,devices,download,edit,electric_meter,electrical_services,error,error_outline,group,history,lock,logout,manage_search,menu,offline_bolt,person,refresh,remove,search,sensors,settings,settings_applications,speed,straighten,texture,trending_up,visibility,visibility_off,warning,waves,wifi&display=block"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=add,admin_panel_settings,analytics,arrow_back,aspect_ratio,badge,bolt,check_circle,chevron_right,close,dashboard,delete,delete_sweep,description,description_off,devices,download,edit,electric_meter,electrical_services,error,error_outline,group,history,lock,logout,manage_search,menu,offline_bolt,person,refresh,remove,search,sensors,settings,settings_applications,speed,straighten,texture,trending_up,visibility,visibility_off,warning,waves,wifi&display=block"
        />
      </head>
      <body className={`${inter.variable} bg-background-light dark:bg-background-dark font-display antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
