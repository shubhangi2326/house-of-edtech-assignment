
"use client";
import React, { useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { Shield, Save, Trash2, Lock, Edit3, Eye } from 'lucide-react';

export default function EditorMain({ role, editor, handleSaveSnapshot }: any) {
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    if (editor) {
      editor.setEditable(role !== 'VIEWER' && isEditing);
    }
  }, [isEditing, editor, role]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full lg:max-w-3xl bg-white min-h-[90vh] shadow-2xl border border-slate-200 rounded-xl relative overflow-hidden transition-all duration-300">
        
        {/* ACTION BAR */}
        <div className="h-16 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {role === 'VIEWER' ? (
              <span className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                <Lock size={12}/> View Only
              </span>
            ) : (
              <div className="flex bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
                <button 
                  onClick={() => setIsEditing(false)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${!isEditing ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <Eye size={12}/> PREVIEW
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${isEditing ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <Edit3 size={12}/> EDIT MODE
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {role !== 'VIEWER' && (
              <button 
                onClick={handleSaveSnapshot}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-[11px] font-black hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
              >
                <Save size={14}/> SAVE SNAPSHOT
              </button>
            )}

            {/* ONLY OWNER can Clear the document */}
            {role === 'OWNER' && (
              <button 
                onClick={() => { if(confirm("Permanently clear content?")) editor?.commands.setContent(""); }}
                className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm"
                title="Clear Document"
              >
                <Trash2 size={18}/>
              </button>
            )}
          </div>
        </div>

        {/* EDITOR AREA */}
        <div className={`p-8 sm:p-12 md:p-16 min-h-screen transition-opacity duration-300 ${!isEditing && role !== 'VIEWER' ? 'opacity-80' : 'opacity-100'}`}>
          {!isEditing && role !== 'VIEWER' && (
            <div className="mb-4 p-2 bg-indigo-50 text-indigo-600 text-[10px] font-bold text-center rounded-lg animate-pulse uppercase tracking-widest">
              Preview Mode Active - Click 'Edit Mode' to type
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}