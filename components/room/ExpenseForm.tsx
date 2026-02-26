"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { RoomMemberData } from "@/types/firebase";
import { addExpense } from "@/lib/firebase/firestore";

interface Props {
    roomId: string;
    members: RoomMemberData[];
    currentUserId: string;
}

export function ExpenseForm({ roomId, members, currentUserId }: Props) {
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [paidBy, setPaidBy] = useState(currentUserId);
    const [splitType, setSplitType] = useState<"EQUAL" | "MANUAL">("EQUAL");
    const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalAmount = parseFloat(amount) || 0;
    const equalShare = members.length > 0 ? totalAmount / members.length : 0;

    const manualTotal = Object.values(manualAmounts).reduce(
        (sum, v) => sum + (parseFloat(v) || 0), 0
    );
    const manualError = splitType === "MANUAL" && totalAmount > 0 && Math.abs(manualTotal - totalAmount) > 0.01;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || isNaN(Number(amount))) return;
        if (splitType === "MANUAL" && manualError) return;

        setIsSubmitting(true);

        const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        let participants: { userId: string; owedAmount: number }[];

        if (splitType === "EQUAL") {
            participants = members.map(m => ({
                userId: m.userId,
                owedAmount: equalShare
            }));
        } else {
            participants = members.map(m => ({
                userId: m.userId,
                owedAmount: parseFloat(manualAmounts[m.userId] || "0")
            }));
        }

        await addExpense(
            expenseId,
            roomId,
            description,
            totalAmount,
            paidBy,
            splitType,
            participants
        );

        setDescription("");
        setAmount("");
        setPaidBy(currentUserId);
        setSplitType("EQUAL");
        setManualAmounts({});
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl bg-slate-50 border-slate-200">
            <h3 className="font-semibold text-slate-800">Add an Expense</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-slate-500 mb-1 block">Description</label>
                    <Input
                        placeholder="Dinner, Airbnb, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500 mb-1 block">Total Amount</label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* Paid by selector */}
            <div>
                <label className="text-sm text-slate-500 mb-1 block">Who paid?</label>
                <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {members.map(m => (
                        <option key={m.userId} value={m.userId}>
                            {m.displayName}{m.userId === currentUserId ? " (You)" : ""}
                        </option>
                    ))}
                </select>
            </div>

            {/* Split type toggle */}
            <div>
                <label className="text-sm text-slate-500 mb-2 block">Split method</label>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => setSplitType("EQUAL")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            splitType === "EQUAL"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                        }`}
                    >
                        Equal Split
                    </button>
                    <button
                        type="button"
                        onClick={() => setSplitType("MANUAL")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            splitType === "MANUAL"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                        }`}
                    >
                        Manual Split
                    </button>
                </div>
            </div>

            {/* Equal split summary */}
            {splitType === "EQUAL" && totalAmount > 0 && (
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <p className="text-sm text-slate-600">
                        Each person pays: <span className="font-bold text-slate-900">${equalShare.toFixed(2)}</span>
                        <span className="text-xs text-slate-400 ml-2">({members.length} members)</span>
                    </p>
                </div>
            )}

            {/* Manual split inputs */}
            {splitType === "MANUAL" && (
                <div className="space-y-2 p-3 rounded-lg bg-white border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Enter the amount each person owes:</p>
                    {members.map(m => (
                        <div key={m.userId} className="flex items-center justify-between gap-3">
                            <span className="text-sm text-slate-700 min-w-[100px]">
                                {m.displayName}{m.userId === currentUserId ? " (You)" : ""}
                            </span>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={manualAmounts[m.userId] || ""}
                                onChange={(e) => setManualAmounts(prev => ({ ...prev, [m.userId]: e.target.value }))}
                                className="w-28"
                            />
                        </div>
                    ))}
                    {totalAmount > 0 && (
                        <div className={`text-xs mt-2 pt-2 border-t ${manualError ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                            Total assigned: ${manualTotal.toFixed(2)} / ${totalAmount.toFixed(2)}
                            {manualError && " — amounts must add up to the total"}
                        </div>
                    )}
                </div>
            )}

            <div>
                <Button type="submit" disabled={isSubmitting || members.length === 0 || (splitType === "MANUAL" && manualError)} className="w-full sm:w-auto">
                    {isSubmitting ? "Adding..." : "Add Expense"}
                </Button>
            </div>
        </form>
    );
}
