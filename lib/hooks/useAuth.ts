import { useState, useEffect } from "react";
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userRef = doc(db, "users", firebaseUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            uid: firebaseUser.uid,
                            displayName: `Guest_${firebaseUser.uid.substring(0, 4)}`,
                            email: firebaseUser.email || null,
                            isAnonymous: firebaseUser.isAnonymous,
                            createdAt: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error("Error creating user doc:", error);
                } finally {
                    setUser(firebaseUser);
                    setLoading(false);
                }
            } else {
                // Auto sign-in anonymously
                setUser(null);
                try {
                    await signInAnonymously(auth);
                } catch (e) {
                    console.error("Failed to sign in anonymously", e);
                    setLoading(false);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
}
