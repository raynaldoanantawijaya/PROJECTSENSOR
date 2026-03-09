"use client";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex-1 flex items-center justify-center min-h-[50vh] bg-[#101622]">
            <div className="text-center space-y-4 p-8 bg-[#192233] rounded-xl border border-red-500/20 max-w-md">
                <div className="flex justify-center">
                    <span className="material-symbols-outlined text-4xl text-red-400">error</span>
                </div>
                <h2 className="text-xl font-bold text-white">Terjadi Kesalahan</h2>
                <p className="text-sm text-slate-400">{error.message || "Halaman admin gagal dimuat."}</p>
                <button
                    onClick={reset}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                    Coba Lagi
                </button>
            </div>
        </div>
    );
}
