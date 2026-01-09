import Link from "next/link";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 dark:border-border-dark bg-white dark:bg-background-dark shrink-0 z-20 relative">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">analytics</span>
                </div>
                <h1 className="text-xs sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    Sensor Monitoring System
                </h1>
            </div>
            <div className="flex items-center gap-4">

                <Link
                    href="/"
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    title="Logout"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                </Link>
            </div>
        </header>
    );
}
