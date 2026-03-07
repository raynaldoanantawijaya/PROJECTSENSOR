"use client";

export default function DashboardLoadingSpinner({ message = "Memuat data..." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            {/* Nested spinning rings */}
            <div className="relative flex items-center justify-center">
                {/* Outer ring */}
                <div className="absolute size-16 rounded-full border-[3px] border-transparent border-t-blue-500 border-r-blue-500/30 animate-spin" />
                {/* Middle ring - counter-rotate */}
                <div className="absolute size-11 rounded-full border-[3px] border-transparent border-b-cyan-400 border-l-cyan-400/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                {/* Inner pulse dot */}
                <div className="size-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
            </div>
            {/* Label */}
            <p className="text-sm font-medium text-slate-400 animate-pulse tracking-wide">{message}</p>
        </div>
    );
}
