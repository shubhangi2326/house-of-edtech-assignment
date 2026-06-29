"use client";
import { Wifi, WifiOff, ShieldCheck, UserCircle, Menu, MessageSquare } from "lucide-react";

interface NavbarProps {
  isOnline: boolean;
  role: string;
  toggleSidebar: () => void;
  toggleAi: () => void; // Added this prop
}

export default function Navbar({ isOnline, role, toggleSidebar, toggleAi }: NavbarProps) {
  const roleStyles: any = {
    OWNER: "bg-indigo-100 text-indigo-700 border-indigo-200",
    EDITOR: "bg-emerald-100 text-emerald-700 border-emerald-200",
    VIEWER: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <nav className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 md:px-8 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-[60]">
      
      {/* LEFT SECTION */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <h1 className="font-black text-slate-800 uppercase tracking-tighter text-xs sm:text-sm md:text-base whitespace-nowrap">
            EdTech <span className="text-indigo-600">Studio</span>
          </h1>
          
          {/* FIXED ROLE BADGE: No more '0' or 'O' at the end */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shrink-0 ${roleStyles[role] || roleStyles.VIEWER}`}>
            <ShieldCheck size={12} className="shrink-0" />
            <span className="hidden xs:inline">{role} ACCESS</span>
            <span className="xs:inline hidden"></span> {/* Removed charAt(0) logic */}
            <span className="inline xs:hidden">{role}</span> 
          </div>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* CONNECTION STATUS */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black border transition-all ${
          isOnline ? 'bg-green-50 text-green-600 border-green-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {isOnline ? <Wifi size={12} className="animate-pulse shrink-0"/> : <WifiOff size={12} className="shrink-0"/>}
          <span className="hidden sm:inline-block">{isOnline ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {/* CHAT ICON FOR SMALL SCREENS */}
        <button 
          onClick={toggleAi}
          className="lg:hidden p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
          title="Open AI Chat"
        >
          <MessageSquare size={18} />
        </button>

        <div className="h-6 w-[1px] bg-slate-200 mx-0.5 hidden sm:block"></div>
        
        {/* USER PROFILE */}
        <div className="flex items-center gap-2 text-slate-500">
          <UserCircle size={20} className="text-slate-400 shrink-0" />
          <span className="hidden md:inline-block text-[10px] font-bold uppercase tracking-tight">Session</span>
        </div>
      </div>
    </nav>
  );
}