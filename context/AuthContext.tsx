"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Extend the user to include our Firestore db properties
interface AppUser extends FirebaseAuthUser {
  businessId?: string;
  role?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: () => void;

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
      
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        if (unsubscribeFirestore) unsubscribeFirestore();
        return;
      }

      setUser(firebaseUser as AppUser);

      // Verify and fetch their tenant database assignment
      const userDocRef = doc(db, "users", firebaseUser.uid);
      
      unsubscribeFirestore = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const dbData = docSnap.data();
          setUser({
            ...firebaseUser,
            businessId: dbData.businessId,
            role: dbData.role
          });
          setLoading(false);
        } else {
          // DEVELOPMENT FALLBACK / MVP Client Provisioning
          // If the Cloud Function delay failed, we write it immediately from the frontend.
          try {
            console.log("No tenant found. Provisioning directly from client...");
            const newBizRef = doc(collection(db, "businesses"));
            
            // 1. Create Business
            await setDoc(newBizRef, {
              id: newBizRef.id,
              name: firebaseUser.displayName || "My Business",
              ownerId: firebaseUser.uid,
              slug: newBizRef.id,
              createdAt: serverTimestamp(),
              plan: "free"
            });
            
            // 2. Map User
            await setDoc(userDocRef, {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              businessId: newBizRef.id,
              role: "owner",
              createdAt: serverTimestamp()
            });
            
            // Note: We don't call setLoading(false) here because the setDoc
            // actually re-triggers the onSnapshot immediately above!
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

  return (
    <AuthContext.Provider value={{ user, loading }}>
        {children}
    </AuthContext.Provider>
  );
};
