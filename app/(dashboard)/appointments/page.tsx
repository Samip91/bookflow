"use client";

import { useState, useMemo, memo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppointments, Appointment, AppointmentStatus } from "@/hooks/firebase/useAppointments";
import { useCustomers } from "@/hooks/firebase/useCustomers";
import { useServices } from "@/hooks/firebase/useServices";
import { Calendar as CalendarIcon, Clock, Phone, CheckCircle, XCircle, AlertCircle, Plus, ChevronLeft, ChevronRight, X, UserPlus, Check } from "lucide-react";

// --- Utility Functions (Zero Dependencies) ---
const formatYYYYMMDD = (d: Date) => {
  const year = d.getFullYear(); 
  const month = String(d.getMonth() + 1).padStart(2, '0'); 
  const day = String(d.getDate()).padStart(2, '0'); 
  return `${year}-${month}-${day}`; 
};

// Formats "2026-04-03" into "Friday, April 03, 2026"
const formatHumanDate = (d: Date) => {
  return d.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Converts "09:30" to 570 for easy overlap math
const timeToMinutes = (timeString: string) => {
  const [h, m] = timeString.split(':').map(Number);
  return (h * 60) + m;
};


// --- MEMOIZED UI COMPONENTS ---
// React.memo prevents heavy row re-rendering when the user is typing in the Modal input fields above!
const AppointmentCard = memo(({ 
  appt, 
  serviceMap, 
  customerMap, 
  onStatusChange 
}: { 
  appt: Appointment, 
  serviceMap: Record<string, any>, 
  customerMap: Record<string, any>,
  onStatusChange: (id: string, status: AppointmentStatus) => void
}) => {
  const service = serviceMap[appt.serviceId];
  const customer = customerMap[appt.customerId];

  const statusColors = {
    booked: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    no_show: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <div className={`flex gap-4 p-5 rounded-2xl border ${statusColors[appt.status]} transition-all group relative overflow-hidden shadow-sm hover:shadow-md`}>
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-current opacity-20"></div>
      
      {/* Time Column */}
      <div className="w-20 shrink-0 text-right space-y-1">
        <div className="text-xl font-bold tracking-tight">{appt.startTime}</div>
        <div className="text-xs font-semibold uppercase opacity-70">
          {service?.duration ? `${service.duration} Min` : "N/A"}
        </div>
      </div>

      <div className="w-px bg-current opacity-20 hidden sm:block"></div>

      {/* Core Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold truncate">{customer?.name || "Unknown Customer"}</h3>
        <p className="text-sm font-medium opacity-80 mt-0.5">{service?.name || "Unknown Service"}</p>
        
        <div className="flex items-center gap-4 mt-3 text-sm opacity-70">
          <div className="flex items-center gap-1.5"><Phone className="w-4 h-4"/> {customer?.phone || "No Phone"}</div>
        </div>
        
        {appt.notes && (
          <div className="mt-3 text-sm bg-white/40 p-2 rounded-lg italic">"{appt.notes}"</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end justify-between shrink-0">
        <select 
          value={appt.status}
          onChange={(e) => onStatusChange(appt.id, e.target.value as AppointmentStatus)}
          className="bg-white/60 border-none rounded-lg text-sm font-semibold focus:ring-0 cursor-pointer hover:bg-white transition-colors outline-none"
        >
          <option value="booked">Booked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        
        <div className="text-xs font-semibold opacity-60">ID: {appt.id.slice(-4)}</div>
      </div>
    </div>
  );
});
AppointmentCard.displayName = "AppointmentCard";


// --- MAIN PAGE OVERVIEW ---

export default function AppointmentsPage() {
  const { user } = useAuth();
  
  // Date Navigation State
  const [activeDateObj, setActiveDateObj] = useState(new Date());
  const activeDateString = useMemo(() => formatYYYYMMDD(activeDateObj), [activeDateObj]);
  
  // Clean Architecture Hooks
  const { appointments, isLoading: apptsLoading, createAppointment, updateAppointmentStatus } = useAppointments(user?.businessId, activeDateString);
  const { customers, isLoading: custLoading, addCustomer } = useCustomers(user?.businessId);
  const { services, isLoading: svcLoading } = useServices(user?.businessId);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [draftPhone, setDraftPhone] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftServiceId, setDraftServiceId] = useState("");
  const [draftTime, setDraftTime] = useState("09:00");
  const [draftNotes, setDraftNotes] = useState("");

  // Memoized maps for rapid fast lookups in UI (O(1) complexity instead of finding inside arrays on render)
  const serviceMap = useMemo(() => {
    return services.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {} as Record<string, any>);
  }, [services]);

  const customerMap = useMemo(() => {
    return customers.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {} as Record<string, any>);
  }, [customers]);

  // Stable handler for React.memo optimization
  const handleStatusChange = useCallback((id: string, status: AppointmentStatus) => {
    updateAppointmentStatus(id, status);
  }, [updateAppointmentStatus]);

  // SMART AUTO-DETECT CUSTOMER LOGIC
  const autoMatchedCustomer = useMemo(() => {
    if (draftPhone.length < 5) return null;
    // Strip non-numerics to ensure matching works smoothly
    const normalizedDraft = draftPhone.replace(/[^0-9+]/g, '');
    return customers.find(c => c.phone.replace(/[^0-9+]/g, '') === normalizedDraft);
  }, [draftPhone, customers]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.businessId) return;

    // --- DOUBLE BOOKING VALIDATION ---
    const newStartMins = timeToMinutes(draftTime);
    const newDuration = serviceMap[draftServiceId]?.duration || 30; // default 30 min fallback
    const newEndMins = newStartMins + newDuration;

    const hasConflict = appointments.some(appt => {
      if (appt.status === 'cancelled' || appt.status === 'no_show') return false; // Allowed to book over cancelled slots
      
      const existStartMins = timeToMinutes(appt.startTime);
      const existDuration = serviceMap[appt.serviceId]?.duration || 30;
      const existEndMins = existStartMins + existDuration;

      // True Overlap Condition: The new slot starts before the existing one ends, AND ends after the existing one starts.
      return newStartMins < existEndMins && newEndMins > existStartMins;
    });

    if (hasConflict) {
      alert(`Double Booking Error! This slot overlaps with an existing appointment.`);
      return;
    }

    setIsSubmitting(true);
    let targetCustomerId = "";

    try {
      if (autoMatchedCustomer) {
        targetCustomerId = autoMatchedCustomer.id;
      } else {
        // Create new customer atomically in the backend rolodex
        targetCustomerId = await addCustomer({
          name: draftName || "Unknown",
          phone: draftPhone,
          email: ""
        });
      }

      // Connect it all together
      await createAppointment({
        customerId: targetCustomerId,
        serviceId: draftServiceId,
        dateString: activeDateString,
        startTime: draftTime,
        notes: draftNotes
      });

      // Successful Reset
      setIsModalOpen(false);
      setDraftPhone("");
      setDraftName("");
      setDraftNotes("");
    } catch(err) {
      alert("Failed to secure appointment lock.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (apptsLoading || custLoading || svcLoading) {
    return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading secure agenda...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Date Header Controller */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Date Navigator */}
        <div className="flex items-center justify-between w-full md:w-max gap-4">
          <button 
            onClick={() => setActiveDateObj(addDays(activeDateObj, -1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          
          <div className="flex flex-col items-center min-w-[200px]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{activeDateString}</span>
            <span className="text-xl font-extrabold text-slate-900">{formatHumanDate(activeDateObj)}</span>
          </div>

          <button 
            onClick={() => setActiveDateObj(addDays(activeDateObj, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shrink-0"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
          
          <button 
            onClick={() => setActiveDateObj(new Date())}
            className="hidden lg:block ml-4 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Today
          </button>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium shadow-md transition-all w-full md:w-max shrink-0"
        >
          <Plus className="w-5 h-5" /> Walk-In Booking
        </button>
      </div>

      {/* Daily Agenda Feed */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center h-[400px] justify-center text-slate-400">
            <CalendarIcon className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-2xl font-bold text-slate-700">Clear Schedule</h3>
            <p className="mt-2 text-lg">Your agenda is completely clear for {formatHumanDate(activeDateObj)}.</p>
          </div>
        ) : (
          appointments.map(appt => (
            <AppointmentCard 
              key={appt.id} 
              appt={appt} 
              serviceMap={serviceMap} 
              customerMap={customerMap} 
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Admin Manual Booking Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
             
             <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
               <h2 className="text-xl font-extrabold text-slate-900">New Booking</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-white rounded-full shadow-sm"><X className="w-5 h-5" /></button>
             </div>
             
             <form onSubmit={handleBooking} className="p-6 flex-1 overflow-y-auto space-y-8">
               
               {/* -------------------- */}
               {/* AUTO-DETECT SEQUENCE */}
               {/* -------------------- */}
               <div className="space-y-4 shadow-sm border border-slate-100 p-5 rounded-2xl bg-white">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">1</div>
                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Client Logic</h3>
                 </div>

                 <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Search Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input 
                        type="tel"
                        value={draftPhone}
                        onChange={e => setDraftPhone(e.target.value)}
                        placeholder="e.g. 984XXXXXXX"
                        required
                        className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 bg-slate-50 focus:bg-white transition-colors"
                      />
                    </div>
                 </div>

                 {/* Match Result Display logic */}
                 {draftPhone.length >= 5 && (
                   <div className="animate-in fade-in zoom-in-95 duration-200">
                     {autoMatchedCustomer ? (
                       <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 w-full">
                         <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                         <div>
                           <p className="text-sm font-bold text-green-900">Recognized Client</p>
                           <p className="text-xs text-green-700 mt-0.5 font-medium">{autoMatchedCustomer.name} • {autoMatchedCustomer.totalVisits} visits logged</p>
                         </div>
                       </div>
                     ) : (
                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 shadow-inner">
                         <div className="flex items-start gap-3">
                           <UserPlus className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                           <div>
                             <p className="text-sm font-bold text-blue-900">New Customer Discovered</p>
                             <p className="text-xs text-blue-700 mt-0.5">Please provide their name to auto-register them.</p>
                           </div>
                         </div>
                         <input 
                            type="text"
                            value={draftName}
                            onChange={e => setDraftName(e.target.value)}
                            placeholder="Full Name"
                            required
                            className="w-full border border-blue-200 rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900"
                         />
                       </div>
                     )}
                   </div>
                 )}
               </div>

               {/* -------------------- */}
               {/* APPOINTMENT MAPPING  */}
               {/* -------------------- */}
               <div className="space-y-4 pt-4 border-t border-slate-100">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">2</div>
                   <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Booking Options</h3>
                 </div>

                 <div>
                   <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Requested Service</label>
                   <select 
                     required
                     value={draftServiceId}
                     onChange={e => setDraftServiceId(e.target.value)}
                     className="w-full border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                   >
                     <option value="" disabled>Select a service...</option>
                     {services.map(s => (
                       <option key={s.id} value={s.id}>{s.name} - Rs. {s.price}</option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Start Time</label>
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <input 
                        type="time" 
                        required
                        value={draftTime}
                        onChange={e => setDraftTime(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 bg-white"
                      />
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Notes (Optional)</label>
                   <textarea 
                     value={draftNotes}
                     onChange={e => setDraftNotes(e.target.value)}
                     placeholder="e.g. VIP client, requires special care..."
                     className="w-full border border-slate-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none bg-slate-50 focus:bg-white transition-colors"
                   />
                 </div>
               </div>

               <div className="pt-6 mt-auto">
                 <button 
                   type="submit" 
                   disabled={isSubmitting || (!autoMatchedCustomer && !draftName)}
                   className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all text-lg"
                 >
                   {isSubmitting ? "Processing..." : "Confirm Application"}
                   {!isSubmitting && <Check className="w-5 h-5" />}
                 </button>
                 <p className="text-center text-xs text-slate-400 mt-3 font-medium">This will lock the slot securely for {activeDateString}</p>
               </div>
             </form>
           </div>
         </div>
      )}

    </div>
  );
}
