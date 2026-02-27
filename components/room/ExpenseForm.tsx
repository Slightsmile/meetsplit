"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { RoomMemberData } from "@/types/firebase";
import { addExpense } from "@/lib/firebase/firestore";
import { Plus, Trash2 } from "lucide-react";

interface FoodItem {
    name: string;
    price: string;
}

interface Props {
    roomId: string;
    members: RoomMemberData[];
    currentUserId: string;
    currency?: string;
}

export function ExpenseForm({ roomId, members, currentUserId, currency = "BDT" }: Props) {
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [paidBy, setPaidBy] = useState(currentUserId);
    const [splitType, setSplitType] = useState<"EQUAL" | "MANUAL">("EQUAL");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Manual split: per-member food items
    const [memberItems, setMemberItems] = useState<Record<string, FoodItem[]>>({});

    // VAT
    const [vatEnabled, setVatEnabled] = useState(false);
    const [vatPercent, setVatPercent] = useState("0");

    const totalAmount = parseFloat(amount) || 0;
    const equalShare = members.length > 0 ? totalAmount / members.length : 0;

    // Calculate per-member subtotals from food items
    const getMemberSubtotal = (userId: string) => {
        const items = memberItems[userId] || [];
        return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    };

    const manualSubtotal = members.reduce((sum, m) => sum + getMemberSubtotal(m.userId), 0);
    const vatRate = parseFloat(vatPercent) || 0;
    const vatAmount = splitType === "MANUAL" && vatEnabled ? manualSubtotal * (vatRate / 100) : 0;
    const manualGrandTotal = manualSubtotal + vatAmount;

    // Add a food item row for a member
    const addItem = (userId: string) => {
        setMemberItems(prev => ({
            ...prev,
            [userId]: [...(prev[userId] || []), { name: "", price: "" }]
        }));
    };

    const updateItem = (userId: string, index: number, field: "name" | "price", value: string) => {
        setMemberItems(prev => {
            const items = [...(prev[userId] || [])];
            items[index] = { ...items[index], [field]: value };
            return { ...prev, [userId]: items };
        });
    };

    const removeItem = (userId: string, index: number) => {
        setMemberItems(prev => {
            const items = [...(prev[userId] || [])];
            items.splice(index, 1);
            return { ...prev, [userId]: items };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (splitType === "EQUAL") {
            if (!description || !amount || isNaN(Number(amount))) return;
        } else {
            // Manual: description is required, total is calculated from items
            if (!description) return;
            if (manualSubtotal <= 0) return;
        }

        setIsSubmitting(true);

        const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const finalTotal = splitType === "MANUAL" ? manualGrandTotal : totalAmount;

        let participants: { userId: string; owedAmount: number }[];

        if (splitType === "EQUAL") {
            participants = members.map(m => ({
                userId: m.userId,
                owedAmount: equalShare
            }));
        } else {
            // Distribute VAT proportionally
            participants = members.map(m => {
                const sub = getMemberSubtotal(m.userId);
                const memberVat = manualSubtotal > 0 && vatEnabled ? sub * (vatRate / 100) : 0;
                return {
                    userId: m.userId,
                    owedAmount: sub + memberVat
                };
            });
        }

        await addExpense(
            expenseId,
            roomId,
            description,
            finalTotal,
            paidBy,
            splitType,
            participants
        );

        setDescription("");
        setAmount("");
        setPaidBy(currentUserId);
        setSplitType("EQUAL");
        setMemberItems({});
        setVatEnabled(false);
        setVatPercent("0");
        setIsSubmitting(false);
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl bg-slate-50 border-slate-200">
            <h3 className="font-semibold text-slate-800">Add an Expense</h3>

            <div>
                <label className="text-sm text-slate-500 mb-1 block">Description</label>
                <Input
                    placeholder="Dinner, Airbnb, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
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

            {/* Equal split: total amount + summary */}
            {splitType === "EQUAL" && (
                <div className="space-y-3">
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
                    {totalAmount > 0 && (
                        <div className="p-3 rounded-lg bg-white border border-slate-200">
                            <p className="text-sm text-slate-600">
                                Each person pays: <span className="font-bold text-slate-900">{formatCurrency(equalShare)}</span>
                                <span className="text-xs text-slate-400 ml-2">({members.length} members)</span>
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Manual split: per-member food items */}
            {splitType === "MANUAL" && (
                <div className="space-y-4 p-3 rounded-lg bg-white border border-slate-200">
                    <p className="text-xs text-slate-500">Add food items and prices for each person:</p>

                    {members.map(m => {
                        const items = memberItems[m.userId] || [];
                        const subtotal = getMemberSubtotal(m.userId);

                        return (
                            <div key={m.userId} className="space-y-2 p-3 rounded-lg border border-slate-100 bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700">
                                        {m.displayName}{m.userId === currentUserId ? " (You)" : ""}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        Subtotal: {formatCurrency(subtotal)}
                                    </span>
                                </div>

                                {items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Input
                                            placeholder="Item name"
                                            value={item.name}
                                            onChange={(e) => updateItem(m.userId, idx, "name", e.target.value)}
                                            className="flex-1 h-8 text-sm"
                                        />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Price"
                                            value={item.price}
                                            onChange={(e) => updateItem(m.userId, idx, "price", e.target.value)}
                                            className="w-24 h-8 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeItem(m.userId, idx)}
                                            className="p-1 text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => addItem(m.userId)}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add item
                                </button>
                            </div>
                        );
                    })}

                    {/* VAT option */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={vatEnabled}
                                onChange={(e) => setVatEnabled(e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">Add VAT / Tax</span>
                        </label>

                        {vatEnabled && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    placeholder="e.g. 15"
                                    value={vatPercent}
                                    onChange={(e) => setVatPercent(e.target.value)}
                                    className="w-24 h-8 text-sm"
                                />
                                <span className="text-sm text-slate-500">%</span>
                                {vatAmount > 0 && (
                                    <span className="text-xs text-slate-500 ml-2">
                                        VAT: {formatCurrency(vatAmount)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Grand total summary */}
                    <div className="pt-2 border-t border-slate-200">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Subtotal:</span>
                            <span className="font-medium text-slate-900">{formatCurrency(manualSubtotal)}</span>
                        </div>
                        {vatEnabled && vatAmount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">VAT ({vatRate}%):</span>
                                <span className="font-medium text-slate-900">{formatCurrency(vatAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold mt-1">
                            <span className="text-slate-900">Grand Total:</span>
                            <span className="text-slate-900">{formatCurrency(manualGrandTotal)}</span>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <Button
                    type="submit"
                    disabled={isSubmitting || members.length === 0 || (splitType === "MANUAL" && manualSubtotal <= 0)}
                    className="w-full sm:w-auto"
                >
                    {isSubmitting ? "Adding..." : "Add Expense"}
                </Button>
            </div>
        </form>
    );
}
