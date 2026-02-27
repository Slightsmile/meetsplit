"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomData } from "@/lib/hooks/useRoomData";
import { RoomHeader } from "@/components/room/RoomHeader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export default function RoomLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { roomId: string };
}) {
    const { user, loading: authLoading } = useAuth();
    const { room, members, loading: roomLoading } = useRoomData(params.roomId);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!authLoading && !user) return;
        if (!roomLoading && !room) {
            router.push("/");
        }
    }, [user, room, authLoading, roomLoading, router]);

    if (authLoading || roomLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Room...</div>;
    }

    if (!room || !user) return null;

    const tabs = [
        { name: "Overview", href: `/r/${params.roomId}` },
        { name: "Availability", href: `/r/${params.roomId}/availability` },
        { name: "Expenses", href: `/r/${params.roomId}/split` },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                <RoomHeader room={room} currentUserId={user.uid} />

                <div className="flex items-center justify-center">
                    <nav className="flex space-x-2 bg-white p-1 rounded-lg border border-slate-200">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href;
                            return (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-slate-100 text-slate-900"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <main className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-h-[500px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
