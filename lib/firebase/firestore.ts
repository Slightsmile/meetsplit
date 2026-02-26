import { db } from "./config";
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    runTransaction,
    writeBatch,
    query,
    where,
    getDocs,
    onSnapshot
} from "firebase/firestore";
import {
    RoomData,
    RoomMemberData,
    UserAvailability,
    ExpenseData,
    ExpenseParticipantData
} from "@/types/firebase";

export async function createRoom(roomId: string, name: string, adminId: string, currency: string = "USD") {
    const roomRef = doc(db, "rooms", roomId);
    const roomData: RoomData = {
        roomId,
        name,
        adminId,
        isLocked: false,
        currency,
        createdAt: new Date().toISOString(),
    };
    await setDoc(roomRef, roomData);
    return roomData;
}

export async function getRoomById(roomId: string): Promise<RoomData | null> {
    const roomRef = doc(db, "rooms", roomId);
    const snap = await getDoc(roomRef);
    if (snap.exists()) return snap.data() as RoomData;
    return null;
}

export async function joinRoom(roomId: string, userId: string, displayName: string) {
    // Check if room exists and is not locked
    const room = await getRoomById(roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");
    if (room.isLocked) throw new Error("ROOM_LOCKED");

    const memberRef = doc(db, "roomMembers", `${roomId}_${userId}`);
    const memberData: RoomMemberData = {
        roomId,
        userId,
        displayName,
        joinedAt: new Date().toISOString()
    };
    await setDoc(memberRef, memberData);
    return memberData;
}

export async function updateAvailability(
    roomId: string,
    userId: string,
    availableDates: string[],
    timeSlots?: Record<string, string[]>
) {
    const availRef = doc(db, "availability", `${roomId}_${userId}`);

    // Transform array of dates into the dates object schema
    const datesObj: Record<string, { isAvailable: boolean; timeSlots?: string[] }> = {};
    availableDates.forEach(date => {
        datesObj[date] = {
            isAvailable: true,
            ...(timeSlots?.[date]?.length ? { timeSlots: timeSlots[date] } : {})
        };
    });

    const availData: UserAvailability = {
        roomId,
        userId,
        dates: datesObj,
        updatedAt: new Date().toISOString()
    };

    await setDoc(availRef, availData, { merge: true });
}

export async function addExpense(
    expenseId: string,
    roomId: string,
    description: string,
    totalAmount: number,
    paidByUserId: string,
    splitType: "EQUAL" | "MANUAL",
    participants: { userId: string, owedAmount: number }[]
) {
    const batch = writeBatch(db);

    // Main expense doc
    const expRef = doc(db, "expenses", expenseId);
    const expData: ExpenseData = {
        expenseId,
        roomId,
        description,
        totalAmount,
        paidByUserId,
        splitType,
        createdAt: new Date().toISOString()
    };
    batch.set(expRef, expData);

    // Participant docs
    participants.forEach(p => {
        const pRef = doc(db, "expenseParticipants", `${expenseId}_${p.userId}`);
        const pData: ExpenseParticipantData = {
            expenseId,
            roomId,
            userId: p.userId,
            owedAmount: p.owedAmount,
            hasPaid: false
        };
        batch.set(pRef, pData);
    });

    await batch.commit();
}
