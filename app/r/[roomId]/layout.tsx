"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomData } from "@/lib/hooks/useRoomData";
import { RoomHeader } from "@/components/room/RoomHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { HelpToggle } from "@/components/room/HelpToggle";
import { Eye } from "lucide-react";
import { ViewAsGuestProvider } from "@/lib/hooks/useViewAsGuest";

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
    const [viewAsGuest, setViewAsGuest] = useState(false);

    // Check membership and redirect non-members to join page
    const isMember = user ? members.some(m => m.userId === user.uid) : false;

    useEffect(() => {
        if (authLoading || roomLoading) return;
        if (!room) {
            router.push("/");
            return;
        }
        // If user is signed in but not a member, redirect to join page
        if (user && !members.some(m => m.userId === user.uid)) {
            router.replace(`/join/${params.roomId}`);
        }
    }, [user, room, members, authLoading, roomLoading, router, params.roomId]);

    const isAdmin = room ? room.adminId === user?.uid : false;
    const isEventMode = room?.isEventMode ?? false;

    // Redirect to overview if currently on a restricted tab in guest view
    useEffect(() => {
        if (viewAsGuest && isEventMode && pathname !== `/r/${params.roomId}`) {
            router.push(`/r/${params.roomId}`);
        }
    }, [viewAsGuest, isEventMode, pathname, params.roomId, router]);

    if (authLoading || roomLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500 animate-pulse">Loading room...</p>
            </div>
        );
    }

    if (!room || !user || !isMember) return null;

    const allTabs = [
        { name: "Overview", href: `/r/${params.roomId}` },
        { name: "Meet", href: `/r/${params.roomId}/availability` },
        { name: "Split", href: `/r/${params.roomId}/split` },
    ];

    // In event mode, non-admins (or admin in guest view) only see Overview
    const tabs = isEventMode && (!isAdmin || viewAsGuest)
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
                    viewAsGuest={viewAsGuest}
                    onToggleViewAsGuest={() => setViewAsGuest(v => !v)}
                />

                {viewAsGuest && (
                    <div className="flex items-center justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 rounded-full text-xs font-semibold border border-violet-200">
                            <Eye className="w-3.5 h-3.5" />
                            Viewing as Guest
                        </div>
                    </div>
                )}

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

                <ViewAsGuestProvider value={{ viewAsGuest }}>
                    <main className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-h-[500px]">
                        {children}
                    </main>
                </ViewAsGuestProvider>
            </div>

            <HelpToggle currentPage={currentHelpPage} />
        </div>
    );
}
