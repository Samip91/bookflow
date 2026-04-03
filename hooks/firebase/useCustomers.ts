"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
}

export function useCustomers(businessId: string | undefined) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, "customers"), where("businessId", "==", businessId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Customer[];
      setCustomers(dbData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const addCustomer = async (data: Omit<Customer, "id" | "totalVisits">) => {
    if (!businessId) throw new Error("Missing business ID");
    
    // Add to securely isolated business collection
    const newDoc = await addDoc(collection(db, "customers"), {
      ...data,
      businessId,
      totalVisits: 0,
      createdAt: serverTimestamp()
    });
    
    return newDoc.id; // Return the exact ID so we can immediately inject it into an Appointment
  };

  return { customers, isLoading, addCustomer };
}
