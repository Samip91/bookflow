"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAvailability, DayAvailability } from "@/hooks/firebase/useAvailability";
import { Clock, Plus, Save, X } from "lucide-react";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityPage() {
  const { user } = useAuth();
  const { dbSchedule, isLoading, isSaving, saveConfiguration } = useAvailability(user?.businessId);
  const [schedule, setSchedule] = useState<DayAvailability[]>([]);

  // Sync the hook state (from database) into the local UI state
  useEffect(() => {
    if (dbSchedule.length > 0) {
      setSchedule(dbSchedule);
    }
  }, [dbSchedule]);

  const toggleDay = (dayIndex: number) => {
    setSchedule(prev => prev.map((day, i) => i === dayIndex ? { ...day, isActive: !day.isActive } : day));
  };

  const updateTime = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(prev => prev.map((day, i) => i === dayIndex ? { ...day, [field]: value } : day));
  };

  const addBreak = (dayIndex: number) => {
    setSchedule(prev => prev.map((day, i) => {
      if (i === dayIndex) {
        return { ...day, breaks: [...day.breaks, { start: "12:00", end: "13:00" }] };
      }
      return day;
    }));
  };

  const updateBreak = (dayIndex: number, breakIndex: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => prev.map((day, i) => {
      if (i === dayIndex) {
        const newBreaks = [...day.breaks];
        newBreaks[breakIndex] = { ...newBreaks[breakIndex], [field]: value };
        return { ...day, breaks: newBreaks };
      }
      return day;
    }));
  };

  const removeBreak = (dayIndex: number, breakIndex: number) => {
    setSchedule(prev => prev.map((day, i) => {
      if (i === dayIndex) {
        return { ...day, breaks: day.breaks.filter((_, bIdx) => bIdx !== breakIndex) };
      }
      return day;
    }));
  };

  const saveToFirebase = async () => {
    try {
      await saveConfiguration(schedule);
      alert("Weekly availability saved securely via custom hook!");
    } catch(err) {
      console.error(err);
      alert("Failed to save schedule.");
    }
  };

  if (isLoading) return <div className="p-8 text-slate-500 animate-pulse font-medium">Loading schedule from secure database...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Availability</h1>
          <p className="text-slate-500 mt-1">Configure your weekly recurring business hours.</p>
        </div>
        <button 
          onClick={saveToFirebase}
          disabled={isSaving}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all disabled:opacity-50 w-max"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving Configuration..." : "Save Schedule"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {schedule.map((day, dayIndex) => (
          <div key={day.dayOfWeek} className={`p-6 transition-colors ${!day.isActive ? 'bg-slate-50/50' : 'bg-white'}`}>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              
              {/* Day Toggle & Label */}
              <div className="flex items-center gap-4 w-40 shrink-0 mt-1">
                <button
                  type="button"
                  onClick={() => toggleDay(dayIndex)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                    day.isActive ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${day.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className={`font-semibold ${day.isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                  {DAYS_OF_WEEK[day.dayOfWeek]}
                </span>
              </div>

              {/* Working Hours Input */}
              {day.isActive ? (
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <input 
                        type="time" 
                        value={day.startTime}
                        onChange={(e) => updateTime(dayIndex, 'startTime', e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium bg-slate-50 hover:bg-white transition-colors"
                      />
                    </div>
                    <span className="text-slate-400 font-medium">to</span>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={day.endTime}
                        onChange={(e) => updateTime(dayIndex, 'endTime', e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium bg-slate-50 hover:bg-white transition-colors"
                      />
                    </div>
                    
                    <button 
                      onClick={() => addBreak(dayIndex)}
                      className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                    >
                      <Plus className="w-4 h-4" /> Add Break
                    </button>
                  </div>

                  {/* Breaks Breakdown */}
                  {day.breaks.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      {day.breaks.map((brk, breakIndex) => (
                        <div key={breakIndex} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200 w-max group transition-colors hover:border-slate-300">
                          <Clock className="w-4 h-4 text-slate-400 ml-1" />
                          <input 
                            type="time" 
                            value={brk.start}
                            onChange={(e) => updateBreak(dayIndex, breakIndex, 'start', e.target.value)}
                            className="bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-600 font-medium"
                          />
                          <span className="text-slate-300">-</span>
                          <input 
                            type="time" 
                            value={brk.end}
                            onChange={(e) => updateBreak(dayIndex, breakIndex, 'end', e.target.value)}
                            className="bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-600 font-medium"
                          />
                          <button onClick={() => removeBreak(dayIndex, breakIndex)} className="text-slate-400 hover:text-red-500 px-2 transition-colors opacity-0 group-hover:opacity-100">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center text-slate-400 text-sm py-1.5 font-medium">
                  Closed (No Bookings)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
