"use client";
import React, { useEffect } from 'react';
import { Bot, Volume2, Paperclip, Mic, Send, X } from 'lucide-react';

export default function AiAssistant({
  activeSession, loading, input = "", setInput, sendMessage, 
  pendingImage, setPendingImage, startListening, isListening, 
  readAloud, fileInputRef, chatEndRef, closeAi 
}: any) {

  // Auto Scroll logic
  useEffect(() => {
    chatEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  return (
    <aside className="flex flex-col h-full bg-white border-l border-slate-200 shadow-2xl w-full lg:w-[420px] transition-all duration-300 overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase tracking-widest">
          <Bot size={18} className="text-indigo-600" /> AI Assistant
        </div>
        <button onClick={closeAi} className="lg:hidden p-1 text-slate-400 hover:text-rose-500 transition"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 custom-scrollbar">
        {activeSession?.messages.map((msg: any, i: number) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3 sm:p-4 rounded-2xl text-[13px] relative shadow-sm ${
              msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
            }`}>
              {msg.image && <img src={msg.image} className="w-full rounded-lg mb-2 max-h-40 object-cover border border-slate-100" alt="upload" />}
              {msg.content}
              
              {msg.role === 'assistant' && (
                <button 
                  onClick={() => readAloud(msg.content)}
                  className="absolute -bottom-7 left-0 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-[10px] font-black text-indigo-500 animate-pulse px-4 uppercase tracking-[0.2em] py-2">AI is thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t space-y-3">
        {pendingImage && (
          <div className="relative inline-block group animate-in zoom-in duration-200">
            <img src={pendingImage} className="h-16 w-16 object-cover rounded-xl border-2 border-indigo-500 shadow-md" alt="preview" />
            <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-all"><X size={12}/></button>
          </div>
        )}
        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) {
               const reader = new FileReader();
               reader.onload = (ev) => setPendingImage(ev.target?.result as string);
               reader.readAsDataURL(file);
             }
          }} />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 transition"><Paperclip size={20} /></button>
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }} 
            placeholder="Type your message..." 
            className="flex-1 bg-transparent outline-none text-sm px-1 min-w-0" 
          />
          <button onClick={startListening} className={`p-2 rounded-xl transition ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}><Mic size={20} /></button>
          
          {/* THE SEND BUTTON */}
        <button 
  type="button" 
  onClick={(e) => {
    e.preventDefault();
    sendMessage();
  }} 
  disabled={(!input.trim() && !pendingImage) || loading}
  className="..."
>
  <Send size={18} />
</button>
        </div>
      </div>
    </aside>
  );
}