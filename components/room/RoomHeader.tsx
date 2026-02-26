"use client";

import { RoomData } from "@/types/firebase";
import { Button } from "../ui/button";
import { Lock, Unlock, Copy, Check } from "lucide-react";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function RoomHeader({ room, currentUserId }: { room: RoomData, currentUserId: string }) {
    const [copied, setCopied] = useState(false);
    const isAdmin = room.adminId === currentUserId;

    const handleCopy = () => {
        navigator.clipboard.writeText(`${window.location.origin}/r/${room.roomId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleLock = async () => {
        if (!isAdmin) return;
        await updateDoc(doc(db, "rooms", room.roomId), {
            isLocked: !room.isLocked
        });
    };

    return (
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{room.name}</h1>
                <div className="flex items-center mt-2 space-x-2">
                    <span className="text-sm font-medium px-2 py-1 bg-slate-100 rounded text-slate-700">
                        Code: {room.roomId}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-slate-500 hover:text-slate-900">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        <span className="ml-2 text-xs">{copied ? "Copied" : "Copy Link"}</span>
                    </Button>
                </div>
            </div>

            {isAdmin && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleLock}
                    className={room.isLocked ? "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100" : ""}
                >
                    {room.isLocked ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                    {room.isLocked ? "Room Locked" : "Lock Room"}
                </Button>
            )}
        </div>
    );
}
