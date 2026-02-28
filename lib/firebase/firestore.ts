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

export async function updateRoomAnnouncement(roomId: string, announcement: { notice: string; place: string; time: string; menu: string }) {
    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, { announcement });
}

export async function updateRoomCurrency(roomId: string, currency: string) {
    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, { currency });
}

export async function toggleEventMode(roomId: string, isEventMode: boolean) {
    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, { isEventMode });
}

export async function setEventDate(roomId: string, eventDate: string) {
    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, { eventDate });
}

export async function createRoom(roomId: string, name: string, adminId: string, currency: string = "BDT") {
    const roomRef = doc(db, "rooms", roomId);
    const roomData: RoomData = {
        roomId,
        name,
        adminId,
        isLocked: false,
        isEventMode: false,
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

export async function isUserMember(roomId: string, userId: string): Promise<boolean> {
    const memberRef = doc(db, "roomMembers", `${roomId}_${userId}`);
    const snap = await getDoc(memberRef);
    return snap.exists();
}

export async function joinRoom(roomId: string, userId: string, displayName: string) {
    // Check if room exists
    const room = await getRoomById(roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");

    // Check if this user already has a membership (same uid) — allow even if locked
    const memberRef = doc(db, "roomMembers", `${roomId}_${userId}`);
    const existingMember = await getDoc(memberRef);
    if (existingMember.exists()) {
        // Update display name if changed, but don't create duplicate
        await updateDoc(memberRef, { displayName });
        return existingMember.data() as RoomMemberData;
    }

    // Check if a member with the same display name already exists in this room
    // This allows session recovery: a returning user with a new anonymous UID
    // re-enters their name + room code and gets merged back into their original identity
    const membersQuery = query(
        collection(db, "roomMembers"),
        where("roomId", "==", roomId),
        where("displayName", "==", displayName)
    );
    const existingByName = await getDocs(membersQuery);
    if (!existingByName.empty) {
        // Same name already exists — merge this user into the existing membership
        const existingDoc = existingByName.docs[0];
        const oldUserId = existingDoc.data().userId;
        await updateDoc(existingDoc.ref, { userId });
        // Also create the new key so future lookups work
        const memberData: RoomMemberData = {
            roomId,
            userId,
            displayName,
            joinedAt: existingDoc.data().joinedAt
        };
        await setDoc(memberRef, memberData);
        // Delete old document if key differs
        if (existingDoc.id !== `${roomId}_${userId}`) {
            await deleteDoc(existingDoc.ref);
        }
        // Migrate availability data from old userId to new userId
        if (oldUserId !== userId) {
            const oldAvailRef = doc(db, "availability", `${roomId}_${oldUserId}`);
            const oldAvailSnap = await getDoc(oldAvailRef);
            if (oldAvailSnap.exists()) {
                const newAvailRef = doc(db, "availability", `${roomId}_${userId}`);
                const availData = oldAvailSnap.data() as UserAvailability;
                await setDoc(newAvailRef, { ...availData, userId });
                await deleteDoc(oldAvailRef);
            }
        }
        return memberData;
    }

    // Only check lock for genuinely NEW members (not returning users)
    if (room.isLocked) throw new Error("ROOM_LOCKED");

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

export async function removeMember(roomId: string, userId: string) {
    const memberRef = doc(db, "roomMembers", `${roomId}_${userId}`);
    await deleteDoc(memberRef);

    // Also remove their availability
    const availRef = doc(db, "availability", `${roomId}_${userId}`);
    const availSnap = await getDoc(availRef);
    if (availSnap.exists()) {
        await deleteDoc(availRef);
    }
}

export async function addExpense(
    expenseId: string,
    roomId: string,
    description: string,
    totalAmount: number,
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

export async function updateRoomPayments(roomId: string, payments: { userId: string, paidAmount: number }[]) {
    const batch = writeBatch(db);

    payments.forEach(p => {
        const pRef = doc(db, "roomPayments", `${roomId}_${p.userId}`);
        const pData = {
            roomId,
            userId: p.userId,
            paidAmount: p.paidAmount,
            updatedAt: new Date().toISOString()
        };
        batch.set(pRef, pData, { merge: true });
    });

    await batch.commit();
}
