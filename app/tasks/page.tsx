import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import DateSelector from "@/components/DateSelector";
import Board from "@/components/Board";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Board — Kanban",
    description: "Manage your tasks by date with a visual Kanban board.",
};

export default async function TaskPage() {
    const headerStore = await headers();
    const userId = headerStore.get('x-user-id');
    const userEmail = headerStore.get('x-user-email');

    const user = userEmail ? { id: Number(userId), email: userEmail, name: "" } : null;

    return (
        <div className="min-h-screen bg-yellow-400 flex flex-col font-sans text-black">
            <Navbar user={user} />

            <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
                {/* Page heading */}
                <div className="mb-6 mt-4">
                    <h1 className="text-5xl font-black uppercase tracking-tight mb-1">My Board</h1>
                    <p className="text-lg font-bold text-black/70">Pick a day, manage your tasks.</p>
                </div>

                {/* Date picker — decoupled from board data */}
                <DateSelector />

                {/* Kanban columns */}
                <Board />
            </main>
        </div>
    );
}