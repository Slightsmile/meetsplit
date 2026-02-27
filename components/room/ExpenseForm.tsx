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
    const [vatType, setVatType] = useState<"PERCENT" | "AMOUNT">("PERCENT");
    const [vatValue, setVatValue] = useState("0");

    const totalAmount = parseFloat(amount) || 0;
    const equalShare = members.length > 0 ? totalAmount / members.length : 0;

    // Calculate per-member subtotals from food items
    const getMemberSubtotal = (userId: string) => {
        const items = memberItems[userId] || [];
        return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    };

    const manualSubtotal = members.reduce((sum, m) => sum + getMemberSubtotal(m.userId), 0);
    const parsedVatValue = parseFloat(vatValue) || 0;
    const vatAmount = splitType === "MANUAL" && vatEnabled
        ? (vatType === "PERCENT" ? manualSubtotal * (parsedVatValue / 100) : parsedVatValue)
        : 0;
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
                const memberVat = manualSubtotal > 0 && vatEnabled ? (sub / manualSubtotal) * vatAmount : 0;
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
        setVatType("PERCENT");
        setVatValue("0");
        setIsSubmitting(false);
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6 rounded-[1.5rem] bg-white shadow-xl shadow-slate-200/40 border border-slate-100 relative">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Add an Expense</h3>

            <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Description</label>
                <Input
                    placeholder="Dinner, Airbnb, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-14 sm:h-12 rounded-xl sm:rounded-lg bg-slate-50 border-slate-200 focus:bg-white text-base px-4"
                    required
                />
            </div>

            {/* Split type toggle */}
            <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Split method</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl sm:rounded-xl w-full">
                    <button
                        type="button"
                        onClick={() => setSplitType("EQUAL")}
                        className={`flex-1 px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-sm sm:text-base font-bold transition-all duration-200 ${splitType === "EQUAL"
                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Equal Split
                    </button>
                    <button
                        type="button"
                        onClick={() => setSplitType("MANUAL")}
                        className={`flex-1 px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-sm sm:text-base font-bold transition-all duration-200 ${splitType === "MANUAL"
                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Manual Split
                    </button>
                </div>
            </div>

            {/* Equal split: total amount + summary */}
            {splitType === "EQUAL" && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Total Amount</label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-14 sm:h-12 rounded-xl sm:rounded-lg text-lg sm:text-base font-bold text-slate-900 bg-slate-50 px-4 focus:bg-white"
                            required
                        />
                    </div>
                    {totalAmount > 0 && (
                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                            <p className="text-sm sm:text-base text-slate-700">
                                Each person pays: <span className="font-black text-blue-700 ml-1">{formatCurrency(equalShare)}</span>
                                <span className="text-xs font-semibold text-slate-400 block sm:inline sm:ml-2 mt-1 sm:mt-0">({members.length} members)</span>
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
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={vatEnabled}
                                onChange={(e) => setVatEnabled(e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Add VAT / Tax</span>
                        </label>

                        {vatEnabled && (
                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <select
                                    value={vatType}
                                    onChange={(e) => setVatType(e.target.value as "PERCENT" | "AMOUNT")}
                                    className="h-9 px-2 text-sm rounded-md border border-slate-300 bg-white"
                                >
                                    <option value="PERCENT">Percentage (%)</option>
                                    <option value="AMOUNT">Fixed Amount</option>
                                </select>
                                <div className="flex items-center gap-2 flex-1">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder={vatType === "PERCENT" ? "e.g. 15" : "e.g. 20.00"}
                                        value={vatValue}
                                        onChange={(e) => setVatValue(e.target.value)}
                                        className="h-9 w-24 text-sm"
                                    />
                                    {vatType === "PERCENT" && <span className="text-sm text-slate-500">%</span>}
                                </div>
                                {vatAmount > 0 && (
                                    <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                                        VAT: {formatCurrency(vatAmount)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Grand total summary */}
                    <div className="pt-3 border-t border-slate-200 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Subtotal:</span>
                            <span className="font-medium text-slate-900">{formatCurrency(manualSubtotal)}</span>
                        </div>
                        {vatEnabled && vatAmount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">VAT ({vatType === "PERCENT" ? `${parsedVatValue}%` : 'Amount'}):</span>
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

            <div className="pt-2">
                <Button
                    type="submit"
                    disabled={isSubmitting || members.length === 0 || (splitType === "MANUAL" && manualSubtotal <= 0)}
                    className="w-full h-14 sm:h-12 rounded-2xl sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-blue-500/25 transition-all"
                >
                    {isSubmitting ? "Adding..." : "Add Expense"}
                </Button>
            </div>
        </form>
    );
}
