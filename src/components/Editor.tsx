"use client";
import { useEffect, useState, useMemo, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import ImageExtension from '@tiptap/extension-image';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Menu, MessageSquare, X, Wifi, WifiOff } from 'lucide-react';
import { useSession } from "next-auth/react";

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import EditorMain from './EditorMain';
import AiAssistant from './AiAssistant';
import { syncBinaryUpdate, saveSnapshot, getVersions } from '../backend/actions';

export default function Editor({ docId, role }: { docId: string, role: string }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || "guest";

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAiOpen, setAiOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
const [syncQueue, setSyncQueue] = useState<number[][]>([]); 
const [isSyncingHead, setIsSyncingHead] = useState(false); 
  const [localChats, setLocalChats] = useState<any[]>([]); 
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'history'>('chats');

  const ydoc = useMemo(() => new Y.Doc(), []);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const provider = new IndexeddbPersistence(docId, ydoc);
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      provider.destroy();
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, [docId, ydoc]);
const editor = useEditor({
extensions: [
  StarterKit.configure({ history: false } as any),
  Collaboration.configure({ document: ydoc }),
  ImageExtension.configure({ inline: true, allowBase64: true })],
  editable: false,
  immediatelyRender: false,
});

  useEffect(() => {
    if (!userId) return;
    const storageKey = `chats-${userId}-${docId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setLocalChats(parsed);
        setActiveChatId(parsed[0].id);
      } else { createNewChat(); }
    } else { createNewChat(); }
    const fetchVer = async () => setVersions(await getVersions(docId));
    fetchVer();
  }, [docId, userId]);

  useEffect(() => {
    if (localChats.length > 0 && userId !== "guest") {
      localStorage.setItem(`chats-${userId}-${docId}`, JSON.stringify(localChats));
    }
  }, [localChats, docId, userId]);

useEffect(() => {
  if (role === 'VIEWER') return;

  const handleUpdate = (update: Uint8Array) => {
    // Har update ko queue mein daal dein (Race condition se bachne ke liye)
    setSyncQueue(prev => [...prev, Array.from(update)]);
  };

  ydoc.on('update', handleUpdate);
  return () => { ydoc.off('update', handleUpdate); };
}, [ydoc, role]);

  const createNewChat = () => {
    const newId = "chat_" + Date.now();
    setLocalChats(prev => [{ id: newId, title: "New Discussion", messages: [] }, ...prev]);
    setActiveChatId(newId);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localChats.filter(c => c.id !== id);
    setLocalChats(updated);
    localStorage.setItem(`chats-${userId}-${docId}`, JSON.stringify(updated));
    if (activeChatId === id) setActiveChatId(updated.length > 0 ? updated[0].id : null);
  };

  const readAloud = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Mic not supported");
    const rec = new SR();
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    rec.start();
  };

  const sendMessage = async () => {
    let currentId = activeChatId;
    if (!currentId) {
      const newId = "chat_" + Date.now();
      setLocalChats([{ id: newId, title: "New Discussion", messages: [] }]);
      setActiveChatId(newId);
      currentId = newId;
    }
    if ((!(input || "").trim() && !pendingImage) || loading) return;

    const userMsg = { role: "user", content: input, image: pendingImage };
    setLocalChats(prev => prev.map(c => c.id === currentId ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? input.slice(0,15) : c.title } : c));
    setLoading(true); setInput(""); setPendingImage(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, docContent: editor?.getText(), history: localChats.find(c => c.id === currentId)?.messages || [] })
      });
      const data = await res.json();
      setLocalChats(prev => prev.map(c => c.id === currentId ? { ...c, messages: [...c.messages, { role: "assistant", content: data.reply }] } : c));
    } finally { setLoading(false); }
  };


useEffect(() => {
  const processQueue = async () => {
    if (!isOnline || syncQueue.length === 0 || isSyncingHead) return;

    setIsSyncingHead(true);
    const nextUpdate = syncQueue[0];

    try {
      
      const res = await syncBinaryUpdate(docId, nextUpdate, role);
      
      if (res && !res.error) {
        setSyncQueue(prev => prev.slice(1)); 
      } else if (res?.error?.includes("ACCESS_DENIED")) {
        
        console.error("Critical Security Error:", res.error);
        setSyncQueue([]); 
        alert("Security Violation: You do not own this document.");
      } else {
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (e) {
      console.error("Network error during sync, waiting...");
    } finally {
      setIsSyncingHead(false);
    }
  };

  processQueue();
}, [syncQueue, isOnline, isSyncingHead, docId, role]);
  return (
    <div className="flex h-screen bg-[#F1F5F9] text-[#0f172a] overflow-hidden relative font-sans">
      <div className={`fixed inset-y-0 left-0 z-[70] lg:relative lg:translate-x-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar role={role} sidebarTab={sidebarTab} setSidebarTab={setSidebarTab} sessions={localChats} activeSessionId={activeChatId} setActiveSessionId={setActiveChatId} createNewSession={createNewChat} deleteChat={deleteChat} versions={versions} editor={editor} loadHistory={async () => setVersions(await getVersions(docId))} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
     
<Navbar 
  isOnline={isOnline} 
  role={role} 
  toggleSidebar={() => setSidebarOpen(true)} 
  toggleAi={() => setAiOpen(true)} 
/>

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 scrollbar-hide">
            <EditorMain role={role} editor={editor} handleSaveSnapshot={async () => { await saveSnapshot(docId, editor?.getHTML() || "", role); setVersions(await getVersions(docId)); }} />
          </main>
          <div className={`fixed inset-y-0 right-0 z-[70] lg:relative lg:translate-x-0 transition-transform duration-300 ${isAiOpen ? 'translate-x-0' : 'translate-x-full lg:block'}`}>
            <AiAssistant 
              activeSession={localChats.find(c => c.id === activeChatId)} loading={loading} input={input} setInput={setInput} 
              sendMessage={sendMessage} readAloud={readAloud} pendingImage={pendingImage} setPendingImage={setPendingImage} 
              startListening={startListening} isListening={isListening} fileInputRef={fileInputRef} chatEndRef={chatEndRef} closeAi={() => setAiOpen(false)} 
            />
          </div>
        </div>

        <footer className="h-12 bg-white border-t flex items-center justify-between px-4 sm:px-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] shrink-0">
          <div className="flex gap-4">
            <a href="https://github.com/shubhangi2326" target="_blank" className="text-indigo-600 border-b-2 border-indigo-50 hover:border-indigo-600 pb-0.5">GitHub</a>
            <a href="https://linkedin.com/in/shubhangi-mahajan2" target="_blank" className="text-indigo-600 border-b-2 border-indigo-50 hover:border-indigo-600 pb-0.5">LinkedIn</a>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded shadow-sm tracking-normal">SHUBHANGI MAHAJAN</span>
          </div>
        </footer>
      </div>
      {(isSidebarOpen || isAiOpen) && ( <div onClick={() => { setSidebarOpen(false); setAiOpen(false); }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300" /> )}
    </div>
  );
}