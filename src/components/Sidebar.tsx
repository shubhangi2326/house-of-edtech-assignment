"use client";
import React from 'react';
import { Plus, MessageSquare, Trash2, LogOut, History, RotateCcw } from 'lucide-react';
import { signOut } from "next-auth/react";
import { deleteVersion } from '../backend/actions';

export default function Sidebar({ 
  role, 
  sidebarTab, 
  setSidebarTab, 
  versions, 
  sessions, 
  activeSessionId, 
  setActiveSessionId, 
  editor, 
  loadHistory, 
  createNewSession, 
  deleteChat 
}: any) {
  return (
    <aside className="w-full sm:w-72 lg:w-80 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 h-full lg:h-screen border-r border-slate-800 shadow-2xl overflow-hidden">
      
      {/* HEADER SECTION - Action Button */}
      <div className="p-4 sm:p-6 border-b border-slate-800 shrink-0">
        <button 
          onClick={createNewSession} 
          className="w-full py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2.5 font-bold transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/10 uppercase text-[11px] tracking-widest"
        >
          <Plus size={18} strokeWidth={3} /> New Discussion
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex p-1.5 gap-1 bg-slate-900/50 m-4 rounded-xl border border-slate-800 shrink-0">
        <button 
          onClick={() => setSidebarTab('chats')} 
          className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all duration-200 ${
            sidebarTab === 'chats' 
              ? 'bg-slate-700 text-white shadow-md ring-1 ring-white/10' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          CHATS
        </button>
        <button 
          onClick={() => setSidebarTab('history')} 
          className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all duration-200 ${
            sidebarTab === 'history' 
              ? 'bg-slate-700 text-white shadow-md ring-1 ring-white/10' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          HISTORY
        </button>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-2 mb-2 custom-scrollbar scroll-smooth">
        {sidebarTab === 'chats' ? (
          /* CHATS LIST */
          <div className="space-y-1">
            {sessions.length === 0 ? (
              <div className="text-center py-10 opacity-30 flex flex-col items-center gap-3">
                <MessageSquare size={32} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No Active Chats</p>
              </div>
            ) : (
              sessions.map((s: any) => (
                <div 
                  key={s.id} 
                  onClick={() => setActiveSessionId(s.id)} 
                  className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border animate-in fade-in slide-in-from-left-2 duration-300 ${
                    activeSessionId === s.id 
                      ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' 
                      : 'border-transparent hover:bg-slate-800/60 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={16} className={activeSessionId === s.id ? 'text-indigo-400' : 'text-slate-500'} />
                    <span className="truncate text-sm font-medium tracking-tight">
                      {s.title || "Untitled Chat"}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => deleteChat(s.id, e)} 
                    className="p-2 opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-all shrink-0"
                    title="Delete Chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* HISTORY LIST */
          <div className="space-y-3">
             {versions.length === 0 ? (
              <div className="text-center py-10 opacity-30 flex flex-col items-center gap-3">
                <History size={32} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No History Found</p>
              </div>
            ) : (
              versions.map((v: any, i: number) => (
                <div key={v.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-slate-600 transition-all group animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History size={12} className="text-indigo-500"/>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                        Snapshot #{versions.length - i}
                      </span>
                    </div>
                    <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">v1.0</span>
                  </div>
                  
                  <div className="text-[10px] text-slate-300 font-medium mb-4 leading-relaxed bg-slate-800/50 p-2 rounded-lg border border-slate-800/50">
                    {new Date(v.createdAt).toLocaleString()}
                  </div>
                  
                  {/* RBAC Logic Implementation */}
                  {role === 'OWNER' ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { if(confirm("Restore this version? Current content will be overwritten.")) editor?.commands.setContent(v.content); }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black py-2.5 rounded-lg transition-all uppercase flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <RotateCcw size={11} strokeWidth={3}/> Restore
                      </button>
                      <button 
                        onClick={async () => { if(confirm("Delete this snapshot permanently?")) { await deleteVersion(v.id); loadHistory(); } }}
                        className="p-2.5 bg-slate-800 hover:bg-rose-600/20 hover:text-rose-500 text-slate-400 border border-slate-700/50 rounded-lg transition-all"
                        title="Delete Version"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[9px] italic text-slate-600 text-center py-2.5 border border-slate-800/50 rounded-lg bg-slate-900/50 uppercase tracking-widest font-black">
                      Read Only Access
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* FOOTER SECTION - Account Controls */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/20 shrink-0">
        <button 
          onClick={() => signOut()} 
          className="w-full py-3.5 bg-rose-900/5 hover:bg-rose-600/10 text-rose-500 border border-rose-900/20 hover:border-rose-500/50 rounded-xl flex items-center justify-center gap-2.5 font-black transition-all duration-300 text-[10px] uppercase tracking-[0.15em] active:scale-95"
        >
          <LogOut size={16} /> Terminate Session
        </button>
        <p className="text-[8px] text-center text-slate-600 mt-3 font-bold uppercase tracking-widest opacity-50">
          Studio v2.1 Secure Session
        </p>
      </div>
    </aside>
  );
}