/**
 * One-time script to clear all Firestore collections and Firebase Auth users.
 * 
 * Usage:
 *   1. Set GOOGLE_APPLICATION_CREDENTIALS env var to your Firebase service account key file
 *      OR place a serviceAccountKey.json in this directory.
 *   2. Run: npx ts-node scripts/clear-database.ts
 * 
 * WARNING: This permanently deletes ALL data. Use with extreme caution.
 */

import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as path from "path";
import * as fs from "fs";

const COLLECTIONS = [
    "rooms",
    "roomMembers",
    "availability",
    "expenses",
    "expenseParticipants",
    "roomPayments",
    "users",
];

// Initialize with service account
const keyPath = path.resolve(__dirname, "serviceAccountKey.json");
if (fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8")) as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount) });
} else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS env var
    initializeApp();
}

const db = getFirestore();
const auth = getAuth();

async function deleteCollection(collectionName: string) {
    const colRef = db.collection(collectionName);
    let totalDeleted = 0;

    while (true) {
        const snapshot = await colRef.limit(500).get();
        if (snapshot.empty) break;

        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        totalDeleted += snapshot.size;
    }

    console.log(`  ✓ Deleted ${totalDeleted} docs from "${collectionName}"`);
}

async function deleteAllUsers() {
    let totalDeleted = 0;
    let nextPageToken: string | undefined;

    do {
        const listResult = await auth.listUsers(1000, nextPageToken);
        if (listResult.users.length === 0) break;

        const uids = listResult.users.map((u) => u.uid);
        await auth.deleteUsers(uids);
        totalDeleted += uids.length;
        nextPageToken = listResult.pageToken;
    } while (nextPageToken);

    console.log(`  ✓ Deleted ${totalDeleted} auth users`);
}

async function main() {
    console.log("=== MeetSplit Database Cleanup ===");
    console.log("Deleting all Firestore collections...\n");

    for (const col of COLLECTIONS) {
        await deleteCollection(col);
    }

    console.log("\nDeleting all Firebase Auth users...\n");
    await deleteAllUsers();

    console.log("\n✅ Database and auth fully cleared. Fresh start!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
