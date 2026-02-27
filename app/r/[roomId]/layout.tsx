"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomData } from "@/lib/hooks/useRoomData";
import { RoomHeader } from "@/components/room/RoomHeader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { HelpToggle } from "@/components/room/HelpToggle";

export default function RoomLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { roomId: string };
}) {
    const { user, loading: authLoading } = useAuth();
    const { room, members, availabilities, expenses, expenseParts, loading: roomLoading } = useRoomData(params.roomId);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!authLoading && !user) return;
        if (!roomLoading && !room) {
            router.push("/");
        }
    }, [user, room, authLoading, roomLoading, router]);

    if (authLoading || roomLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500 animate-pulse">Loading room...</p>
            </div>
        );
    }

    if (!room || !user) return null;

    const isAdmin = room.adminId === user.uid;
    const isEventMode = room.isEventMode ?? false;

    const allTabs = [
        { name: "Overview", href: `/r/${params.roomId}` },
        { name: "Availability", href: `/r/${params.roomId}/availability` },
        { name: "Expenses", href: `/r/${params.roomId}/split` },
    ];

    // In event mode, non-admins only see Overview
    const tabs = isEventMode && !isAdmin
        ? allTabs.filter(t => t.name === "Overview")
        : allTabs;

    const currentHelpPage = pathname.endsWith("/availability")
        ? "availability" as const
        : pathname.endsWith("/split")
            ? "expenses" as const
            : "overview" as const;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                <RoomHeader
                    room={room}
                    currentUserId={user.uid}
                    members={members}
                    availabilities={availabilities}
                    expenses={expenses}
                    expenseParts={expenseParts}
                />

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

            <HelpToggle currentPage={currentHelpPage} />
        </div>
    );
}
