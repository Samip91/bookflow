"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

export type AppointmentStatus = 'booked' | 'cancelled' | 'completed' | 'no_show';

export interface Appointment {
  id: string;
  customerId: string;
  serviceId: string;
  dateString: string; // 'YYYY-MM-DD' for easy day queries
  startTime: string; // 'HH:MM'
  status: AppointmentStatus;
  source: 'web' | 'admin';
  notes?: string;
}

export function useAppointments(businessId: string | undefined, dateString: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to live database changes strictly isolated to this business and this specific Day
  useEffect(() => {
    if (!businessId || !dateString) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }

    // Notice we do NOT use orderBy() here to avoid immediate Indexing crashes on MVP.
    // Instead we query the subset (by Business + Day) and sort chronologically in memory below.
    const q = query(
      collection(db, "appointments"), 
      where("businessId", "==", businessId),
      where("dateString", "==", dateString)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
      
      // Sort chronologically ascending
      dbData.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      setAppointments(dbData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [businessId, dateString]);

  const createAppointment = async (data: Omit<Appointment, "id" | "status" | "source">) => {
    if (!businessId) throw new Error("Missing business ID");
    
    return await addDoc(collection(db, "appointments"), {
      ...data,
      businessId,
      status: "booked", // Always defaults to active 'booked'
      source: "admin",  // Tracked from dashboard vs web
      reminderSent: false, // Core field for Phase 4 SMS integration
      createdAt: serverTimestamp()
    });
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    return await updateDoc(doc(db, "appointments", id), {
      status,
      updatedAt: serverTimestamp()
    });
  };

  const updateNotes = async (id: string, notes: string) => {
    return await updateDoc(doc(db, "appointments", id), {
      notes,
      updatedAt: serverTimestamp()
    });
  };

  return { appointments, isLoading, createAppointment, updateAppointmentStatus, updateNotes };
}
