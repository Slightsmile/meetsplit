export interface UserData {
    uid: string;
    displayName: string;
    email: string | null;
    isAnonymous: boolean;
    createdAt: string;
}

export interface RoomAnnouncement {
    notice: string;
    place: string;
    time: string;
    menu: string;
}

export interface RoomData {
    roomId: string;
    name: string;
    adminId: string;
    isLocked: boolean;
    isEventMode: boolean;
    eventDate?: string;
    currency: string;
    announcement?: RoomAnnouncement;
    createdAt: string;
}

export interface RoomMemberData {
    roomId: string; // denormalized
    userId: string;
    displayName: string; // denormalized
    joinedAt: string;
}

export interface UserAvailability {
    roomId: string;
    userId: string;
    dates: Record<string, {
        isAvailable: boolean;
        timeSlots?: string[];
    }>;
    updatedAt: string;
}

export interface ExpenseData {
    expenseId: string;
    roomId: string;
    description: string;
    totalAmount: number;
    paidByUserId: string;
    splitType: "EQUAL" | "MANUAL";
    createdAt: string;
}

export interface ExpenseParticipantData {
    expenseId: string;
    roomId: string;
    userId: string;
    owedAmount: number;
    hasPaid: boolean;
}
