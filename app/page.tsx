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
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-50">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-50 flex flex-col relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply border-none pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply border-none pointer-events-none"></div>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 w-full z-10 xl:pt-16">
                <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center relative">

                    {/* Hero Section */}
                    <div className="space-y-8">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                            Friends meet. <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">Bills split.</span>
                        </h1>
                        <p className="text-lg text-slate-600">
                            The easiest way to find a date that works for everyone and split the trip expenses without the headache.
                        </p>

                        <div className="flex space-x-8 text-slate-600 pt-6">
                            <div className="flex flex-col items-center group"><div className="p-3 bg-blue-100/50 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Users className="w-7 h-7 text-blue-600" /></div><span className="text-sm font-medium">No Signup</span></div>
                            <div className="flex flex-col items-center group"><div className="p-3 bg-purple-100/50 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Calendar className="w-7 h-7 text-purple-600" /></div><span className="text-sm font-medium">Find Dates</span></div>
                            <div className="flex flex-col items-center group"><div className="p-3 bg-emerald-100/50 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Receipt className="w-7 h-7 text-emerald-600" /></div><span className="text-sm font-medium">Split Bills</span></div>
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div className="space-y-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-300 to-violet-300 blur-3xl opacity-30 rounded-full -z-10 transform scale-105"></div>
                        <Card className="shadow-2xl shadow-blue-900/5 border-0 ring-1 ring-white/60 rounded-[2rem] bg-white/80 backdrop-blur-2xl overflow-hidden">
                            <CardHeader className="bg-white/50 pb-5 pt-8 border-b border-white/50 text-center">
                                <CardTitle className="text-2xl font-bold text-slate-800">Create a Room</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 px-6 pb-8">
                                <form onSubmit={handleCreateRoom} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-600 ml-1">Your Name</label>
                                        <Input
                                            placeholder="e.g. Alex"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="h-14 sm:h-12 rounded-2xl bg-white/50 border-white/60 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all text-lg sm:text-base px-4 shadow-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-600 ml-1">Room Name</label>
                                        <Input
                                            placeholder="e.g. Weekend Trip, Friday Dinner..."
                                            value={roomName}
                                            onChange={(e) => setRoomName(e.target.value)}
                                            className="h-14 sm:h-12 rounded-2xl bg-white/50 border-white/60 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all text-lg sm:text-base px-4 shadow-sm"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-0.5" disabled={isCreating || !displayName.trim()}>
                                        {isCreating ? "Creating..." : "Create New Room"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="relative flex py-4 items-center">
                            <div className="flex-grow border-t border-slate-200/60"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-bold tracking-widest uppercase">Or</span>
                            <div className="flex-grow border-t border-slate-200/60"></div>
                        </div>

                        <Card className="shadow-2xl shadow-blue-900/5 border-0 ring-1 ring-white/60 rounded-[2rem] bg-white/80 backdrop-blur-2xl">
                            <CardContent className="pt-8 px-6 pb-8">
                                <form onSubmit={handleJoinRoom} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-600 ml-1">Your Name</label>
                                        <Input
                                            placeholder="e.g. Sam"
                                            value={joinDisplayName}
                                            onChange={(e) => setJoinDisplayName(e.target.value)}
                                            className="h-14 sm:h-12 rounded-2xl bg-white/50 border-white/60 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all text-lg sm:text-base px-4 shadow-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-600 ml-1">Room Code</label>
                                        <Input
                                            placeholder="6-DIGIT CODE"
                                            value={roomId}
                                            onChange={(e) => setRoomId(e.target.value)}
                                            maxLength={6}
                                            required
                                            className="h-14 sm:h-12 text-xl sm:text-lg uppercase tracking-[0.25em] font-bold text-center rounded-2xl bg-white/50 border-white/60 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:tracking-normal placeholder:font-normal shadow-sm"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-0.5" disabled={isJoining || !joinDisplayName.trim()}>
                                        {isJoining ? "Joining..." : "Join Existing Room"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer / Tribute */}
            <footer className="w-full py-8 text-center z-20 mt-auto relative">
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm font-medium relative z-10 px-4">
                    <p className="flex items-center gap-1.5 text-slate-500">
                        <span className="text-slate-400">Crafted with 💜 by</span>
                        <a href="https://mohi-uddin.me/" target="_blank" rel="noopener noreferrer" className="text-violet-600 font-bold hover:text-violet-700 hover:scale-105 transition-all drop-shadow-sm px-1">
                            Slightsmile
                        </a>
                    </p>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <a href="/faq" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors bg-white/50 hover:bg-white/80 px-4 py-1.5 rounded-full border border-white shadow-sm">
                        FAQ & Help
                    </a>
                </div>
            </footer>
        </main >
    );
}
