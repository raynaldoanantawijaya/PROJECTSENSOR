"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storageService, User } from '@/lib/storage';
import { authService } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize storage/ensure default users exist
    const init = async () => {
      await storageService.init();
    };
    init();

    // Clear any existing session on login page load
    authService.logout();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting login with:", email);
      // 1. Authenticate with Firebase Auth
      const cred = await authService.login(email, password);
      console.log("Auth success, UID:", cred.uid);

      // 2. Get Profile from Firestore
      console.log("Fetching user profile for email:", email);
      const appUser = await authService.getUserRole(email);
      console.log("Profile result:", appUser);

      if (appUser) {
        const safeUser = { ...appUser };
        localStorage.setItem('currentUser', JSON.stringify(safeUser));
        console.log("Session saved, redirecting in 500ms...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else {
        console.error("User profile NOT found for:", email);
        const allUsers = await storageService.getUsers();
        console.log("DEBUG DATABASE DUMP:", allUsers);
        console.log("DEBUG COMPARISON:");
        allUsers.forEach(u => {
          console.log(`Checking DB User: '${u.email}' vs Input: '${email}' match? ${u.email.toLowerCase() === email.toLowerCase()}`);
        });

        setError("Login berhasil, tapi data profil tidak ditemukan. Cek Console (F12) untuk detail.");
        await authService.logout();
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login process error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Email atau Password salah.");
      } else {
        setError("Gagal Login: " + (err.message || "Unknown error"));
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-screen flex flex-col items-center justify-center p-4">
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        data-alt="Subtle grid dot pattern background"
        style={{
          backgroundImage: "radial-gradient(#324467 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      ></div>
      <div className="absolute top-6 right-6 z-10">
        <Link
          href="/admin"
          className="flex items-center justify-center p-2 text-gray-500 hover:text-primary dark:text-text-secondary dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-surface-dark"
          title="Admin Login"
        >
          <span className="material-symbols-outlined text-[20px]">
            admin_panel_settings
          </span>
        </Link>
      </div>
      <div className="relative w-full max-w-[480px] flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-primary text-[32px]">
              sensors
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight mb-2">
              Monitoring Mesin
            </h1>
            <p className="text-gray-500 dark:text-text-secondary text-sm font-medium">
              System Access Control
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark shadow-xl rounded-xl p-6 sm:p-8 flex flex-col gap-6 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 dark:text-text-secondary">
              Please enter your credentials to access the dashboard.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-500 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div className="flex flex-col gap-2">
              <label
                className="text-gray-700 dark:text-gray-200 text-sm font-medium"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 dark:text-text-secondary material-symbols-outlined text-[20px]">
                  mail
                </span>
                <input
                  className="form-input w-full rounded-lg border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-[#111722] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-text-secondary pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-normal shadow-sm"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label
                  className="text-gray-700 dark:text-gray-200 text-sm font-medium"
                  htmlFor="password"
                >
                  Password
                </label>
              </div>
              <div className="relative flex items-center group">
                <span className="absolute left-4 text-gray-400 dark:text-text-secondary material-symbols-outlined text-[20px]">
                  lock
                </span>
                <input
                  className="form-input w-full rounded-lg border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-[#111722] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-text-secondary pl-11 pr-12 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-normal shadow-sm"
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-3 p-1 rounded hover:bg-gray-200 dark:hover:bg-border-dark text-gray-400 dark:text-text-secondary transition-colors flex items-center justify-center"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  className="form-checkbox rounded border-gray-300 dark:border-border-dark bg-white dark:bg-[#111722] text-primary focus:ring-offset-0 focus:ring-primary/20 w-4 h-4 cursor-pointer"
                  type="checkbox"
                />
                <span className="text-xs text-gray-500 dark:text-text-secondary group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  Remember me
                </span>
              </label>
            </div>
            <button
              className="mt-4 w-full cursor-pointer flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-blue-600 active:bg-blue-700 h-11 px-5 text-white text-sm font-bold tracking-wide transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">
                    login
                  </span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
          <div className="pt-4 border-t border-gray-100 dark:border-border-dark flex justify-center items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-gray-400 dark:text-text-secondary font-mono">
              System Status: Operational
            </span>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 font-normal">
          @ 2026 Monitoring System v1
        </p>
      </div>
    </div>
  );
}
