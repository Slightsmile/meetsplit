import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { RoomData, RoomMemberData, UserAvailability, ExpenseData, ExpenseParticipantData } from "@/types/firebase";

export function useRoomData(roomId: string) {
    const [room, setRoom] = useState<RoomData | null>(null);
    const [members, setMembers] = useState<RoomMemberData[]>([]);
    const [availabilities, setAvailabilities] = useState<UserAvailability[]>([]);
    const [expenses, setExpenses] = useState<ExpenseData[]>([]);
    const [expenseParts, setExpenseParts] = useState<ExpenseParticipantData[]>([]);
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
        const unsubExp = onSnapshot(qExp, (snap) => {
            setExpenses(snap.docs.map(d => d.data() as ExpenseData));
        });

        // Expense Participants
        const qExpParts = query(collection(db, "expenseParticipants"), where("roomId", "==", roomId));
        const unsubExpParts = onSnapshot(qExpParts, (snap) => {
            setExpenseParts(snap.docs.map(d => d.data() as ExpenseParticipantData));
        });

        // We can just assume it loads fast enough or combine loading states, but for simplicity:
        const t = setTimeout(() => setLoading(false), 500);

        return () => {
            unsubRoom();
            unsubMembers();
            unsubAvail();
            unsubExp();
            unsubExpParts();
            clearTimeout(t);
        };
    }, [roomId]);

    return { room, members, availabilities, expenses, expenseParts, loading };
}
