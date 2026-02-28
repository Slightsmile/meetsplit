import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { RoomData, RoomMemberData, UserAvailability, ExpenseData, ExpenseParticipantData, RoomPaymentData } from "@/types/firebase";

export function useRoomData(roomId: string) {
    const [room, setRoom] = useState<RoomData | null>(null);
    const [members, setMembers] = useState<RoomMemberData[]>([]);
    const [availabilities, setAvailabilities] = useState<UserAvailability[]>([]);
    const [expenses, setExpenses] = useState<ExpenseData[]>([]);
    const [expenseParts, setExpenseParts] = useState<ExpenseParticipantData[]>([]);
    const [roomPayments, setRoomPayments] = useState<RoomPaymentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!roomId) return;

        // Room doc
        const unsubRoom = onSnapshot(doc(db, "rooms", roomId), (doc) => {
            if (doc.exists()) {
                setRoom(doc.data() as RoomData);
            } else {
                setRoom(null);
            }
        });

        // Members
        const qMembers = query(collection(db, "roomMembers"), where("roomId", "==", roomId));
        const unsubMembers = onSnapshot(qMembers, (snap) => {
            setMembers(snap.docs.map(d => d.data() as RoomMemberData));
        });

        // Availability
        const qAvail = query(collection(db, "availability"), where("roomId", "==", roomId));
        const unsubAvail = onSnapshot(qAvail, (snap) => {
            setAvailabilities(snap.docs.map(d => d.data() as UserAvailability));
        });

        // Expenses
        const qExp = query(collection(db, "expenses"), where("roomId", "==", roomId));
        const unsubscribeExpenses = onSnapshot(qExp, (snap) => {
            setExpenses(snap.docs.map(d => d.data() as ExpenseData));
        });

        // Expense Participants
        const qExpParts = query(collection(db, "expenseParticipants"), where("roomId", "==", roomId));
        const unsubscribeExpenseParts = onSnapshot(qExpParts, (snap) => {
            const data: ExpenseParticipantData[] = [];
            snap.forEach(doc => data.push(doc.data() as ExpenseParticipantData));
            setExpenseParts(data);
        });

        // 6. Listen to room payments
        const paymentsQuery = query(collection(db, "roomPayments"), where("roomId", "==", roomId));
        const unsubscribePayments = onSnapshot(paymentsQuery, (snap) => {
            const data: RoomPaymentData[] = [];
            snap.forEach(doc => data.push(doc.data() as RoomPaymentData));
            setRoomPayments(data);
        });

        // We can just assume it loads fast enough or combine loading states, but for simplicity:
        const t = setTimeout(() => setLoading(false), 500);

        return () => {
            unsubRoom();
            unsubMembers();
            unsubAvail();
            unsubscribeExpenses();
            unsubscribeExpenseParts();
            unsubscribePayments();
            clearTimeout(t);
        };
    }, [roomId]);

    return { room, members, availabilities, expenses, expenseParts, roomPayments, loading };
}
