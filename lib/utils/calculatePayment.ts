import { RoomMemberData } from "@/types/firebase";
import { SimplifiedDebt } from "./calculateSplit";

export type PaymentMode = "each" | "manual";

export interface PayerEntry {
    userId: string;
    amount: number;
}

export interface MemberOwed {
    userId: string;
    displayName: string;
    owedAmount: number;
    hasPaid: boolean;
}

export interface ManualPaymentResult {
    payers: PayerEntry[];
    owedList: MemberOwed[];
    isValid: boolean;
    delta: number; // difference between entered total and required total
}

/**
 * For "Each" mode: calculate per-member owed amounts from simplified debts.
 * Each member owes their equal share of the total.
 */
export function calculateEachPayment(
    totalAmount: number,
    members: RoomMemberData[],
    paidMembers: Set<string>
): MemberOwed[] {
    if (members.length === 0) return [];
    const perPerson = totalAmount / members.length;

    return members.map((m) => ({
        userId: m.userId,
        displayName: m.displayName,
        owedAmount: Math.round(perPerson * 100) / 100,
        hasPaid: paidMembers.has(m.userId),
    }));
}

/**
 * For "Manual" mode: given payer entries, calculate what non-payers owe.
 * Returns validation info as well.
 */
export function calculateManualPayment(
    totalAmount: number,
    members: RoomMemberData[],
    payers: PayerEntry[]
): ManualPaymentResult {
    const payerTotal = payers.reduce((sum, p) => sum + p.amount, 0);
    const delta = Math.round((payerTotal - totalAmount) * 100) / 100;
    const isValid = Math.abs(delta) < 0.01;

    const payerIds = new Set(payers.filter((p) => p.amount > 0).map((p) => p.userId));
    const nonPayers = members.filter((m) => !payerIds.has(m.userId));
    const nonPayerCount = nonPayers.length;

    // Each non-payer owes an equal share of the total
    const perNonPayer = nonPayerCount > 0 ? totalAmount / members.length : 0;

    const owedList: MemberOwed[] = members.map((m) => {
        if (payerIds.has(m.userId)) {
            const paid = payers.find((p) => p.userId === m.userId)?.amount || 0;
            const owes = totalAmount / members.length;
            // Their net: they paid `paid` but owe `owes`
            // If they paid more than their share, they are owed money (negative owed)
            const net = Math.round((owes - paid) * 100) / 100;
            return {
                userId: m.userId,
                displayName: m.displayName,
                owedAmount: net, // negative means they are owed
                hasPaid: true,
            };
        }
        return {
            userId: m.userId,
            displayName: m.displayName,
            owedAmount: Math.round((totalAmount / members.length) * 100) / 100,
            hasPaid: false,
        };
    });

    return { payers, owedList, isValid, delta };
}

/**
 * Calculate simplified debts for manual payment mode.
 * Payers are creditors, non-payers owe their share to payers proportionally.
 */
export function calculateManualDebts(
    totalAmount: number,
    members: RoomMemberData[],
    payers: PayerEntry[]
): SimplifiedDebt[] {
    if (members.length === 0 || payers.length === 0) return [];

    const perPerson = totalAmount / members.length;
    const payerIds = new Set(payers.filter((p) => p.amount > 0).map((p) => p.userId));

    // Net balance: positive = owed money, negative = owes money
    const balances: Record<string, number> = {};

    // Payers get credit for what they paid
    payers.forEach((p) => {
        balances[p.userId] = (balances[p.userId] || 0) + p.amount;
    });

    // Everyone owes their share
    members.forEach((m) => {
        balances[m.userId] = (balances[m.userId] || 0) - perPerson;
    });

    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    Object.entries(balances).forEach(([userId, balance]) => {
        const rounded = Math.round(balance * 100) / 100;
        if (rounded < 0) debtors.push({ userId, amount: Math.abs(rounded) });
        else if (rounded > 0) creditors.push({ userId, amount: rounded });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions: SimplifiedDebt[] = [];
    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
        const debtor = debtors[d];
        const creditor = creditors[c];
        const settleAmount = Math.min(debtor.amount, creditor.amount);

        transactions.push({
            fromUser: debtor.userId,
            toUser: creditor.userId,
            amount: Math.round(settleAmount * 100) / 100,
        });

        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;

        if (Math.abs(debtor.amount) < 0.01) d++;
        if (Math.abs(creditor.amount) < 0.01) c++;
    }

    return transactions;
}

/**
 * Validate a payment amount input.
 * Returns error message or null if valid.
 */
export function validatePaymentAmount(value: string): string | null {
    if (value === "" || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num < 0) return "Amount cannot be negative";
    return null;
}
