"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomData } from "@/lib/hooks/useRoomData";
import { BestDateCard } from "@/components/room/BestDateCard";
import { BalancesList } from "@/components/room/BalancesList";
import { calculateBestDates } from "@/lib/utils/calculateBestDate";
import { simplifyDebts } from "@/lib/utils/calculateSplit";
import { updateRoomAnnouncement, removeMember, toggleEventMode, setEventDate } from "@/lib/firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Calendar, Receipt, Users, Share2, Check, Megaphone, Trash2, PartyPopper } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useViewAsGuest } from "@/lib/hooks/useViewAsGuest";

export default function RoomOverview({ params }: { params: { roomId: string } }) {
    const { user } = useAuth();
    const { room, members, availabilities, expenses, expenseParts, roomPayments } = useRoomData(params.roomId);
    const router = useRouter();
    const [showMembers, setShowMembers] = useState(false);
    const { viewAsGuest } = useViewAsGuest();

    // Announcement state
    const [announcementNotice, setAnnouncementNotice] = useState("");
    const [announcementPlace, setAnnouncementPlace] = useState("");
    const [announcementTime, setAnnouncementTime] = useState("");
    const [announcementMenu, setAnnouncementMenu] = useState("");
    const [announcementLoaded, setAnnouncementLoaded] = useState(false);
    const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
    const [eventDateValue, setEventDateValue] = useState("");
    const [eventDateLoaded, setEventDateLoaded] = useState(false);

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

    // Load event date
    if (!eventDateLoaded && room.eventDate) {
        setEventDateValue(room.eventDate);
        setEventDateLoaded(true);
    } else if (!eventDateLoaded) {
        setEventDateLoaded(true);
    }

    const isAdmin = viewAsGuest ? false : room.adminId === user.uid;
    const isEventMode = room.isEventMode ?? false;
    const memberIds = members.map(m => m.userId);
    const bestDates = calculateBestDates(availabilities, memberIds);
    const simplifiedDebts = simplifyDebts(expenses, expenseParts, roomPayments);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const perPersonAvg = members.length > 0 ? totalExpenses / members.length : 0;

    const formatMoney = (amount: number) => formatCurrency(amount, room.currency);

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

    const handleToggleEventMode = async () => {
        await toggleEventMode(params.roomId, !isEventMode);
    };

    const handleSetEventDate = async (date: string) => {
        setEventDateValue(date);
        await setEventDate(params.roomId, date);
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
                            <div className="w-10 h-10 rounded-full bg-split-100 text-split-700 flex items-center justify-center font-bold text-sm">
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
        <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-24 sm:pb-12 px-4 sm:px-0 pt-4">
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
                            <Button size="sm" onClick={handleSaveAnnouncement} disabled={isSavingAnnouncement} className="bg-gradient-to-r from-[#004b7f] to-[#1b9ae0] hover:opacity-90 text-white border-0 shadow-md shadow-blue-500/20">
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
                                                <a href={room.announcement.place} target="_blank" rel="noopener noreferrer" className="text-split-600 underline">
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

            {/* Event Mode Toggle (admin only) */}
            {isAdmin && (
                <Card className={isEventMode ? "border-amber-200 bg-amber-50/50" : ""}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <PartyPopper className={`w-5 h-5 ${isEventMode ? "text-amber-600" : "text-slate-400"}`} />
                            <div>
                                <p className="font-medium text-slate-900">Event Mode</p>
                                <p className="text-xs text-slate-500">
                                    {isEventMode
                                        ? "Members only see the announcement. You pick the date."
                                        : "Turn on to hide availability & expenses for members."}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleEventMode}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEventMode ? "bg-amber-500" : "bg-slate-300"}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEventMode ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                    </CardContent>
                </Card>
            )}

            {/* Event Date (admin sets, members see) */}
            {isEventMode && (
                <Card className="border-purple-200 bg-purple-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            Event Date
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isAdmin ? (
                            <div className="space-y-2">
                                <Input
                                    type="date"
                                    value={eventDateValue}
                                    onChange={(e) => handleSetEventDate(e.target.value)}
                                    className="max-w-xs"
                                />
                                {eventDateValue && (
                                    <p className="text-sm text-purple-700 font-medium">
                                        {format(new Date(eventDateValue + "T00:00:00"), "EEEE, MMMM do, yyyy")}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div>
                                {room.eventDate ? (
                                    <p className="text-lg font-bold text-purple-800">
                                        {format(new Date(room.eventDate + "T00:00:00"), "EEEE, MMMM do, yyyy")}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Admin hasn&apos;t set the date yet.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Stats row — responsive grid, fits all 3 on mobile */}
            <div className={`grid gap-2 sm:gap-4 lg:gap-6 ${isEventMode && !isAdmin ? "grid-cols-1" : "grid-cols-3"}`}>
                <Card
                    className="bg-gradient-to-br from-indigo-500 via-split-500 to-cyan-400 border-0 ring-1 ring-split-400/30 cursor-pointer shadow-xl shadow-split-500/20 hover:shadow-2xl hover:shadow-split-500/40 hover:-translate-y-1 transition-all rounded-2xl sm:rounded-[2rem] overflow-hidden group"
                    onClick={() => setShowMembers(true)}
                >
                    <CardContent className="p-3 sm:p-6 lg:p-8 text-center text-white relative h-full flex flex-col justify-center">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-inner flex items-center justify-center mx-auto mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-sm">{members.length}</div>
                        <div className="text-[10px] sm:text-xs lg:text-sm font-bold text-split-50 mt-1 sm:mt-2 uppercase tracking-wider sm:tracking-widest opacity-90">Members</div>
                    </CardContent>
                </Card>
                {!(isEventMode && !isAdmin) && (
                    <>
                        <Card
                            className="bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 border-0 ring-1 ring-purple-400/30 cursor-pointer shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/40 hover:-translate-y-1 transition-all rounded-2xl sm:rounded-[2rem] overflow-hidden group"
                            onClick={() => router.push(`/r/${params.roomId}/availability`)}
                        >
                            <CardContent className="p-3 sm:p-6 lg:p-8 text-center text-white relative h-full flex flex-col justify-center">
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-inner flex items-center justify-center mx-auto mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                </div>
                                <div className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-sm">{bestDates.length}</div>
                                <div className="text-[10px] sm:text-xs lg:text-sm font-bold text-purple-50 mt-1 sm:mt-2 uppercase tracking-wider sm:tracking-widest opacity-90">Meet</div>
                            </CardContent>
                        </Card>
                        <Card
                            className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 border-0 ring-1 ring-emerald-400/30 cursor-pointer shadow-xl shadow-teal-500/20 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 transition-all rounded-2xl sm:rounded-[2rem] overflow-hidden group"
                            onClick={() => router.push(`/r/${params.roomId}/split`)}
                        >
                            <CardContent className="p-3 sm:p-6 lg:p-8 text-center text-white relative h-full flex flex-col justify-center">
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-inner flex items-center justify-center mx-auto mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Receipt className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                </div>
                                <div className="text-lg sm:text-2xl lg:text-4xl font-black tracking-tight drop-shadow-sm" title={formatMoney(totalExpenses)}>
                                    {formatMoney(totalExpenses)}
                                </div>
                                <div className="text-[10px] sm:text-xs lg:text-sm font-bold text-teal-50 mt-1 sm:mt-2 uppercase tracking-wider sm:tracking-widest opacity-90">Split</div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Best Date — hidden for non-admin in event mode */}
            {!(isEventMode && !isAdmin) && (
                <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Best Date</h3>
                    <BestDateCard dates={bestDates} members={members} />
                </section>
            )}

            {/* Per-person cost — hidden for non-admin in event mode */}
            {!(isEventMode && !isAdmin) && expenses.length > 0 && (
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-[2rem] blur opacity-50"></div>
                    <Card className="relative border-0 ring-1 ring-slate-200/50 rounded-3xl bg-white/90 backdrop-blur shadow-xl overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-400 w-full" />
                        <CardHeader className="pb-2 pt-6 px-8">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-emerald-500" />
                                Expense Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className="flex flex-col mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-center justify-center text-center">
                                <span className="text-sm font-medium text-slate-500 mb-1">Average Per Person</span>
                                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{formatMoney(perPersonAvg)}</span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Recent Expenses</h4>
                            <div className="space-y-3">
                                {expenses.map(exp => {
                                    return (
                                        <div key={exp.expenseId} className="flex justify-between items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="font-semibold text-slate-900 truncate">{exp.description}</span>
                                            </div>
                                            <span className="font-bold text-slate-900 bg-white shadow-sm px-2 sm:px-3 py-1.5 rounded-lg border border-slate-100 text-sm sm:text-base whitespace-nowrap shrink-0">
                                                {formatMoney(exp.totalAmount)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Final Balances / Who Owes Whom — hidden for non-admin in event mode */}
            {!(isEventMode && !isAdmin) && (
                <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Who Owes Whom</h3>
                    <BalancesList debts={simplifiedDebts} members={members} currency={room.currency} />
                </section>
            )}
        </div>
    );
}
