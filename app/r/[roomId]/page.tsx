"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomData } from "@/lib/hooks/useRoomData";
import { BestDateCard } from "@/components/room/BestDateCard";
import { BalancesList } from "@/components/room/BalancesList";
import { calculateBestDates } from "@/lib/utils/calculateBestDate";
import { simplifyDebts } from "@/lib/utils/calculateSplit";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Receipt, Users, Share2, Check } from "lucide-react";
import { useState } from "react";

export default function RoomOverview({ params }: { params: { roomId: string } }) {
    const { user } = useAuth();
    const { room, members, availabilities, expenses, expenseParts } = useRoomData(params.roomId);
    const [copied, setCopied] = useState(false);

    if (!room || !user) return null;

    const memberIds = members.map(m => m.userId);
    const bestDates = calculateBestDates(availabilities, memberIds);
    const simplifiedDebts = simplifyDebts(expenses, expenseParts);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const perPersonAvg = members.length > 0 ? totalExpenses / members.length : 0;

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: room.currency }).format(amount);

    const getMemberName = (userId: string) =>
        members.find(m => m.userId === userId)?.displayName || "Unknown";

    const buildShareText = () => {
        let text = `--- ${room.name} Summary ---\n`;
        text += `Room Code: ${room.roomId}\n`;
        text += `Members: ${members.map(m => m.displayName).join(", ")}\n\n`;

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

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4 text-center">
                        <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-slate-900">{members.length}</div>
                        <div className="text-xs text-slate-500">Members</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <CardContent className="p-4 text-center">
                        <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-slate-900">{bestDates.length}</div>
                        <div className="text-xs text-slate-500">Date Options</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
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

            {/* Members */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Members
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {members.map(m => (
                            <div key={m.userId} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                    {m.displayName.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm text-slate-700">{m.displayName}</span>
                                {m.userId === room.adminId && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Admin</span>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
