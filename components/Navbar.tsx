"use client"

import { useRouter } from "next/navigation";
import axios from "@/api/axios";
import Link from "next/link";
import type { User } from "@/types";

interface NavbarProps {
    user?: User | null;
}

export default function Navbar({ user }: NavbarProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await axios.post("/api/auth/logout/");
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <nav className="w-full bg-pink-300 border-b-4 border-black text-black font-sans shadow-[0_4px_0_0_rgba(0,0,0,1)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-3xl font-black uppercase tracking-tight hover:bg-black hover:text-pink-300 px-4 py-2 border-4 border-black bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all inline-block">
                            ⚡ KANBAN
                        </Link>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center space-x-6">
                        {/* Nav links (only when logged in) */}
                        {user && (
                            <div className="hidden md:flex items-center gap-3">
                                <Link href="/tasks" className="font-black uppercase border-4 border-black px-3 py-1.5 bg-white hover:bg-black hover:text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-sm">
                                    📋 Board
                                </Link>
                                <Link href="/annotate" className="font-black uppercase border-4 border-black px-3 py-1.5 bg-cyan-200 hover:bg-black hover:text-cyan-300 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-sm">
                                    🖊️ Annotate
                                </Link>
                            </div>
                        )}
                        {user ? (
                            <>
                                <div className="hidden sm:block border-4 border-black bg-yellow-200 px-4 py-2 font-bold text-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                    👤 {user.email}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-400 text-lg font-black uppercase border-4 border-black px-5 py-2 hover:translate-y-1 hover:translate-x-1 hover:shadow-none shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
                                >
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="bg-green-400 text-lg font-black uppercase border-4 border-black px-5 py-2 hover:translate-y-1 hover:translate-x-1 hover:shadow-none shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all inline-block cursor-pointer"
                            >
                                Log In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}