"use client";

import { useState, useCallback, useEffect } from "react";
import { RoomMemberData } from "@/types/firebase";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/formatCurrency";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
    PaymentMode,
    PayerEntry,
    calculateEachPayment,
    calculateManualPayment,
    calculateManualDebts,
    validatePaymentAmount,
} from "@/lib/utils/calculatePayment";
import { SimplifiedDebt } from "@/lib/utils/calculateSplit";
import { Check, AlertCircle, ArrowRight, CreditCard, CheckCircle2 } from "lucide-react";

interface PaymentMethodProps {
    roomId: string;
    totalAmount: number;
    members: RoomMemberData[];
    currency: string;
    initialPayments: import("@/types/firebase").RoomPaymentData[];
    onFinalize: (payments: { userId: string, paidAmount: number }[]) => Promise<void>;
}

export function PaymentMethod({
    roomId,
    totalAmount,
    members,
    currency,
    initialPayments,
    onFinalize,
}: PaymentMethodProps) {
    const [mode, setMode] = useState<PaymentMode>("each");
    const [paidMembers, setPaidMembers] = useState<Set<string>>(new Set());
    const [manualPayers, setManualPayers] = useState<PayerEntry[]>([]);
    const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
    const [selectedPayers, setSelectedPayers] = useState<Set<string>>(new Set());
    const [finalized, setFinalized] = useState(false);

    const formatMoney = useCallback(
        (amount: number) => formatCurrencyUtil(amount, currency),
        [currency]
    );

    const [isSaving, setIsSaving] = useState(false);

    // Initialize from existing payments
    useEffect(() => {
        // If there are initial payments that sum to something > 0
        const totalPaid = initialPayments.reduce((sum, p) => sum + p.paidAmount, 0);

        if (totalPaid > 0) {
            setMode("manual");
            const newSelected = new Set<string>();
            const newAmounts: Record<string, string> = {};

            initialPayments.forEach(p => {
                if (p.paidAmount > 0) {
                    newSelected.add(p.userId);
                    newAmounts[p.userId] = p.paidAmount.toString();
                }
            });

            setSelectedPayers(newSelected);
            setManualAmounts(newAmounts);
        } else {
            setMode("each");
            // By default no one has paid in "each" mode
            setPaidMembers(new Set());
        }
    }, [initialPayments]);

    // Sync manual payers from selected payers and amounts
    useEffect(() => {
        const entries: PayerEntry[] = [];
        selectedPayers.forEach((uid) => {
            const amt = parseFloat(manualAmounts[uid] || "0") || 0;
            entries.push({ userId: uid, amount: amt });
        });
        setManualPayers(entries);
    }, [selectedPayers, manualAmounts]);

    const getMemberName = (userId: string) =>
        members.find((m) => m.userId === userId)?.displayName || "Unknown";

    const getInitials = (userId: string) => {
        const name = getMemberName(userId);
        return name.substring(0, 2).toUpperCase();
    };

    // Toggle paid status for "each" mode
    const togglePaid = (userId: string) => {
        setPaidMembers((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    // Toggle payer selection for "manual" mode
    const togglePayer = (userId: string) => {
        setSelectedPayers((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
                setManualAmounts((a) => {
                    const copy = { ...a };
                    delete copy[userId];
                    return copy;
                });
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    const updatePayerAmount = (userId: string, value: string) => {
        const error = validatePaymentAmount(value);
        if (error && value !== "") return; // allow empty for clearing
        setManualAmounts((prev) => ({ ...prev, [userId]: value }));
    };

    // Calculations
    const eachPaymentList = calculateEachPayment(totalAmount, members, paidMembers);
    const manualResult = calculateManualPayment(totalAmount, members, manualPayers);
    const manualDebts = calculateManualDebts(totalAmount, members, manualPayers);

    const handleFinalize = async () => {
        if (mode === "manual" && !manualResult.isValid) return;

        setIsSaving(true);
        let finalPayments: { userId: string, paidAmount: number }[] = [];

        if (mode === "each") {
            finalPayments = members.map(m => ({
                userId: m.userId,
                paidAmount: paidMembers.has(m.userId) ? perPerson : 0
            }));
        } else {
            finalPayments = members.map(m => ({
                userId: m.userId,
                paidAmount: manualPayers.find(p => p.userId === m.userId)?.amount || 0
            }));
        }

        try {
            await onFinalize(finalPayments);
            setFinalized(true);
            setTimeout(() => setFinalized(false), 2000); // Reset UI after 2s
        } catch (error) {
            // Error handling could go here
        } finally {
            setIsSaving(false);
        }
    };

    const handleModeSwitch = (newMode: PaymentMode) => {
        if (newMode === mode) return;
        setMode(newMode);
        setFinalized(false);
        // Preserve what we can but don't clear data
    };

    const perPerson = members.length > 0 ? totalAmount / members.length : 0;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    Payment Method
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* Total amount display */}
                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-sm text-slate-500 font-medium">Total Amount</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">
                        {formatMoney(totalAmount)}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                        {formatMoney(perPerson)} per person
                    </div>
                </div>

                {/* Mode toggle */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Payment Option
                    </label>
                    <div
                        className="flex bg-slate-100 p-1.5 rounded-2xl sm:rounded-xl w-full"
                        role="radiogroup"
                        aria-label="Payment method"
                    >
                        <button
                            type="button"
                            role="radio"
                            aria-checked={mode === "each"}
                            onClick={() => handleModeSwitch("each")}
                            className={`flex-1 px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-sm sm:text-base font-bold transition-all duration-200 ${mode === "each"
                                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Each
                        </button>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={mode === "manual"}
                            onClick={() => handleModeSwitch("manual")}
                            className={`flex-1 px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-sm sm:text-base font-bold transition-all duration-200 ${mode === "manual"
                                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Manual Payment
                        </button>
                    </div>
                </div>

                {/* ───── EACH MODE ───── */}
                {mode === "each" && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">
                                Who Paid
                            </h4>
                            <p className="text-xs text-slate-400 mb-3">
                                Mark members who have already paid their share.
                            </p>
                            <div className="space-y-2">
                                {eachPaymentList.map((member) => (
                                    <div
                                        key={member.userId}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${member.hasPaid
                                                ? "bg-emerald-50 border-emerald-200"
                                                : "bg-white border-slate-200 hover:border-slate-300"
                                            }`}
                                        onClick={() => togglePaid(member.userId)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                togglePaid(member.userId);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="checkbox"
                                        aria-checked={member.hasPaid}
                                        aria-label={`${member.displayName} - ${formatMoney(member.owedAmount)}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm ${member.hasPaid
                                                        ? "bg-emerald-200 text-emerald-800"
                                                        : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {getInitials(member.userId)}
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {member.displayName}
                                                </span>
                                                <div className="text-xs text-slate-500">
                                                    Owes {formatMoney(member.owedAmount)}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${member.hasPaid
                                                    ? "bg-emerald-500 border-emerald-500"
                                                    : "border-slate-300"
                                                }`}
                                        >
                                            {member.hasPaid && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ───── MANUAL MODE ───── */}
                {mode === "manual" && (
                    <div className="space-y-4">
                        {/* Select payers */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">
                                Select Payer(s)
                            </h4>
                            <p className="text-xs text-slate-400 mb-3">
                                Choose who paid and enter their amounts. Total must equal the bill.
                            </p>
                            <div className="space-y-2">
                                {members.map((member) => {
                                    const isSelected = selectedPayers.has(member.userId);
                                    const amountStr = manualAmounts[member.userId] || "";
                                    const amountError = validatePaymentAmount(amountStr);

                                    return (
                                        <div
                                            key={member.userId}
                                            className={`p-3 rounded-xl border transition-colors ${isSelected
                                                    ? "bg-blue-50 border-blue-200"
                                                    : "bg-white border-slate-200"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className="flex items-center gap-3 cursor-pointer flex-1"
                                                    onClick={() => togglePayer(member.userId)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            togglePayer(member.userId);
                                                        }
                                                    }}
                                                    tabIndex={0}
                                                    role="checkbox"
                                                    aria-checked={isSelected}
                                                    aria-label={`Select ${member.displayName} as payer`}
                                                >
                                                    <div
                                                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm ${isSelected
                                                                ? "bg-blue-200 text-blue-800"
                                                                : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {getInitials(member.userId)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900">
                                                        {member.displayName}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${isSelected
                                                            ? "bg-blue-500 border-blue-500"
                                                            : "border-slate-300"
                                                        }`}
                                                    onClick={() => togglePayer(member.userId)}
                                                >
                                                    {isSelected && (
                                                        <Check className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="mt-3 pl-12">
                                                    <label className="text-xs text-slate-500 font-medium mb-1 block">
                                                        Amount paid
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={amountStr}
                                                        onChange={(e) =>
                                                            updatePayerAmount(
                                                                member.userId,
                                                                e.target.value
                                                            )
                                                        }
                                                        className={`h-10 rounded-lg ${amountError
                                                                ? "border-red-300 focus:ring-red-500"
                                                                : ""
                                                            }`}
                                                        aria-label={`Amount paid by ${member.displayName}`}
                                                    />
                                                    {amountError && (
                                                        <p className="text-xs text-red-500 mt-1">
                                                            {amountError}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Validation status */}
                        {selectedPayers.size > 0 && (
                            <div
                                className={`p-3 rounded-xl border flex items-start gap-2 ${manualResult.isValid
                                        ? "bg-emerald-50 border-emerald-200"
                                        : "bg-amber-50 border-amber-200"
                                    }`}
                            >
                                {manualResult.isValid ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p
                                        className={`text-sm font-medium ${manualResult.isValid
                                                ? "text-emerald-700"
                                                : "text-amber-700"
                                            }`}
                                    >
                                        {manualResult.isValid
                                            ? "Amounts match the total bill!"
                                            : `Delta: ${formatMoney(Math.abs(manualResult.delta))} ${manualResult.delta > 0 ? "over" : "under"
                                            } the total`}
                                    </p>
                                    {!manualResult.isValid && (
                                        <p className="text-xs text-amber-600 mt-0.5">
                                            Entered: {formatMoney(
                                                manualPayers.reduce((s, p) => s + p.amount, 0)
                                            )}{" "}
                                            / Required: {formatMoney(totalAmount)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Owed amounts for non-payers */}
                        {manualResult.isValid && manualDebts.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                                    Settlement Summary
                                </h4>
                                <div className="space-y-2">
                                    {manualDebts.map((debt, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 gap-2"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div className="w-8 h-8 shrink-0 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                                                    {getInitials(debt.fromUser)}
                                                </div>
                                                <span className="text-sm font-medium text-slate-900 truncate">
                                                    {getMemberName(debt.fromUser)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
                                                    {formatMoney(debt.amount)}
                                                </span>
                                                <ArrowRight className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                                <span className="text-sm font-medium text-slate-900 truncate">
                                                    {getMemberName(debt.toUser)}
                                                </span>
                                                <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                                    {getInitials(debt.toUser)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Finalize button */}
                <div className="pt-2">
                    <Button
                        variant="default"
                        size="lg"
                        onClick={handleFinalize}
                        disabled={
                            isSaving ||
                            (mode === "manual" && !manualResult.isValid) ||
                            (mode === "manual" && selectedPayers.size === 0)
                        }
                        className={`w-full h-12 rounded-2xl font-semibold text-base transition-all ${finalized
                                ? "bg-emerald-600 hover:bg-emerald-600"
                                : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                            }`}
                    >
                        {finalized ? (
                            <>
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Payments Saved
                            </>
                        ) : isSaving ? (
                            "Saving..."
                        ) : (
                            "Save Payments"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
