"use client";

import { RoomData, RoomMemberData, UserAvailability, ExpenseData, ExpenseParticipantData } from "@/types/firebase";
import { Button } from "../ui/button";
import { Lock, Unlock, Copy, Check, Share2, LinkIcon, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface RoomHeaderProps {
    room: RoomData;
    currentUserId: string;
    members: RoomMemberData[];
    availabilities: UserAvailability[];
    expenses: ExpenseData[];
    expenseParts: ExpenseParticipantData[];
    viewAsGuest?: boolean;
    onToggleViewAsGuest?: () => void;
}

export function RoomHeader({ room, currentUserId, members, availabilities, expenses, expenseParts, viewAsGuest, onToggleViewAsGuest }: RoomHeaderProps) {
    const [sharePanelOpen, setSharePanelOpen] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const isAdmin = room.adminId === currentUserId;

    const inviteLink = typeof window !== "undefined"
        ? `${window.location.origin}/join/${room.roomId}`
        : `/join/${room.roomId}`;

    const handleCopyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(inviteLink);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const toggleLock = async () => {
        if (!isAdmin) return;
        await updateDoc(doc(db, "rooms", room.roomId), {
            isLocked: !room.isLocked
        });
    };

    const handleShareClick = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join ${room.name}`,
                    text: `Join my room "${room.name}" on MeetSplit!`,
                    url: inviteLink,
                });
                return;
            } catch {
                // fall through to panel
            }
        }
        setSharePanelOpen(!sharePanelOpen);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-6">
            <div className="flex justify-between gap-4">
                {/* Left: Branding + Room name + admin icons */}
                <div className="flex flex-col min-w-0 flex-1">
                    <a href="/" className="text-xs font-bold text-violet-600 tracking-wider uppercase hover:text-violet-700 transition-colors w-fit mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
                        MeetSplit
                    </a>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight break-words">
                        {room.name}
                    </h2>
                    {isAdmin && (
                        <div className="flex items-center gap-1 mt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleLock}
                                className={`h-8 px-2 rounded-lg transition-colors shrink-0 ${room.isLocked ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                                title={room.isLocked ? "Room Locked" : "Lock Room"}
                            >
                                {room.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleViewAsGuest}
                                className={`h-8 px-2 rounded-lg transition-colors shrink-0 ${viewAsGuest ? "text-violet-600 bg-violet-50 hover:bg-violet-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                                title={viewAsGuest ? "Viewing as Guest" : "View as Guest"}
                            >
                                {viewAsGuest ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right: Share on top, Code+Copy below */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleShareClick}
                        className="h-9 rounded-xl shadow-md shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all text-xs sm:text-sm px-3 sm:px-5"
                    >
                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                        Share
                    </Button>
                    <div className="flex items-center gap-1.5">
                        <div className="inline-flex items-center bg-slate-100/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] sm:text-xs text-slate-500 font-medium mr-1">Code:</span>
                            <span className="font-mono text-slate-800 font-bold tracking-[0.15em] text-xs sm:text-sm">{room.roomId}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyCode}
                            className="h-7 sm:h-8 px-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            aria-label="Copy room URL"
                        >
                            {codeCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Share panel (shown when share button is clicked on desktop) */}
            {sharePanelOpen && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invite Link</label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 font-mono text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 truncate select-all">
                            {inviteLink}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyInviteLink}
                            className="h-10 px-3 rounded-lg shrink-0"
                            aria-label="Copy invite link"
                        >
                            {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            <span className="ml-1.5 text-xs font-semibold">{linkCopied ? "Copied!" : "Copy"}</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
