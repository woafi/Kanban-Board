import { headers } from "next/headers";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AnnotationWorkspace from "@/components/AnnotationWorkspace";

export const metadata: Metadata = {
    title: "Annotate — Kanban",
    description: "Upload images and annotate them with polygon shapes.",
};

export default async function AnnotatePage() {
    const headerStore = await headers();
    const userId = headerStore.get("x-user-id");
    const userEmail = headerStore.get("x-user-email");

    const user = userEmail ? { id: Number(userId), email: userEmail, name: "" } : null;

    return (
        <div className="min-h-screen bg-yellow-400 flex flex-col font-sans text-black">
            <Navbar user={user} />

            <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
                <div className="mb-5 mt-4">
                    <h1 className="text-5xl font-black uppercase tracking-tight mb-1">Annotate</h1>
                    <p className="text-lg font-bold text-black/70">
                        Upload images, draw polygons, save annotations.
                    </p>
                </div>

                <AnnotationWorkspace />
            </main>
        </div>
    );
}
