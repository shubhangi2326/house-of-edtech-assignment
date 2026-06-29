"use client";
import React, { useEffect } from 'react';
import { Bot, Volume2, Paperclip, Mic, Send, X } from 'lucide-react';

export default function AiAssistant({
  activeSession, loading, input = "", setInput, sendMessage, 
  pendingImage, setPendingImage, startListening, isListening, 
  readAloud, fileInputRef, chatEndRef, closeAi 
}: any) {

  // Auto Scroll logic - ensures latest messages are always visible
  useEffect(() => {
    chatEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading, chatEndRef]);

  return (
    <aside className="flex flex-col h-full bg-white border-l border-slate-200 shadow-2xl w-full sm:w-[400px] lg:w-[420px] transition-all duration-300 overflow-hidden relative">
      
      {/* HEADER - Sticky at top */}
      <div className="p-4 border-b bg-white flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Bot size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-black text-xs text-slate-800 uppercase tracking-widest">AI Assistant</h2>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Online & Active</p>
          </div>
        </div>
        {/* Close Button - Visible only on mobile/tablets */}
        <button 
          onClick={closeAi} 
          className="lg:hidden p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
        >
          <X size={22} />
        </button>
      </div>

      {/* CHAT MESSAGES AREA - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 custom-scrollbar">
        {activeSession?.messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
            <Bot size={48} className="mb-4 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">How can I help you with your document today?</p>
          </div>
        )}

        {activeSession?.messages.map((msg: any, i: number) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] sm:max-w-[90%] p-3.5 sm:p-4 rounded-2xl text-[13.5px] leading-relaxed relative shadow-sm break-words ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
            }`}>
              {/* Image Support */}
              {msg.image && (
                <div className="mb-3 overflow-hidden rounded-lg border border-white/20">
                   <img src={msg.image} className="w-full max-h-52 object-cover" alt="upload" />
                </div>
              )}
              
              {/* Message Content */}
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {/* TTS Button for Assistant */}
              {msg.role === 'assistant' && (
                <button 
                  onClick={() => readAloud(msg.content)}
                  className="absolute -bottom-8 left-0 flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                >
                  <Volume2 size={14} /> LISTEN
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">AI is thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT AREA - Sticky at bottom */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        {/* Image Preview Overlay */}
        {pendingImage && (
          <div className="relative inline-block mb-3 animate-in zoom-in slide-in-from-left-2 duration-200">
            <img src={pendingImage} className="h-20 w-20 object-cover rounded-xl border-2 border-indigo-500 shadow-lg" alt="preview" />
            <button 
              onClick={() => setPendingImage(null)} 
              className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-transform active:scale-90"
            >
              <X size={14}/>
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
          {/* File Upload Logic */}
          <input 
            type="file" 
            hidden 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => setPendingImage(ev.target?.result as string);
                reader.readAsDataURL(file);
              }
            }} 
          />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()} 
            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition"
          >
            <Paperclip size={20} />
          </button>

          <input 
            type="text"
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }} 
            placeholder="Ask AI anything..." 
            className="flex-1 bg-transparent outline-none text-[14px] px-2 min-w-0 placeholder:text-slate-400" 
          />

          {/* Voice Input Button */}
          <button 
            type="button"
            onClick={startListening} 
            className={`p-2.5 rounded-xl transition-all ${
              isListening 
                ? 'text-red-500 bg-red-100 shadow-inner animate-pulse' 
                : 'text-slate-400 hover:text-indigo-600 hover:bg-white'
            }`}
          >
            <Mic size={20} />
          </button>
          
          {/* Send Button */}
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); sendMessage(); }} 
            disabled={(!input.trim() && !pendingImage) || loading}
            className={`p-2.5 rounded-xl transition-all shadow-sm ${
              (!input.trim() && !pendingImage) || loading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        
        <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">Powered by Gemini & Groq</p>
      </div>
    </aside>
  );
}