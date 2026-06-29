"use client";
import React, { useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { Shield, Save, Trash2, Lock, Edit3, Eye } from 'lucide-react';

export default function EditorMain({ role, editor, handleSaveSnapshot }: any) {
  const [isEditing, setIsEditing] = useState(false);

  // logic: Sync editor editable state with local state and roles
  useEffect(() => {
    if (editor) {
      // Viewer can NEVER edit. Others can only edit if 'Edit Mode' is active.
      editor.setEditable(role !== 'VIEWER' && isEditing);
    }
  }, [isEditing, editor, role]);

  return (
    <div className="w-full flex flex-col items-center px-0 sm:px-4 md:px-6">
      
      {/* 
          Main Editor Paper: 
          - lg:max-w-4xl for desktop document feel
          - Shadow and border for elevation
      */}
      <div className="w-full lg:max-w-4xl bg-white min-h-[85vh] sm:min-h-[90vh] shadow-2xl border-x sm:border border-slate-200 rounded-none sm:rounded-xl relative overflow-hidden transition-all duration-300">
        
        {/* ACTION BAR - Responsive sticky header */}
        <div className="min-h-[4rem] border-b border-slate-100 bg-slate-50/80 backdrop-blur-md sticky top-0 z-20 flex flex-col xs:flex-row items-center justify-between px-4 py-2 xs:py-0 gap-3">
          
          {/* LEFT: Mode Toggles (Preview vs Edit) */}
          <div className="flex items-center w-full xs:w-auto justify-center xs:justify-start">
            {role === 'VIEWER' ? (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-amber-100 whitespace-nowrap">
                <Lock size={12}/> View Only Access
              </span>
            ) : (
              <div className="flex bg-white border border-slate-200 p-1 rounded-lg shadow-sm w-full xs:w-auto">
                <button 
                  onClick={() => setIsEditing(false)}
                  className={`flex-1 xs:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-[9px] sm:text-[10px] font-black transition-all ${
                    !isEditing 
                      ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-md' 
                      : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <Eye size={12}/> <span className="tracking-tight">PREVIEW</span>
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className={`flex-1 xs:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-[9px] sm:text-[10px] font-black transition-all ${
                    isEditing 
                      ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-md' 
                      : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <Edit3 size={12}/> <span className="tracking-tight">EDIT MODE</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Action Buttons */}
          <div className="flex items-center gap-2 w-full xs:w-auto justify-center xs:justify-end">
            
            {/* 1. SAVE SNAPSHOT: Adds an entry to history tab. DOES NOT delete anything. */}
            {role !== 'VIEWER' && (
              <button 
                onClick={handleSaveSnapshot}
                className="flex-1 xs:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-3 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[11px] font-black hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm active:scale-95 whitespace-nowrap"
              >
                <Save size={14}/> 
                <span className="hidden sm:inline">SAVE SNAPSHOT</span>
                <span className="sm:hidden">SAVE</span>
              </button>
            )}

            {/* 2. CLEAR DOCUMENT: Only Owner can clear CURRENT editor content. */}
            {role === 'OWNER' && (
              <button 
                onClick={() => { if(confirm("Permanently clear CURRENT document content? (This won't delete history snapshots)")) editor?.commands.setContent(""); }}
                className="p-2 sm:p-2.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm active:scale-95"
                title="Clear Current Content"
              >
                <Trash2 size={16}/>
              </button>
            )}
          </div>
        </div>

        {/* EDITOR AREA - This is where users type */}
        <div className={`p-5 sm:p-10 md:p-14 lg:p-20 min-h-[70vh] transition-all duration-500 ${
          !isEditing && role !== 'VIEWER' ? 'bg-slate-50/30' : 'bg-white'
        }`}>
          
          {/* Preview Notice: Animated bar to show user they can't type right now */}
          {!isEditing && role !== 'VIEWER' && (
            <div className="mb-6 p-3 bg-indigo-50/80 border border-indigo-100 text-indigo-600 text-[10px] font-black text-center rounded-xl animate-pulse uppercase tracking-[0.15em] flex items-center justify-center gap-2">
              <Eye size={12}/> Preview Mode Enabled - Switch to Edit Mode to type
            </div>
          )}

          {/* Actual Tiptap Editor Content Component */}
          <article className="prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none selection:bg-indigo-100 min-h-[50vh]">
            <EditorContent editor={editor} />
          </article>
        </div>

        {/* Bottom Decoration */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-slate-100 to-transparent absolute bottom-0 opacity-50"></div>
      </div>

      {/* Footer Metadata */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 opacity-40 text-[9px] font-bold uppercase tracking-[0.2em] mb-10">
        <div className="flex items-center gap-1.5">
          <Shield size={10}/> {role} PERMISSION
        </div>
        <span className="hidden xs:block">•</span>
        <div>DETERMINISTIC SYNC ACTIVE</div>
        <span className="hidden xs:block">•</span>
        <div>VERSION CONTROL ENABLED</div>
      </div>
    </div>
  );
}