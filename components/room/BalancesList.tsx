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
                    <Card key={i} className="overflow-hidden">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                                    {from.initials}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900">{from.name}</span>
                                    <span className="text-xs text-slate-500">owes</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="font-bold text-slate-900">
                                    {formatMoney(debt.amount)}
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="flex flex-col text-right">
                                    <span className="text-sm font-medium text-slate-900">{to.name}</span>
                                    <span className="text-xs text-slate-500">receives</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
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
