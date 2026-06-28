"use client";
import React from 'react';
import { Plus, MessageSquare, Trash2, LogOut, History, RotateCcw } from 'lucide-react';
import { signOut } from "next-auth/react";
import { deleteVersion } from '../backend/actions';

export default function Sidebar({ role, sidebarTab, setSidebarTab, versions, sessions, activeSessionId, setActiveSessionId, editor, loadHistory, createNewSession, deleteChat }: any) {
  return (
    <aside className="w-72 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 h-screen border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <button onClick={createNewSession} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-lg shadow-indigo-500/20 uppercase text-xs tracking-widest">
          <Plus size={18} /> New Discussion
        </button>
      </div>

      <div className="flex p-2 gap-2 bg-slate-900 m-4 rounded-xl border border-slate-800">
        <button onClick={() => setSidebarTab('chats')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${sidebarTab === 'chats' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>CHATS</button>
        <button onClick={() => setSidebarTab('history')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${sidebarTab === 'history' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>HISTORY</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
        {sidebarTab === 'chats' ? (
          sessions.map((s: any) => (
            <div key={s.id} onClick={() => setActiveSessionId(s.id)} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeSessionId === s.id ? 'bg-slate-800 border-indigo-500/50 text-indigo-400' : 'border-transparent hover:bg-slate-800/40'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={activeSessionId === s.id ? 'text-indigo-400' : 'text-slate-500'} />
                <span className="truncate text-sm font-medium">{s.title || "Untitled Chat"}</span>
              </div>
              <button onClick={(e) => deleteChat(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-all"><Trash2 size={14} /></button>
            </div>
          ))
        ) : (
          versions.map((v: any, i: number) => (
            <div key={v.id} className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl mb-3 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <History size={12} className="text-indigo-500"/>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Snapshot #{versions.length - i}</span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium mb-3">{new Date(v.createdAt).toLocaleString()}</div>
              
              {/* RBAC: Only OWNER can Restore/Delete */}
              {role === 'OWNER' ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { if(confirm("Restore this version?")) editor?.commands.setContent(v.content); }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black py-2 rounded-lg transition uppercase flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={10}/> Restore
                  </button>
                  <button 
                    onClick={async () => { if(confirm("Delete this version?")) { await deleteVersion(v.id); loadHistory(); } }}
                    className="p-2 bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
                  >
                    <Trash2 size={12}/>
                  </button>
                </div>
              ) : (
                <div className="text-[9px] italic text-slate-600 text-center py-2 border border-slate-800 rounded-lg bg-slate-900/50">
                  Restore access restricted
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button onClick={() => signOut()} className="w-full py-3 bg-rose-900/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl flex items-center justify-center gap-2 font-bold transition duration-300 text-[10px] border border-rose-900/20 uppercase tracking-widest">
          <LogOut size={16} /> Terminate Session
        </button>
      </div>
    </aside>
  );
}