"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { doc } from "firebase/firestore";

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  isActive: boolean;
}

export function useServices(businessId: string | undefined) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setServices([]);
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, "services"), where("businessId", "==", businessId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Service[];
      setServices(servicesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const addService = async (data: Omit<Service, "id">) => {
    if (!businessId) throw new Error("Missing business ID");
    return await addDoc(collection(db, "services"), {
      ...data,
      businessId,
      createdAt: serverTimestamp()
    });
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    return await updateDoc(doc(db, "services", id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const deleteService = async (id: string) => {
    return await deleteDoc(doc(db, "services", id));
  };

  return { services, isLoading, addService, updateService, deleteService };
}
