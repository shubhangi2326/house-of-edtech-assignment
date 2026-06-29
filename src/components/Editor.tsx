"use client";
import { useEffect, useState, useMemo, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import ImageExtension from '@tiptap/extension-image';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useSession } from "next-auth/react";

// Internal Components
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import EditorMain from './EditorMain';
import AiAssistant from './AiAssistant';

// Backend Actions
import { 
  syncBinaryUpdate, 
  saveSnapshot, 
  getVersions, 
  deleteVersion, 
  restoreToVersion 
} from '../backend/actions';

export default function Editor({ docId, role }: { docId: string, role: string }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || "guest";

  // --- UI & NAVIGATION STATES ---
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAiOpen, setAiOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'history'>('chats');

  // --- DATA & AI STATES ---
  const [localChats, setLocalChats] = useState<any[]>([]); 
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);

  // --- SYNC ENGINE STATES ---
  const [syncQueue, setSyncQueue] = useState<number[][]>([]); 
  const [isSyncingHead, setIsSyncingHead] = useState(false); 

  // --- REFS & MEMO ---
  const ydoc = useMemo(() => new Y.Doc(), []);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. LOCAL-FIRST PERSISTENCE (IndexedDB)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const provider = new IndexeddbPersistence(docId, ydoc);
    const updateStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    return () => {
      provider.destroy();
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [docId, ydoc]);

  // 2. EDITOR INITIALIZATION
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false } as any), 
      Collaboration.configure({ document: ydoc }),
      ImageExtension.configure({ inline: true, allowBase64: true })
    ],
    editable: role !== 'VIEWER', 
    immediatelyRender: false,
  });

  // 3. LOAD PERSISTED DATA
  const refreshHistory = async () => {
    const data = await getVersions(docId);
    setVersions(data || []);
  };

  useEffect(() => {
    if (!userId) return;
    const storageKey = `house-of-edtech-chats-${userId}-${docId}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setLocalChats(parsed);
        setActiveChatId(parsed[0].id);
      } else { createNewChat(); }
    } else { createNewChat(); }
    
    refreshHistory();
  }, [docId, userId]);

  // 4. AUTO-SAVE CHATS TO LOCAL STORAGE
  useEffect(() => {
    if (userId !== "guest") {
      localStorage.setItem(`house-of-edtech-chats-${userId}-${docId}`, JSON.stringify(localChats));
    }
  }, [localChats, docId, userId]);

  // 5. YJS SYNC ENGINE (DB Synchronization)
  useEffect(() => {
    if (role === 'VIEWER') return;
    const handleUp = (update: Uint8Array) => setSyncQueue(prev => [...prev, Array.from(update)]);
    ydoc.on('update', handleUp);
    return () => { ydoc.off('update', handleUp); };
  }, [ydoc, role]);

  useEffect(() => {
    const processQueue = async () => {
      if (!isOnline || syncQueue.length === 0 || isSyncingHead) return;
      
      setIsSyncingHead(true);
      const nextUpdate = syncQueue[0];
      
      try {
        const res = await syncBinaryUpdate(docId, nextUpdate, role);
        if (res && !res.error) {
          setSyncQueue(prev => prev.slice(1)); // Success: Pop from queue
        } else {
          // Wait before retry if server error occurred
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (e) { 
        console.error("Cloud Sync Interrupted. Retrying..."); 
        await new Promise(r => setTimeout(r, 4000));
      } finally { 
        setIsSyncingHead(false); 
      }
    };
    processQueue();
  }, [syncQueue, isOnline, isSyncingHead, docId, role]);

  // 6. AI & VOICE UTILITIES
  const readAloud = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Your browser does not support Speech Recognition.");
    const rec = new SR();
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => { 
      setInput(e.results[0][0].transcript); 
      setIsListening(false); 
    };
    rec.onerror = () => setIsListening(false);
    rec.start();
  };

  const sendMessage = async () => {
    if ((!input.trim() && !pendingImage) || loading) return;

    let currentId = activeChatId;
    if (!currentId) {
      const newId = "chat_" + Date.now();
      setLocalChats([{ id: newId, title: "Quick Discussion", messages: [] }]);
      setActiveChatId(newId);
      currentId = newId;
    }

    const userMsg = { role: "user", content: input || "Shared Context", image: pendingImage };
    
    // Update local state immediately for UI responsiveness
    setLocalChats(prev => prev.map(c => 
      c.id === currentId 
      ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? input.slice(0, 20) : c.title } 
      : c
    ));
    
    setLoading(true); 
    setInput(""); 
    setPendingImage(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content, 
          docContent: editor?.getText(), 
          history: localChats.find(c => c.id === currentId)?.messages || [], 
          image: userMsg.image 
        })
      });
      const data = await res.json();
      
      setLocalChats(prev => prev.map(c => 
        c.id === currentId 
        ? { ...c, messages: [...c.messages, { role: "assistant", content: data.reply }] } 
        : c
      ));
    } catch (err) {
      alert("AI Service temporarily unavailable.");
    } finally { 
      setLoading(false); 
    }
  };

  // 7. SNAPSHOT & CHAT MANAGEMENT
  const createNewChat = () => {
    const newId = "chat_" + Date.now();
    setLocalChats(prev => [{ id: newId, title: "New Discussion", messages: [] }, ...prev]);
    setActiveChatId(newId);
    setSidebarTab('chats');
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this discussion permanently?")) return;
    const updated = localChats.filter(c => c.id !== id);
    setLocalChats(updated);
    if (activeChatId === id) setActiveChatId(updated.length > 0 ? updated[0].id : null);
  };

  const handleSaveSnapshot = async () => {
    if (role === 'VIEWER') return;
    const res = await saveSnapshot(docId, editor?.getHTML() || "", role);
    if (res.error) alert(res.error);
    else {
      alert("Version State Synchronized Successfully!");
      await refreshHistory();
      setSidebarTab('history');
    }
  };

  const handleRestore = async (versionId: string) => {
    if (role !== 'OWNER') return alert("Access Restricted: Only Owners can restore documents.");
    if (!confirm("This will overwrite current document content. Proceed?")) return;
    
    const res = await restoreToVersion(docId, versionId, role);
    if (res.success) window.location.reload();
    else alert(res.error);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0f172a] overflow-hidden relative font-sans">
      
      {/* SIDEBAR DRAWER - Responsive overlay on mobile, fixed on desktop */}
      <div className={`fixed inset-y-0 left-0 z-[100] lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          role={role} 
          sidebarTab={sidebarTab} 
          setSidebarTab={setSidebarTab} 
          sessions={localChats} 
          activeSessionId={activeChatId} 
          setActiveSessionId={setActiveChatId} 
          createNewSession={createNewChat} 
          deleteChat={handleDeleteChat}
          versions={versions} 
          editor={editor} 
          loadHistory={refreshHistory}
          handleRestore={handleRestore}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOP NAVBAR */}
     <Navbar 
  isOnline={isOnline} 
  role={role} 
  toggleSidebar={() => setSidebarOpen(true)} 
  toggleAi={() => setAiOpen(true)} 
/>

        <div className="flex-1 flex overflow-hidden">
          {/* MAIN EDITOR AREA */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide">
            <EditorMain 
              role={role} 
              editor={editor} 
              handleSaveSnapshot={handleSaveSnapshot} 
            />
          </main>
          
          {/* AI PANEL DRAWER - Responsive overlay on mobile, fixed on desktop */}
          <div className={`fixed inset-y-0 right-0 z-[100] lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isAiOpen ? 'translate-x-0' : 'translate-x-full lg:block'}`}>
            <AiAssistant 
              activeSession={localChats.find(c => c.id === activeChatId)} 
              loading={loading} 
              input={input} 
              setInput={setInput} 
              sendMessage={sendMessage} 
              readAloud={readAloud} 
              pendingImage={pendingImage} 
              setPendingImage={setPendingImage} 
              startListening={startListening} 
              isListening={isListening} 
              fileInputRef={fileInputRef} 
              chatEndRef={chatEndRef} 
              closeAi={() => setAiOpen(false)} 
            />
          </div>
        </div>

        {/* COMPREHENSIVE FOOTER */}
        <footer className="h-12 bg-white border-t border-slate-200 flex items-center justify-between px-6 sm:px-8 text-[9px] md:text-[10px] font-black uppercase tracking-widest shrink-0 z-50">
          <div className="flex gap-4 md:gap-8 items-center">
            <div className="flex gap-3">
              <a href="https://github.com/shubhangi2326" target="_blank" className="text-indigo-600 hover:text-indigo-800 transition-colors border-b border-indigo-100">GitHub</a>
              <a href="https://linkedin.com/in/shubhangi-mahajan2" target="_blank" className="text-indigo-600 hover:text-indigo-800 transition-colors border-b border-indigo-100">LinkedIn</a>
            </div>
            {/* Syncing Status Indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 transition-opacity duration-300 ${isSyncingHead || syncQueue.length > 0 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isSyncingHead ? 'bg-indigo-600 animate-ping' : 'bg-slate-400'}`}></div>
              <span>{isSyncingHead ? 'Syncing to Cloud' : 'Cloud in Sync'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden sm:inline-block text-slate-400">© 2025 EdTech Studio</span>
             <span className="bg-indigo-600 text-white px-3 py-1 rounded shadow-md shadow-indigo-200">SHUBHANGI MAHAJAN</span>
          </div>
        </footer>
      </div>

      {/* MOBILE OVERLAY SHADE - Closes drawers when background is clicked */}
      {(isSidebarOpen || isAiOpen) && ( 
        <div 
          onClick={() => { setSidebarOpen(false); setAiOpen(false); }} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300" 
        /> 
      )}
    </div>
  );
}