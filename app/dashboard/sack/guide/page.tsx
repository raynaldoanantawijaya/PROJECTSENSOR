"use client";

import Link from "next/link";
import Image from "next/image";

export default function SackGuidePage() {
    return (
        <div className="flex flex-col p-6 md:p-10 gap-6 max-w-[1280px] mx-auto w-full">
            {/* Breadcrumb */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[10px] md:text-sm mb-2 text-[#92a4c9]">
                    <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                    <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                    <Link href="/dashboard/sack" className="hover:text-white transition-colors">Sensor Lebar Karung</Link>
                    <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                    <span className="text-white">Panduan Kalibrasi</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-white text-2xl md:text-3xl font-bold tracking-tight">Panduan Kalibrasi Sensor</h1>
                        <p className="text-[#92a4c9] text-sm mt-1">Ikuti langkah-langkah berikut untuk mengkalibrasi sensor lebar karung</p>
                    </div>
                    <Link
                        href="/dashboard/sack"
                        className="flex items-center gap-2 bg-[#232f48] hover:bg-[#3b4b68] text-white px-4 py-2.5 rounded-lg border border-white/5 transition-all text-sm font-medium"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Kembali
                    </Link>
                </div>
            </div>

            {/* Guide Image Container */}
            <div className="bg-[#192233] rounded-xl border border-[#232f48] shadow-lg overflow-hidden">
                <div className="p-4 border-b border-[#232f48] bg-[#1d273b] flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-400">menu_book</span>
                    <h3 className="text-white font-semibold">Panduan Kalibrasi Sensor Lebar Karung</h3>
                </div>
                <div className="p-4 md:p-6">
                    <div className="relative w-full rounded-lg overflow-hidden bg-[#111722]">
                        <Image
                            src="/images/panduan-kalibrasi.webp"
                            alt="Panduan Kalibrasi Sensor Lebar Karung"
                            width={1920}
                            height={1080}
                            className="w-full h-auto object-contain"
                            priority
                            quality={85}
                        />
                    </div>
                </div>

                {/* Steps Summary (Text version for accessibility) */}
                <div className="px-4 md:px-6 pb-6">
                    <h4 className="text-white font-semibold mb-4 text-sm">Ringkasan Langkah:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { step: 1, title: "Ukur Lebar Karung", desc: "Ukur lebar asli karung dengan penggaris secara manual." },
                            { step: 2, title: "Catat Nilai Pengukuran", desc: "Tulis hasil pengukuran manual di catatan." },
                            { step: 3, title: "Buka Website Monitoring", desc: "Akses website monitoring untuk sensor yang bersangkutan." },
                            { step: 4, title: "Input Target Width", desc: "Masukkan nilai pengukuran ke kolom 'Target Width' untuk kalibrasi." },
                            { step: 5, title: "Tunggu 5 Menit", desc: "Biarkan sensor memproses kalibrasi selama 5 menit." },
                            { step: 6, title: "Verifikasi Akurasi", desc: "Jika belum akurat, ketik target baru dan ulangi langkah 4." },
                        ].map(({ step, title, desc }) => (
                            <div key={step} className="bg-[#232f48]/50 rounded-lg p-3 border border-[#232f48] hover:border-blue-500/30 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="size-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">{step}</span>
                                    <span className="text-white text-sm font-medium">{title}</span>
                                </div>
                                <p className="text-[#92a4c9] text-xs leading-relaxed ml-8">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
