import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

initializeApp();

const db = getFirestore();
const auth = getAuth();

const COLLECTIONS = ["rooms", "roomMembers", "availability", "expenses", "expenseParticipants", "roomPayments"];
const MAX_AGE_DAYS = 30;

/**
 * Scheduled Cloud Function that runs daily at 2:00 AM UTC.
 * Deletes all rooms older than 30 days and their associated data,
 * plus anonymous Firebase Auth users older than 30 days.
 */
export const cleanupOldData = onSchedule("every day 02:00", async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
    const cutoffISO = cutoff.toISOString();

    console.log(`[cleanup] Deleting data older than ${cutoffISO}`);

    // 1. Find rooms older than 30 days
    const roomsSnap = await db
        .collection("rooms")
        .where("createdAt", "<", cutoffISO)
        .get();

    if (roomsSnap.empty) {
        console.log("[cleanup] No old rooms found.");
    } else {
        const roomIds = roomsSnap.docs.map((d) => d.id);
        console.log(`[cleanup] Found ${roomIds.length} old rooms to delete.`);

        // Delete in batches of 500 (Firestore limit)
        for (const roomId of roomIds) {
            await deleteRoomAndRelatedData(roomId);
        }
    }

    // 2. Clean up anonymous auth users older than 30 days
    await cleanupOldAnonymousUsers(cutoff);

    console.log("[cleanup] Done.");
});

async function deleteRoomAndRelatedData(roomId: string) {
    const batch = db.batch();
    let count = 0;

    // Delete room doc
    batch.delete(db.collection("rooms").doc(roomId));
    count++;

    // Delete related docs from each sub-collection
    for (const col of COLLECTIONS.slice(1)) {
        const snap = await db
            .collection(col)
            .where("roomId", "==", roomId)
            .get();

        for (const doc of snap.docs) {
            batch.delete(doc.ref);
            count++;

            // Commit every 490 to stay under the 500 limit
            if (count >= 490) {
                await batch.commit();
                count = 0;
            }
        }
    }

    if (count > 0) {
        await batch.commit();
    }

    console.log(`[cleanup] Deleted room ${roomId} and related data.`);
}

async function cleanupOldAnonymousUsers(cutoff: Date) {
    let nextPageToken: string | undefined;
    let deletedCount = 0;

    do {
        const listResult = await auth.listUsers(1000, nextPageToken);

        const toDelete: string[] = [];
        for (const user of listResult.users) {
            if (!user.providerData.length) {
                // Anonymous user
                const createdAt = new Date(user.metadata.creationTime);
                if (createdAt < cutoff) {
                    toDelete.push(user.uid);
                }
            }
        }

        if (toDelete.length > 0) {
            await auth.deleteUsers(toDelete);
            deletedCount += toDelete.length;
        }

        nextPageToken = listResult.pageToken;
    } while (nextPageToken);

    console.log(`[cleanup] Deleted ${deletedCount} old anonymous users.`);
}
