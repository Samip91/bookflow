"use client";

import { Users, CalendarCheck, Clock, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Today's Overview</h1>
          <p className="text-slate-500 mt-1">Here is what is happening at your business today.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all w-max">
          + New Appointment
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Bookings" value="24" icon={CalendarCheck} trend="+12% from last week" />
        <StatCard title="Upcoming Today" value="8" icon={Clock} trend="2 pending confirmation" />
        <StatCard title="Active Customers" value="142" icon={Users} trend="+3 this week" />
        <StatCard title="Revenue (MVP)" value="Rs. 12,500" icon={TrendingUp} trend="+5% from yesterday" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar / Schedule column */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Upcoming Appointments
          </h2>
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p>No appointments found.</p>
            <p className="text-sm mt-1">We will connect Firestore here in Phase 2!</p>
          </div>
        </div>

        {/* Recent Activity column */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem time="10 mins ago" text="New booking from Ram Bahadur" />
            <ActivityItem time="1 hour ago" text="Sita updated her phone number" />
            <ActivityItem time="2 hours ago" text="SMS Reminder sent to Hari" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// Local Presentational Components
// ------------------------------

function StatCard({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4">{trend}</p>
    </div>
  );
}

function ActivityItem({ time, text }: { time: string, text: string }) {
  return (
    <div className="flex gap-4 relative">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
        <div className="w-px h-full bg-slate-200 my-1" />
      </div>
      <div className="pb-4">
        <p className="text-sm text-slate-700">{text}</p>
        <p className="text-xs text-slate-400">{time}</p>
      </div>
    </div>
  );
}
