"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseAuthUser, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface AppUser extends FirebaseAuthUser {
  businessId?: string;
  role?: string;
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentication & Database Live Syncer
  useEffect(() => {
    let unsubscribeFirestore: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        if (unsubscribeFirestore) unsubscribeFirestore();
        return;
      }

      setUser(firebaseUser as AppUser);

      const userDocRef = doc(db, "users", firebaseUser.uid);
      
      unsubscribeFirestore = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const dbData = docSnap.data();
          setUser({ ...firebaseUser, businessId: dbData.businessId, role: dbData.role });
          setLoading(false);
        } else {
          try {
            console.log("No tenant found. Provisioning directly from client...");
            const newBizRef = doc(collection(db, "businesses"));
            
            await setDoc(newBizRef, {
              id: newBizRef.id,
              name: firebaseUser.displayName || "My Business",
              ownerId: firebaseUser.uid,
              slug: newBizRef.id,
              createdAt: serverTimestamp(),
              plan: "free"
            });
            
            await setDoc(userDocRef, {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              businessId: newBizRef.id,
              role: "owner",
              createdAt: serverTimestamp()
            });
          } catch(err) {
            console.error("Client provisioning failed:", err);
            setLoading(false);
          }
        }
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Exposed Authentication Actions
  const loginWithEmail = async (email: string, pass: string) => {
    return await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    return await signOut(auth);
  };

  return { user, loading, loginWithEmail, loginWithGoogle, logout };
}
