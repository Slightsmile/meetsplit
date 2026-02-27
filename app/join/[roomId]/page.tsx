"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { joinRoom, getRoomById, isUserMember } from "@/lib/firebase/firestore";
import { RoomData } from "@/types/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PartyPopper } from "lucide-react";

export default function JoinByLinkPage({ params }: { params: { roomId: string } }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [room, setRoom] = useState<RoomData | null>(null);
    const [roomLoading, setRoomLoading] = useState(true);
    const [error, setError] = useState("");

    const roomCode = params.roomId.toUpperCase();

    useEffect(() => {
        async function fetchRoom() {
            try {
                const r = await getRoomById(roomCode);
                setRoom(r);
                // Auto-redirect if user is already a member
                if (r && user) {
                    const isMember = await isUserMember(roomCode, user.uid);
                    if (isMember) {
                        router.replace(`/r/${roomCode}`);
                        return;
                    }
                }
            } catch {
                setRoom(null);
            } finally {
                setRoomLoading(false);
            }
        }
        if (!authLoading) fetchRoom();
    }, [roomCode, user, authLoading, router]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !displayName.trim()) return;

        setIsJoining(true);
        setError("");

        try {
            await joinRoom(roomCode, user.uid, displayName.trim());
            router.push(`/r/${roomCode}`);
        } catch (err: any) {
            if (err?.message === "ROOM_NOT_FOUND") {
                setError("Room not found. Please check the link.");
            } else if (err?.message === "ROOM_LOCKED") {
                setError("This room is locked. No new members can join.");
            } else {
                setError("Failed to join. Please try again.");
            }
            setIsJoining(false);
        }
    };

    if (authLoading || roomLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-50">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-50 p-4">
                <Card className="max-w-md w-full shadow-2xl border-0 ring-1 ring-white/60 rounded-[2rem] bg-white/80 backdrop-blur-2xl">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-2xl">😕</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Room Not Found</h2>
                        <p className="text-sm text-slate-500">
                            The room <span className="font-mono font-bold">{roomCode}</span> doesn&apos;t exist or has been deleted.
                        </p>
                        <Button onClick={() => router.push("/")} className="rounded-2xl">
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
            <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

            <Card className="max-w-md w-full shadow-2xl border-0 ring-1 ring-white/60 rounded-[2rem] bg-white/80 backdrop-blur-2xl relative z-10">
                <CardHeader className="bg-white/50 pb-5 pt-8 border-b border-white/50 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/25">
                        {room.isEventMode ? (
                            <PartyPopper className="w-8 h-8 text-white" />
                        ) : (
                            <Users className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">
                        Welcome to {room.name}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-2">
                        Enter your name to join this room
                    </p>
                    {room.isEventMode && (
                        <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            <PartyPopper className="w-3 h-3" /> Event
                        </span>
                    )}
                </CardHeader>
                <CardContent className="pt-8 px-6 pb-8">
                    <form onSubmit={handleJoin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600 ml-1">Your Name</label>
                            <Input
                                placeholder="Enter your name to join"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="h-14 sm:h-12 rounded-2xl bg-white/50 border-white/60 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all text-lg sm:text-base px-4 shadow-sm"
                                required
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
                        )}
                        <Button
                            type="submit"
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-0.5"
                            disabled={isJoining || !displayName.trim()}
                        >
                            {isJoining ? "Joining..." : "Join Room"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
