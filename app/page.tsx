"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { createRoom, joinRoom } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Receipt, Users } from "lucide-react";

export default function Home() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [roomId, setRoomId] = useState("");
    const [roomName, setRoomName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [joinDisplayName, setJoinDisplayName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const generateCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !roomName || !displayName.trim()) return;

        setIsCreating(true);
        try {
            const newCode = generateCode();
            await createRoom(newCode, roomName, user.uid);
            // Auto join the creator
            await joinRoom(newCode, user.uid, displayName.trim());

            router.push(`/r/${newCode}`);
        } catch (error) {
            console.error("Error creating room:", error);
            alert("Failed to create room. Please check the console or ensure Firestore rules are set.");
            setIsCreating(false);
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !roomId || !joinDisplayName.trim()) return;

        setIsJoining(true);
        try {
            const code = roomId.toUpperCase();
            await joinRoom(code, user.uid, joinDisplayName.trim() || `Guest_${code.substring(0, 3)}`);
            router.push(`/r/${code}`);
        } catch (error: any) {
            console.error("Error joining room:", error);
            if (error?.message === "ROOM_NOT_FOUND") {
                alert("Room not found. Please check the code and try again.");
            } else if (error?.message === "ROOM_LOCKED") {
                alert("This room is locked by the admin. No new members can join.");
            } else {
                alert("Failed to join room. Please check the console or ensure Firestore rules are set.");
            }
            setIsJoining(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

                {/* Hero Section */}
                <div className="space-y-6">
                    <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
                        Friends meet. <br /><span className="text-blue-600">Bills split.</span>
                    </h1>
                    <p className="text-lg text-slate-600">
                        The easiest way to find a date that works for everyone and split the trip expenses without the headache.
                    </p>

                    <div className="flex space-x-6 text-slate-500 pt-4">
                        <div className="flex flex-col items-center"><Users className="w-8 h-8 mb-2 text-blue-500" /><span>No Signup</span></div>
                        <div className="flex flex-col items-center"><Calendar className="w-8 h-8 mb-2 text-purple-500" /><span>Find Dates</span></div>
                        <div className="flex flex-col items-center"><Receipt className="w-8 h-8 mb-2 text-green-500" /><span>Split Bills</span></div>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="space-y-4">
                    <Card className="shadow-lg border-0 ring-1 ring-slate-200">
                        <CardHeader>
                            <CardTitle>Create a Room</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateRoom} className="space-y-4">
                                <Input
                                    placeholder="Your name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                />
                                <Input
                                    placeholder="Trip to Hawaii, Weekend Dinner..."
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    required
                                />
                                <Button type="submit" className="w-full" disabled={isCreating || !displayName.trim()}>
                                    {isCreating ? "Creating..." : "Create New Room"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-300"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">or</span>
                        <div className="flex-grow border-t border-slate-300"></div>
                    </div>

                    <Card className="shadow-md border-0 ring-1 ring-slate-200">
                        <CardContent className="pt-6">
                            <form onSubmit={handleJoinRoom} className="space-y-4">
                                <Input
                                    placeholder="Your name"
                                    value={joinDisplayName}
                                    onChange={(e) => setJoinDisplayName(e.target.value)}
                                    required
                                />
                                <Input
                                    placeholder="Enter 6-digit Room Code"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    maxLength={6}
                                    required
                                    className="uppercase tracking-widest text-center"
                                />
                                <Button type="submit" variant="outline" className="w-full" disabled={isJoining || !joinDisplayName.trim()}>
                                    {isJoining ? "Joining..." : "Join Existing Room"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </main>
    );
}
