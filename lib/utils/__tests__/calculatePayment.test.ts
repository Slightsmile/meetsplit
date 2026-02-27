import { describe, it, expect } from "vitest";
import {
    calculateEachPayment,
    calculateManualPayment,
    calculateManualDebts,
    validatePaymentAmount,
    PayerEntry,
} from "../calculatePayment";
import { RoomMemberData } from "@/types/firebase";

// Helper to create mock members
const makeMember = (userId: string, displayName: string): RoomMemberData => ({
    roomId: "room1",
    userId,
    displayName,
    joinedAt: new Date().toISOString(),
});

const members: RoomMemberData[] = [
    makeMember("u1", "Alice"),
    makeMember("u2", "Bob"),
    makeMember("u3", "Charlie"),
];

describe("validatePaymentAmount", () => {
    it("returns null for empty string", () => {
        expect(validatePaymentAmount("")).toBeNull();
    });

    it("returns null for valid positive number", () => {
        expect(validatePaymentAmount("50")).toBeNull();
        expect(validatePaymentAmount("12.5")).toBeNull();
        expect(validatePaymentAmount("0")).toBeNull();
    });

    it("returns error for negative number", () => {
        expect(validatePaymentAmount("-10")).toBe("Amount cannot be negative");
    });

    it("returns error for non-numeric string", () => {
        expect(validatePaymentAmount("abc")).toBe("Must be a valid number");
        expect(validatePaymentAmount("12abc")).toBe("Must be a valid number");
    });
});

describe("calculateEachPayment", () => {
    it("splits total equally among members", () => {
        const result = calculateEachPayment(300, members, new Set());
        expect(result).toHaveLength(3);
        result.forEach((m) => {
            expect(m.owedAmount).toBe(100);
            expect(m.hasPaid).toBe(false);
        });
    });

    it("marks paid members correctly", () => {
        const paidSet = new Set(["u1", "u3"]);
        const result = calculateEachPayment(300, members, paidSet);
        expect(result.find((m) => m.userId === "u1")?.hasPaid).toBe(true);
        expect(result.find((m) => m.userId === "u2")?.hasPaid).toBe(false);
        expect(result.find((m) => m.userId === "u3")?.hasPaid).toBe(true);
    });

    it("handles zero total", () => {
        const result = calculateEachPayment(0, members, new Set());
        result.forEach((m) => {
            expect(m.owedAmount).toBe(0);
        });
    });

    it("handles empty members array", () => {
        const result = calculateEachPayment(100, [], new Set());
        expect(result).toHaveLength(0);
    });

    it("handles uneven split with rounding", () => {
        const result = calculateEachPayment(100, members, new Set());
        // 100 / 3 = 33.33...
        result.forEach((m) => {
            expect(m.owedAmount).toBeCloseTo(33.33, 1);
        });
    });
});

describe("calculateManualPayment", () => {
    it("validates when payer amounts equal total", () => {
        const payers: PayerEntry[] = [{ userId: "u1", amount: 300 }];
        const result = calculateManualPayment(300, members, payers);
        expect(result.isValid).toBe(true);
        expect(result.delta).toBe(0);
    });

    it("detects when payer amounts are under total", () => {
        const payers: PayerEntry[] = [{ userId: "u1", amount: 200 }];
        const result = calculateManualPayment(300, members, payers);
        expect(result.isValid).toBe(false);
        expect(result.delta).toBeLessThan(0);
    });

    it("detects when payer amounts exceed total", () => {
        const payers: PayerEntry[] = [{ userId: "u1", amount: 400 }];
        const result = calculateManualPayment(300, members, payers);
        expect(result.isValid).toBe(false);
        expect(result.delta).toBeGreaterThan(0);
    });

    it("handles multiple payers", () => {
        const payers: PayerEntry[] = [
            { userId: "u1", amount: 150 },
            { userId: "u2", amount: 150 },
        ];
        const result = calculateManualPayment(300, members, payers);
        expect(result.isValid).toBe(true);
    });

    it("marks payers as hasPaid", () => {
        const payers: PayerEntry[] = [{ userId: "u1", amount: 300 }];
        const result = calculateManualPayment(300, members, payers);
        const alice = result.owedList.find((m) => m.userId === "u1");
        expect(alice?.hasPaid).toBe(true);
    });

    it("handles zero total with valid empty payers", () => {
        const result = calculateManualPayment(0, members, []);
        expect(result.isValid).toBe(true);
        expect(result.delta).toBe(0);
    });
});

describe("calculateManualDebts", () => {
    it("creates debts from non-payers to payers", () => {
        const payers: PayerEntry[] = [{ userId: "u1", amount: 300 }];
        const debts = calculateManualDebts(300, members, payers);

        // u2 and u3 each owe 100 to u1
        expect(debts.length).toBeGreaterThan(0);
        debts.forEach((d) => {
            expect(d.toUser).toBe("u1");
            expect(d.amount).toBeCloseTo(100, 1);
        });
    });

    it("handles two payers correctly", () => {
        const payers: PayerEntry[] = [
            { userId: "u1", amount: 150 },
            { userId: "u2", amount: 150 },
        ];
        const debts = calculateManualDebts(300, members, payers);

        // u3 owes 100, split between u1 (gets 50 back) and u2 (gets 50 back)
        // net: u1 paid 150, owes 100 => owed 50; u2 paid 150, owes 100 => owed 50; u3 owes 100
        const totalOwed = debts.reduce((s, d) => s + d.amount, 0);
        expect(totalOwed).toBeCloseTo(100, 1);
    });

    it("returns empty array with no payers", () => {
        const debts = calculateManualDebts(300, members, []);
        expect(debts).toHaveLength(0);
    });

    it("returns empty array with no members", () => {
        const debts = calculateManualDebts(300, [], [{ userId: "u1", amount: 300 }]);
        expect(debts).toHaveLength(0);
    });

    it("handles single member who paid everything", () => {
        const singleMember = [makeMember("u1", "Alice")];
        const payers: PayerEntry[] = [{ userId: "u1", amount: 100 }];
        const debts = calculateManualDebts(100, singleMember, payers);
        // Only one member who paid, no debts needed
        expect(debts).toHaveLength(0);
    });
});
