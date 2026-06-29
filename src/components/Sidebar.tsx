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
  deleteChat,
  handleRestore,
  closeSidebar,
  openAi 
}: any) {
  return (
    <aside className="w-72 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 h-screen border-r border-slate-800 shadow-2xl overflow-hidden">
      
      {/* NEW DISCUSSION */}
      <div className="p-6 border-b border-slate-800 shrink-0">
        <button 
          onClick={() => { createNewSession(); closeSidebar(); openAi(); }} 
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-lg shadow-indigo-500/20 uppercase text-xs tracking-widest active:scale-95"
        >
          <Plus size={18} /> New Discussion
        </button>
      </div>

      {/* TABS */}
      <div className="flex p-2 gap-2 bg-slate-900 m-4 rounded-xl border border-slate-800 shrink-0">
        <button 
          onClick={() => setSidebarTab('chats')} 
          className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
            sidebarTab === 'chats' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          CHATS
        </button>
        <button 
          onClick={() => setSidebarTab('history')} 
          className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
            sidebarTab === 'history' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          HISTORY
        </button>
      </div>

      {/* CONTENT LIST AREA */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
        {sidebarTab === 'chats' ? (
          /* CHATS LISTING */
          sessions.map((s: any) => (
            <div 
              key={s.id} 
              onClick={() => { setActiveSessionId(s.id); closeSidebar(); openAi(); }} 
              className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${
                activeSessionId === s.id 
                  ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' 
                  : 'border-transparent hover:bg-slate-800/40 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={activeSessionId === s.id ? 'text-indigo-400' : 'text-slate-500'} />
                <span className="truncate text-sm font-medium tracking-tight">
                  {s.title || "Untitled Chat"}
                </span>
              </div>
              
              {/* DELETE CHAT ICON - Fixed visibility for mobile */}
              <button 
                onClick={(e) => deleteChat(s.id, e)} 
                className="p-2 lg:opacity-0 lg:group-hover:opacity-100 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          /* HISTORY LISTING */
          versions.map((v: any, i: number) => (
            <div key={v.id} className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl mb-3 hover:border-slate-700 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History size={12} className="text-indigo-500"/>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                    Snapshot #{versions.length - i}
                  </span>
                </div>
                
                {/* DELETE VERSION ICON - Visible for owners, always on mobile */}
                {role === 'OWNER' && (
                  <button 
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      if(confirm("Permanently delete this version snapshot?")) { 
                        await deleteVersion(v.id); 
                        loadHistory(); 
                      } 
                    }} 
                    className="lg:opacity-0 lg:group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all shrink-0"
                  >
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
              
              <div className="text-[10px] text-slate-300 font-medium mb-4 leading-relaxed">
                {new Date(v.createdAt).toLocaleString()}
              </div>
              
              {role === 'OWNER' ? (
                <button 
                  onClick={() => { handleRestore(v.id); closeSidebar(); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black py-2.5 rounded-lg transition uppercase flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
                >
                  <RotateCcw size={11}/> Restore Version
                </button>
              ) : (
                <div className="text-[9px] italic text-slate-600 text-center py-2 bg-slate-900/50 rounded-lg border border-slate-800/50 font-black uppercase tracking-widest">
                  View Only History
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* TERMINATE SESSION (SIGN OUT) */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <button 
          onClick={() => signOut()} 
          className="w-full py-3.5 bg-rose-900/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 text-[10px] border border-rose-900/20 uppercase tracking-widest active:scale-95"
        >
          <LogOut size={16} /> Terminate Session
        </button>
      </div>
    </aside>
  );
}