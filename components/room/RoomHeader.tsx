"use client";

import { RoomData, RoomMemberData, UserAvailability, ExpenseData, ExpenseParticipantData } from "@/types/firebase";
import { Button } from "../ui/button";
import { Lock, Unlock, Copy, Check, Share2, LinkIcon } from "lucide-react";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { calculateBestDates } from "@/lib/utils/calculateBestDate";
import { simplifyDebts } from "@/lib/utils/calculateSplit";
import { format } from "date-fns";

interface RoomHeaderProps {
    room: RoomData;
    currentUserId: string;
    members: RoomMemberData[];
    availabilities: UserAvailability[];
    expenses: ExpenseData[];
    expenseParts: ExpenseParticipantData[];
}

export function RoomHeader({ room, currentUserId, members, availabilities, expenses, expenseParts }: RoomHeaderProps) {
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [inviteCopied, setInviteCopied] = useState(false);
    const isAdmin = room.adminId === currentUserId;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/r/${room.roomId}`);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleCopyInviteLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/join/${room.roomId}`);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2000);
    };

    const toggleLock = async () => {
        if (!isAdmin) return;
        await updateDoc(doc(db, "rooms", room.roomId), {
            isLocked: !room.isLocked
        });
    };

    const buildShareText = () => {
        const bestDates = calculateBestDates(availabilities, members.map(m => m.userId));
        const simplifiedDebts = simplifyDebts(expenses, expenseParts);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
        const perPersonAvg = members.length > 0 ? totalExpenses / members.length : 0;

        const formatMoney = (amount: number) =>
            new Intl.NumberFormat("en-US", { style: "currency", currency: room.currency }).format(amount);

        const getMemberName = (userId: string) =>
            members.find(m => m.userId === userId)?.displayName || "Unknown";

        let text = `--- ${room.name} Summary ---\n`;
        text += `Room Code: ${room.roomId}\n`;
        text += `Members: ${members.map(m => m.displayName).join(", ")}\n\n`;

        if (room.announcement?.notice) {
            text += `Announcement: ${room.announcement.notice}\n`;
            if (room.announcement.place) text += `Place: ${room.announcement.place}\n`;
            if (room.announcement.time) text += `Time: ${room.announcement.time}\n`;
            if (room.announcement.menu) text += `Menu: ${room.announcement.menu}\n`;
            text += "\n";
        }

        if (bestDates.length > 0) {
            const best = bestDates[0];
            const isPerfect = best.availableCount === members.length;
            text += `Best Date: ${format(new Date(best.date), "EEEE, MMMM do, yyyy")}`;
            text += ` (${best.availableCount}/${members.length} free)`;
            if (isPerfect) text += " - Perfect match!";
            text += "\n";
            if (bestDates.length > 1) {
                text += "Runner-ups: " + bestDates.slice(1, 4).map(d =>
                    `${format(new Date(d.date), "MMM do")} (${d.availableCount}/${members.length})`
                ).join(", ") + "\n";
            }
            text += "\n";
        }

        if (expenses.length > 0) {
            text += `Total Expenses: ${formatMoney(totalExpenses)}\n`;
            text += `Per Person (avg): ${formatMoney(perPersonAvg)}\n\n`;

            if (simplifiedDebts.length > 0) {
                text += "Settlements:\n";
                simplifiedDebts.forEach(d => {
                    text += `  ${getMemberName(d.fromUser)} -> ${getMemberName(d.toUser)}: ${formatMoney(d.amount)}\n`;
                });
            } else {
                text += "All settled up!\n";
            }
        }

        return text;
    };

    const handleShare = async () => {
        const text = buildShareText();
        if (navigator.share) {
            try {
                await navigator.share({ title: `${room.name} Summary`, text });
                return;
            } catch {
                // fall through to clipboard
            }
        }
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex-1">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">{room.name}</h2>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleLock}
                            className={`h-8 px-2 rounded-lg transition-colors ${room.isLocked ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                            title={room.isLocked ? "Room Locked" : "Lock Room"}
                        >
                            {room.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                    )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center bg-slate-100/80 px-4 py-1.5 rounded-full border border-slate-200 whitespace-nowrap">
                        <span className="text-sm text-slate-500 font-medium mr-2">Code:</span>
                        <span className="font-mono text-slate-800 font-bold tracking-[0.15em]">{room.roomId}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCopyLink} className="h-8 px-3 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                        {linkCopied ? <Check className="w-4 h-4 text-green-500 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                        <span className="text-xs font-semibold">{linkCopied ? "Copied" : "Copy Link"}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCopyInviteLink} className="h-8 px-3 rounded-full text-violet-500 hover:text-violet-800 hover:bg-violet-50">
                        {inviteCopied ? <Check className="w-4 h-4 text-green-500 mr-1.5" /> : <LinkIcon className="w-4 h-4 mr-1.5" />}
                        <span className="text-xs font-semibold">{inviteCopied ? "Copied" : "Invite Link"}</span>
                    </Button>
                </div>
            </div>
            <Button variant="default" size="lg" onClick={handleShare} className="w-full sm:w-auto h-14 sm:h-auto rounded-2xl shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all">
                {copied ? <Check className="w-5 h-5 mr-2 text-white" /> : <Share2 className="w-5 h-5 mr-2" />}
                {copied ? "Copied!" : "Share Summary"}
            </Button>
        </div>
    );
}
