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

// Components
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import EditorMain from './EditorMain';
import AiAssistant from './AiAssistant';

// Backend Actions
import { syncBinaryUpdate, saveSnapshot, getVersions, deleteVersion } from '../backend/actions';

export default function Editor({ docId, role }: { docId: string, role: string }) {
  // --- 1. AUTHENTICATION & USER SCOPING ---
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || "guest";

  // --- 2. CORE STATES ---
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAiOpen, setAiOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  
  // Sync Engine States (Requirement: Robust Queueing)
  const [syncQueue, setSyncQueue] = useState<number[][]>([]); 
  const [isSyncingHead, setIsSyncingHead] = useState(false); 

  // AI & Chat States (Requirement: Local-First Storage)
  const [localChats, setLocalChats] = useState<any[]>([]); 
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  // Version Control States
  const [versions, setVersions] = useState<any[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'history'>('chats');

  // Refs & Yjs Memo
  const ydoc = useMemo(() => new Y.Doc(), []);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 3. LOCAL-FIRST PERSISTENCE (IndexedDB) ---
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

  // --- 4. EDITOR INITIALIZATION ---
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false } as any), 
      Collaboration.configure({ document: ydoc }),
      ImageExtension.configure({ inline: true, allowBase64: true })
    ],
    editable: false, // Managed by EditorMain's toggle
    immediatelyRender: false,
  });

  // --- 5. DATA HYDRATION (Load User Chats & Versions) ---
  useEffect(() => {
    if (!userId) return;
    
    // Load AI Chats from LocalStorage (Tenant Isolated)
    const storageKey = `house-of-edtech-chats-${userId}-${docId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setLocalChats(parsed);
        setActiveChatId(parsed[0].id);
      } else { handleInitialChatCreation(); }
    } else { handleInitialChatCreation(); }

    // Load Version History from PostgreSQL
    refreshHistory();
  }, [docId, userId]);

  const handleInitialChatCreation = () => {
    const newId = "chat_" + Date.now();
    setLocalChats([{ id: newId, title: "Initial Discussion", messages: [] }]);
    setActiveChatId(newId);
  };

  const refreshHistory = async () => {
    const data = await getVersions(docId);
    setVersions(data || []);
  };

  // --- 6. AUTO-SAVE CHATS TO LOCALSTORAGE ---
  useEffect(() => {
    if (localChats.length > 0 && userId !== "guest") {
      const storageKey = `house-of-edtech-chats-${userId}-${docId}`;
      localStorage.setItem(storageKey, JSON.stringify(localChats));
    }
  }, [localChats, docId, userId]);

  // --- 7. SYNC ENGINE (Deterministic Conflict Resolution) ---
  useEffect(() => {
    if (role === 'VIEWER') return;
    const handleUpdate = (update: Uint8Array) => {
      setSyncQueue(prev => [...prev, Array.from(update)]);
    };
    ydoc.on('update', handleUpdate);
    return () => { ydoc.off('update', handleUpdate); };
  }, [ydoc, role]);

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
          setSyncQueue([]);
          alert("Security: Tenant Isolation violation.");
        } else {
          await new Promise(r => setTimeout(resolve, 3000));
        }
      } catch (e) { console.error("Network sync error"); }
      finally { setIsSyncingHead(false); }
    };
    processQueue();
  }, [syncQueue, isOnline, isSyncingHead, docId, role]);

  // --- 8. AI & VOICE LOGIC ---
  const readAloud = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Mic not supported.");
    const rec = new SR();
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    rec.start();
  };

  const sendMessage = async () => {
    let currentId = activeChatId;
    if (!currentId) {
      const newId = "chat_" + Date.now();
      setLocalChats([{ id: newId, title: "New Chat", messages: [] }]);
      setActiveChatId(newId);
      currentId = newId;
    }
    if ((!(input || "").trim() && !pendingImage) || loading) return;

    const userText = input;
    const userImg = pendingImage;
    const userMsg = { role: "user", content: userText || "Sent an image", image: userImg };

    setLocalChats(prev => prev.map(c => c.id === currentId ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? userText.slice(0,15) : c.title } : c));
    setLoading(true); setInput(""); setPendingImage(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, docContent: editor?.getText(), history: localChats.find(c => c.id === currentId)?.messages || [], image: userImg })
      });
      const data = await res.json();
      setLocalChats(prev => prev.map(c => c.id === currentId ? { ...c, messages: [...c.messages, { role: "assistant", content: data.reply }] } : c));
    } finally { setLoading(false); }
  };

  // --- 9. HANDLERS (New Chat, Delete, Snapshot, Restore) ---
  const createNewChat = () => {
    const newId = "chat_" + Date.now();
    setLocalChats(prev => [{ id: newId, title: "New Discussion", messages: [] }, ...prev]);
    setActiveChatId(newId);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localChats.filter(c => c.id !== id);
    setLocalChats(updated);
    if (activeChatId === id) setActiveChatId(updated.length > 0 ? updated[0].id : null);
  };

  const handleSaveSnapshotAction = async () => {
    if (role === 'VIEWER') return;
    const content = editor?.getHTML() || "";
    const res = await saveSnapshot(docId, content, role);
    if (res.error) {
      alert("Error: " + res.error);
    } else {
      alert("Success: Version captured in history.");
      refreshHistory(); // Update sidebar list
    }
  };

  const handleDeleteVersion = async (vId: string) => {
    if (confirm("Delete this snapshot?")) {
      await deleteVersion(vId);
      refreshHistory();
    }
  };

  const handleRestoreVersion = (content: string) => {
    if (confirm("Restore this version? Current progress will be archived.")) {
      editor?.commands.setContent(content);
      alert("Document Restored Successfully!");
    }
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] text-[#0f172a] overflow-hidden relative font-sans">
      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-[70] lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          role={role} 
          sidebarTab={sidebarTab} setSidebarTab={setSidebarTab} 
          sessions={localChats} activeSessionId={activeChatId} setActiveSessionId={setActiveChatId} 
          createNewSession={createNewChat} deleteChat={handleDeleteChat}
          versions={versions} editor={editor} 
          loadHistory={refreshHistory}
          deleteVersion={handleDeleteVersion}
          restoreVersion={handleRestoreVersion}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* NAVBAR */}
        <Navbar 
          isOnline={isOnline} 
          role={role} 
          toggleSidebar={() => setSidebarOpen(true)} 
          toggleAi={() => setAiOpen(true)} 
        />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 scrollbar-hide">
            <EditorMain 
              role={role} 
              editor={editor} 
              handleSaveSnapshot={handleSaveSnapshotAction} 
            />
          </main>
          
          {/* AI ASSISTANT */}
          <div className={`fixed inset-y-0 right-0 z-[70] lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isAiOpen ? 'translate-x-0' : 'translate-x-full lg:block'}`}>
            <AiAssistant 
              activeSession={localChats.find(c => c.id === activeChatId)} 
              loading={loading} input={input} setInput={setInput} 
              sendMessage={sendMessage} readAloud={readAloud} 
              pendingImage={pendingImage} setPendingImage={setPendingImage} 
              startListening={startListening} isListening={isListening} 
              fileInputRef={fileInputRef} chatEndRef={chatEndRef} closeAi={() => setAiOpen(false)} 
            />
          </div>
        </div>

        {/* FOOTER */}
        <footer className="h-12 bg-white border-t flex items-center justify-between px-4 sm:px-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] shrink-0">
          <div className="flex gap-4">
            <a href="https://github.com/shubhangi2326" target="_blank" className="text-indigo-600 border-b-2 border-indigo-50 hover:border-indigo-600 pb-0.5 transition-all">GitHub Profile</a>
            <a href="https://linkedin.com/in/shubhangi-mahajan2" target="_blank" className="text-indigo-600 border-b-2 border-indigo-50 hover:border-indigo-600 pb-0.5 transition-all">LinkedIn Profile</a>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-400">ENGINE V2.1 STABLE | BY:</span>
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded shadow-sm">SHUBHANGI MAHAJAN</span>
          </div>
        </footer>
      </div>

      {/* OVERLAY */}
      {(isSidebarOpen || isAiOpen) && ( 
        <div onClick={() => { setSidebarOpen(false); setAiOpen(false); }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300" /> 
      )}
    </div>
  );
}