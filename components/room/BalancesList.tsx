"use client";

import { SimplifiedDebt } from "@/lib/utils/calculateSplit";
import { RoomMemberData } from "@/types/firebase";
import { Card, CardContent } from "../ui/card";
import { ArrowRight } from "lucide-react";

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

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

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
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3 w-[30%]">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shadow-sm">
                                    {from.initials}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-900 truncate">{from.name}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owes</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center px-2 w-[40%]">
                                <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                                    {formatMoney(debt.amount)}
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-300 mt-1" />
                            </div>

                            <div className="flex items-center justify-end space-x-3 w-[30%] text-right">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-semibold text-slate-900 truncate">{to.name}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gets</span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-sm">
                                    {to.initials}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
