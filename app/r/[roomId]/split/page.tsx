"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomData } from "@/lib/hooks/useRoomData";
import { ExpenseForm } from "@/components/room/ExpenseForm";
import { updateRoomCurrency } from "@/lib/firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

const CURRENCIES = [
    { code: "BDT", symbol: "৳", label: "BDT (৳)" },
    { code: "USD", symbol: "$", label: "USD ($)" },
    { code: "EUR", symbol: "€", label: "EUR (€)" },
    { code: "GBP", symbol: "£", label: "GBP (£)" },
    { code: "INR", symbol: "₹", label: "INR (₹)" },
    { code: "JPY", symbol: "¥", label: "JPY (¥)" },
];

export default function SplitPage({ params }: { params: { roomId: string } }) {
    const { user } = useAuth();
    const { room, members, expenses } = useRoomData(params.roomId);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

    if (!room || !user) return null;

    const handleCurrencyChange = async (currency: string) => {
        await updateRoomCurrency(params.roomId, currency);
        setShowCurrencyPicker(false);
    };

    return (
        <div className="space-y-8">
            {/* Currency Picker */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Expenses</h2>
                <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}>
                        <Coins className="w-4 h-4 mr-1" />
                        {room.currency}
                    </Button>
                    {showCurrencyPicker && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                            {CURRENCIES.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => handleCurrencyChange(c.code)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                        room.currency === c.code ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                                    }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <section>
                <ExpenseForm roomId={room.roomId} members={members} currentUserId={user.uid} currency={room.currency} />
            </section>

            <section>
                <h3 className="font-semibold text-slate-900 mb-4">Expense History</h3>
                {expenses.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6 border border-dashed rounded-xl">
                        No expenses recorded yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(exp => {
                            const payer = members.find(m => m.userId === exp.paidByUserId)?.displayName || "Unknown";
                            const date = format(new Date(exp.createdAt), "MMM do");

                            return (
                                <Card key={exp.expenseId} className="shadow-sm">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-slate-900">{exp.description}</p>
                                            <p className="text-xs text-slate-500">Paid by {payer} on {date}</p>
                                        </div>
                                        <div className="font-bold text-slate-900">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: room.currency }).format(exp.totalAmount)}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
