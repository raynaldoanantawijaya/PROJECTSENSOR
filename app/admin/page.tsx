"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { storageService } from '@/lib/storage';
import { authService } from '@/lib/auth';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const init = async () => {
            await storageService.init();
        };
        init();
        authService.logout();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Client-side Login to get ID Token
            const user = await authService.login(email, password);
            const idToken = await user.getIdToken();

            // 2. Server-side Session Creation
            const { loginAdminAction } = await import('@/app/actions/auth-actions');
            const result = await loginAdminAction(idToken);

            if (result.success) {
                // Success! Cookie is set.
                router.replace('/admin/dashboard');
            } else {
                setError(result.error || 'Login failed');
                await authService.logout();
                setLoading(false);
            }
        } catch (err: any) {
            setError('Login failed: ' + (err.message || err));
            setLoading(false);
        }
    };

    const handleRecalibrate = async () => {
        if (!confirm("Ini akan mereset data permission user ke default untuk email Anda. Lanjutkan?")) return;
        setLoading(true);
        // Hardcode the fresh data to ensure it matches
        const admins = [
            {
                id: 'fGM7wOByclYlH6N5NWScXH6DmGW2',
                username: 'Admin Ananta',
                email: 'anantawijaya212@gmail.com',
                role: 'admin' as const,
                permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: true }
            },
            {
                id: 'dVKWBE0kemPISxO8FsAgRegT76E3',
                username: 'User 1',
                email: 'user@gmail.com',
                role: 'user' as const,
                permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: false }
            }
        ];

        try {
            for (const u of admins) {
                await storageService.saveUser(u);
            }
            alert("Database Firestore berhasil disinkronkan dengan Akun Firebase Auth! Silakan Login kembali.");
        } catch (e) {
            alert("Gagal sinkronisasi: " + e);
        }
        setLoading(false);
    };

    return (
        <div className="bg-slate-50 dark:bg-[#101622] font-display min-h-screen flex flex-col items-center justify-center p-4 relative">
            <Link
                href="/"
                className="absolute top-6 left-6 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors flex items-center gap-2 group"
            >
                <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                <span className="text-sm font-medium">Back to User</span>
            </Link>

            <div
                className="fixed inset-0 z-0 opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 0%, #135bec 0%, transparent 60%)' }}
            ></div>

            <div className="relative z-10 w-full max-w-[480px]">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                        <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white mb-2">Khusus Admin</h1>
                    <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                        <p className="text-base font-medium text-slate-500 dark:text-[#92a4c9]">Admin Access Portal</p>
                    </div>
                </div>

                <div className="flex flex-col rounded-xl bg-white dark:bg-[#192233] shadow-2xl border border-slate-200 dark:border-[#324467] overflow-hidden">
                    <div className="h-1.5 w-full bg-primary"></div>
                    <div className="p-8 flex flex-col gap-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-500 text-sm font-medium">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleLogin} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium leading-normal text-[#111418] dark:text-white" htmlFor="email">
                                    Admin Email
                                </label>
                                <div className="group flex w-full items-stretch rounded-lg border border-slate-200 dark:border-[#324467] bg-slate-100 dark:bg-[#232d42] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
                                    <input
                                        className="flex-1 bg-transparent px-4 py-3.5 text-base text-[#111418] dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#637588] focus:outline-none"
                                        id="email"
                                        placeholder="admin@example.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-normal text-[#111418] dark:text-white" htmlFor="password">
                                        Password
                                    </label>
                                </div>
                                <div className="group flex w-full items-stretch rounded-lg border border-slate-200 dark:border-[#324467] bg-slate-100 dark:bg-[#232d42] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
                                    <input
                                        className="flex-1 bg-transparent px-4 py-3.5 text-base text-[#111418] dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#637588] focus:outline-none"
                                        id="password"
                                        placeholder="••••••••"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full rounded-lg bg-primary py-3.5 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-blue-600 hover:shadow-primary/40 focus:ring-4 focus:ring-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                                        Authenticating...
                                    </>
                                ) : (
                                    'Masuk Dashboard'
                                )}
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={handleRecalibrate} className="text-xs text-slate-400 hover:text-primary transition-colors underline">
                                    Sinkronkan Database (Klik jika Login Gagal)
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="bg-slate-100 dark:bg-[#111722] py-3 px-8 border-t border-slate-200 dark:border-[#324467] flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-green-500">lock</span>
                        <p className="text-xs text-slate-500 dark:text-[#92a4c9] font-medium">256-bit End-to-End Encryption</p>
                    </div>
                </div>
                <p className="mt-8 text-center text-xs text-slate-500 dark:text-[#92a4c9]/60">
                    @ 2026 Create by Van Helsing
                </p>
            </div>
        </div>
    );
}
