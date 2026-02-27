"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomData } from "@/lib/hooks/useRoomData";
import { BestDateCard } from "@/components/room/BestDateCard";
import { BalancesList } from "@/components/room/BalancesList";
import { calculateBestDates } from "@/lib/utils/calculateBestDate";
import { simplifyDebts } from "@/lib/utils/calculateSplit";
import { updateRoomAnnouncement, removeMember } from "@/lib/firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Calendar, Receipt, Users, Share2, Check, Megaphone, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoomOverview({ params }: { params: { roomId: string } }) {
    const { user } = useAuth();
    const { room, members, availabilities, expenses, expenseParts } = useRoomData(params.roomId);
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    // Announcement state
    const [announcementNotice, setAnnouncementNotice] = useState("");
    const [announcementPlace, setAnnouncementPlace] = useState("");
    const [announcementTime, setAnnouncementTime] = useState("");
    const [announcementMenu, setAnnouncementMenu] = useState("");
    const [announcementLoaded, setAnnouncementLoaded] = useState(false);
    const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

    if (!room || !user) return null;

    // Load announcement data from room on first render
    if (!announcementLoaded && room.announcement) {
        setAnnouncementNotice(room.announcement.notice || "");
        setAnnouncementPlace(room.announcement.place || "");
        setAnnouncementTime(room.announcement.time || "");
        setAnnouncementMenu(room.announcement.menu || "");
        setAnnouncementLoaded(true);
    } else if (!announcementLoaded) {
        setAnnouncementLoaded(true);
    }

    const isAdmin = room.adminId === user.uid;
    const memberIds = members.map(m => m.userId);
    const bestDates = calculateBestDates(availabilities, memberIds);
    const simplifiedDebts = simplifyDebts(expenses, expenseParts);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const perPersonAvg = members.length > 0 ? totalExpenses / members.length : 0;

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: room.currency }).format(amount);

    const getMemberName = (userId: string) =>
        members.find(m => m.userId === userId)?.displayName || "Unknown";

    const handleSaveAnnouncement = async () => {
        setIsSavingAnnouncement(true);
        await updateRoomAnnouncement(params.roomId, {
            notice: announcementNotice,
            place: announcementPlace,
            time: announcementTime,
            menu: announcementMenu,
        });
        setIsSavingAnnouncement(false);
    };

    const buildShareText = () => {
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

    // ─── Members View (replaces overview content) ───
    if (showMembers) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowMembers(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h2 className="text-xl font-semibold text-slate-900">Members ({members.length})</h2>
                </div>
                <div className="space-y-3">
                    {members.map(m => (
                        <div key={m.userId} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                {m.displayName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-slate-900">{m.displayName}</div>
                                <div className="text-xs text-slate-500">
                                    Joined {format(new Date(m.joinedAt), "MMM do, yyyy")}
                                </div>
                            </div>
                            {m.userId === room.adminId && (
                                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">Admin</span>
                            )}
                            {isAdmin && room.isLocked && m.userId !== room.adminId && (
                                <button
                                    onClick={async () => {
                                        if (confirm(`Remove ${m.displayName} from this room?`)) {
                                            await removeMember(params.roomId, m.userId);
                                        }
                                    }}
                                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Remove member"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ─── Main Overview ───
    return (
        <div className="space-y-6">
            {/* Header with Share */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
                    <p className="text-sm text-slate-500 mt-1">Dates, expenses, and settlements at a glance</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleShare}>
                    {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Share2 className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Share"}
                </Button>
            </div>

            {/* Announcement Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-orange-500" />
                        Announcement
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isAdmin ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Notice / Announcement</label>
                                <Input
                                    placeholder="e.g. We're meeting this Saturday!"
                                    value={announcementNotice}
                                    onChange={(e) => setAnnouncementNotice(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Place / Link</label>
                                    <Input
                                        placeholder="e.g. Café Mocha, or a Google Maps link"
                                        value={announcementPlace}
                                        onChange={(e) => setAnnouncementPlace(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Time</label>
                                    <Input
                                        placeholder="e.g. 7:00 PM"
                                        value={announcementTime}
                                        onChange={(e) => setAnnouncementTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Menu / Food Item</label>
                                <Input
                                    placeholder="e.g. Pizza, BBQ, Buffet..."
                                    value={announcementMenu}
                                    onChange={(e) => setAnnouncementMenu(e.target.value)}
                                />
                            </div>
                            <Button size="sm" onClick={handleSaveAnnouncement} disabled={isSavingAnnouncement}>
                                {isSavingAnnouncement ? "Saving..." : "Save Announcement"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {room.announcement?.notice ? (
                                <>
                                    <p className="text-sm text-slate-900 font-medium">{room.announcement.notice}</p>
                                    {room.announcement.place && (
                                        <p className="text-sm text-slate-600">
                                            <span className="text-slate-400">Place:</span>{" "}
                                            {room.announcement.place.startsWith("http") ? (
                                                <a href={room.announcement.place} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                                    {room.announcement.place}
                                                </a>
                                            ) : room.announcement.place}
                                        </p>
                                    )}
                                    {room.announcement.time && (
                                        <p className="text-sm text-slate-600"><span className="text-slate-400">Time:</span> {room.announcement.time}</p>
                                    )}
                                    {room.announcement.menu && (
                                        <p className="text-sm text-slate-600"><span className="text-slate-400">Menu:</span> {room.announcement.menu}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No announcements yet.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats row — clickable */}
            <div className="grid grid-cols-3 gap-3">
                <Card
                    className="bg-blue-50 border-blue-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowMembers(true)}
                >
                    <CardContent className="p-4 text-center">
                        <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-slate-900">{members.length}</div>
                        <div className="text-xs text-slate-500">Members</div>
                    </CardContent>
                </Card>
                <Card
                    className="bg-purple-50 border-purple-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/r/${params.roomId}/availability`)}
                >
                    <CardContent className="p-4 text-center">
                        <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-slate-900">{bestDates.length}</div>
                        <div className="text-xs text-slate-500">Date Options</div>
                    </CardContent>
                </Card>
                <Card
                    className="bg-green-50 border-green-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/r/${params.roomId}/split`)}
                >
                    <CardContent className="p-4 text-center">
                        <Receipt className="w-5 h-5 text-green-500 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-slate-900">{formatMoney(totalExpenses)}</div>
                        <div className="text-xs text-slate-500">Total Spent</div>
                    </CardContent>
                </Card>
            </div>

            {/* Best Date */}
            <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Best Date</h3>
                <BestDateCard dates={bestDates} members={members} />
            </section>

            {/* Per-person cost */}
            {expenses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-green-500" />
                            Per-Person Estimated Cost
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 mb-4">{formatMoney(perPersonAvg)}</div>
                        <div className="space-y-2">
                            {expenses.map(exp => {
                                const payer = getMemberName(exp.paidByUserId);
                                return (
                                    <div key={exp.expenseId} className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                                        <div>
                                            <span className="font-medium text-slate-900">{exp.description}</span>
                                            <span className="text-slate-400 ml-2">paid by {payer}</span>
                                        </div>
                                        <span className="font-medium text-slate-900">{formatMoney(exp.totalAmount)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Final Balances / Who Owes Whom */}
            <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Who Owes Whom</h3>
                <BalancesList debts={simplifiedDebts} members={members} currency={room.currency} />
            </section>
        </div>
    );
}
