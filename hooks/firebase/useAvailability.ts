"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";

export interface Break {
  start: string;
  end: string;
}

export interface DayAvailability {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breaks: Break[];
}

export const DEFAULT_DAY = (day: number): DayAvailability => ({
  dayOfWeek: day,
  isActive: day > 0 && day < 6, // Mon-Fri active by default
  startTime: "09:00",
  endTime: "17:00",
  breaks: []
});

export function useAvailability(businessId: string | undefined) {
  const [dbSchedule, setDbSchedule] = useState<DayAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    const fetchSchedule = async () => {
      try {
        const q = query(collection(db, "availability"), where("businessId", "==", businessId));
        const snapshot = await getDocs(q);
        
        const baseSchedule = Array.from({ length: 7 }, (_, i) => DEFAULT_DAY(i));
        
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data() as DayAvailability;
          const index = baseSchedule.findIndex(d => d.dayOfWeek === data.dayOfWeek);
          if (index !== -1) {
             baseSchedule[index] = data;
          }
        });
        
        setDbSchedule(baseSchedule);
      } catch (err) {
        console.error("Failed to load schedule", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSchedule();
  }, [businessId]);

  const saveConfiguration = async (updatedSchedule: DayAvailability[]) => {
    if (!businessId) throw new Error("Missing business ID");
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      updatedSchedule.forEach(day => {
        const docRef = doc(db, "availability", `${businessId}_${day.dayOfWeek}`);
        batch.set(docRef, { ...day, businessId }, { merge: true });
      });
      await batch.commit();
      setDbSchedule(updatedSchedule);
    } finally {
      setIsSaving(false);
    }
  };

  return { dbSchedule, isLoading, isSaving, saveConfiguration };
}
