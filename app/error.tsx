"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, this would send to Sentry or Datadog
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
        <AlertCircle className="w-10 h-10 text-red-500 shadow-sm" />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Encountered an Error</h2>
      <p className="text-slate-500 mt-3 max-w-md text-lg">
        The workspace encountered an unexpected architectural error. Please reload the dashboard to recover your session.
      </p>
      
      <div className="flex gap-4 mt-8">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all"
        >
          Return to Dashboard
        </button>
        <button
          onClick={() => reset()}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-red-500/20 transition-all"
        >
          Attempt Recovery
        </button>
      </div>
    </div>
  );
}
