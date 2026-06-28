"use client";
import { Wifi, WifiOff, ShieldCheck, UserCircle } from "lucide-react";

export default function Navbar({ isOnline, role }: { isOnline: boolean, role: string }) {
  const roleStyles: any = {
    OWNER: "bg-indigo-100 text-indigo-700 border-indigo-200",
    EDITOR: "bg-emerald-100 text-emerald-700 border-emerald-200",
    VIEWER: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <nav className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="font-black text-slate-800 uppercase tracking-tighter text-sm md:text-base">
          EdTech Studio <span className="text-indigo-600">v2.1</span>
        </h1>
        
        {/* CURRENT ROLE BADGE - Mandatory Visibility */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${roleStyles[role] || roleStyles.VIEWER}`}>
          <ShieldCheck size={12} />
          {role} ACCESS
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* CONNECTION STATUS */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black border transition-all ${
          isOnline ? 'bg-green-50 text-green-600 border-green-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {isOnline ? <Wifi size={12} className="animate-pulse"/> : <WifiOff size={12}/>}
          <span className="hidden sm:inline">{isOnline ? 'LIVE SYNC' : 'OFFLINE'}</span>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
        
        {/* USER PROFILE INFO */}
        <div className="hidden md:flex items-center gap-2 text-slate-500">
          <UserCircle size={20} className="text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Current Session</span>
        </div>
      </div>
    </nav>
  );
}