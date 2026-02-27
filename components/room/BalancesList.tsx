"use client";

import { SimplifiedDebt } from "@/lib/utils/calculateSplit";
import { RoomMemberData } from "@/types/firebase";
import { Card, CardContent } from "../ui/card";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";

interface Props {
    debts: SimplifiedDebt[];
    members: RoomMemberData[];
    currency: string;
}

export function BalancesList({ debts, members, currency }: Props) {
    const getAvatarInfo = (userId: string) => {
        const m = members.find(m => m.userId === userId);
        const name = m?.displayName || "Unknown";
        const initials = name.substring(0, 2).toUpperCase();
        return { name, initials };
    };

    const formatMoney = (amount: number) => formatCurrency(amount, currency);

    if (debts.length === 0) {
        return (
            <div className="text-center py-6 text-slate-500">
                All settled up! No debts to show.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {debts.map((debt, i) => {
                const from = getAvatarInfo(debt.fromUser);
                const to = getAvatarInfo(debt.toUser);

                return (
                    <Card key={i} className="overflow-hidden rounded-2xl border-0 ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white mb-3">
                        <CardContent className="p-3 sm:p-4">
                            {/* Mobile: stacked layout */}
                            <div className="flex sm:hidden flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 shrink-0 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shadow-sm">
                                            {from.initials}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-semibold text-slate-900 truncate">{from.name}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Owes</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mx-1" />
                                    <div className="flex items-center gap-2 min-w-0 justify-end">
                                        <div className="flex flex-col items-end min-w-0">
                                            <span className="text-sm font-semibold text-slate-900 truncate">{to.name}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Gets</span>
                                        </div>
                                        <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-sm">
                                            {to.initials}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <span className="font-extrabold text-slate-900 text-base tracking-tight">
                                        {formatMoney(debt.amount)}
                                    </span>
                                </div>
                            </div>

                            {/* Desktop: horizontal layout */}
                            <div className="hidden sm:flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shadow-sm">
                                        {from.initials}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-slate-900 truncate">{from.name}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owes</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center px-3 shrink-0">
                                    <span className="font-extrabold text-slate-900 text-lg tracking-tight whitespace-nowrap">
                                        {formatMoney(debt.amount)}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-300 mt-1" />
                                </div>

                                <div className="flex items-center justify-end gap-3 min-w-0 flex-1">
                                    <div className="flex flex-col items-end min-w-0">
                                        <span className="text-sm font-semibold text-slate-900 truncate">{to.name}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gets</span>
                                    </div>
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-sm">
                                        {to.initials}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
