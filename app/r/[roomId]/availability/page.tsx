"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomData } from "@/lib/hooks/useRoomData";
import { AvailabilityCalendar } from "@/components/room/AvailabilityCalendar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AvailabilityPage({ params }: { params: { roomId: string } }) {
    const { user } = useAuth();
    const { room, availabilities } = useRoomData(params.roomId);
    const router = useRouter();

    const isEventMode = room?.isEventMode ?? false;
    const isAdmin = room && user ? room.adminId === user.uid : false;

    useEffect(() => {
        if (room && user && isEventMode && !isAdmin) {
            router.replace(`/r/${params.roomId}`);
        }
    }, [room, user, isEventMode, isAdmin, router, params.roomId]);

    if (!room || !user) return null;
    if (isEventMode && !isAdmin) return null;

    const myAvailability = availabilities.find(a => a.userId === user.uid);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-slate-900">When are you free?</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Select all the dates that work for you. We&apos;ll automatically find the best overlap.
                </p>
            </div>

            <AvailabilityCalendar
                roomId={params.roomId}
                userId={user.uid}
                myAvailability={myAvailability}
            />
        </div>
    );
}
