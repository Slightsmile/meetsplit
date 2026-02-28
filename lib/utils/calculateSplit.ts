import { ExpenseData, ExpenseParticipantData, RoomPaymentData } from "@/types/firebase";

export interface SimplifiedDebt {
    fromUser: string;
    toUser: string;
    amount: number;
}

export function simplifyDebts(
    expenses: ExpenseData[],
    participants: ExpenseParticipantData[],
    roomPayments: RoomPaymentData[]
): SimplifiedDebt[] {
    // 1. Calculate the Net Balance for each user.
    // Positive balance means they are OWED money.
    // Negative balance means they OWE money.
    const balances: Record<string, number> = {};

    // Add what users paid in total (they are owed this money back)
    roomPayments.forEach(payment => {
        balances[payment.userId] = (balances[payment.userId] || 0) + payment.paidAmount;
    });

    // Subtract what users owe for specific parts of the bills
    participants.forEach(part => {
        balances[part.userId] = (balances[part.userId] || 0) - part.owedAmount;
    });

    // 2. Separate into Debtors (owe money) and Creditors (are owed money)
    const debtors: { userId: string, amount: number }[] = [];
    const creditors: { userId: string, amount: number }[] = [];

    Object.entries(balances).forEach(([userId, balance]) => {
        // Round to avoid floating point weirdness (e.g., 0.00000001)
        const rounded = Math.round(balance * 100) / 100;

        if (rounded < 0) debtors.push({ userId, amount: Math.abs(rounded) });
        else if (rounded > 0) creditors.push({ userId, amount: rounded });
    });

    // Sort both arrays descending to settle the largest debts first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // 3. Match Debtors to Creditors (Greedy Algorithm for Debt Simplification)
    const transactions: SimplifiedDebt[] = [];
    let d = 0; // Debtor index
    let c = 0; // Creditor index

    while (d < debtors.length && c < creditors.length) {
        const debtor = debtors[d];
        const creditor = creditors[c];

        // Find the minimum amount that can be settled between these two
        const settleAmount = Math.min(debtor.amount, creditor.amount);

        transactions.push({
            fromUser: debtor.userId,
            toUser: creditor.userId,
            amount: Math.round(settleAmount * 100) / 100
        });

        // Deduct the settled amount
        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;

        // Move to next person if their balance is fully settled
        if (Math.abs(debtor.amount) < 0.01) d++;
        if (Math.abs(creditor.amount) < 0.01) c++;
    }

    return transactions;
}
