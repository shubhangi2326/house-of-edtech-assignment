"use client";
import { useEffect, useState, useMemo, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import ImageExtension from '@tiptap/extension-image';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useSession } from "next-auth/react";

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import EditorMain from './EditorMain';
import AiAssistant from './AiAssistant';

import { 
  syncBinaryUpdate, saveSnapshot, getVersions, deleteVersion, 
  restoreToVersion, getDocumentState, saveChatMessage, getChatSessions, deleteChatSession 
} from '../backend/actions';

export default function Editor({ docId, role }: { docId: string, role: string }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || "guest";

  // --- UI STATES ---
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAiOpen, setAiOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'history'>('chats');
  
  // --- DATA STATES ---
  const [localChats, setLocalChats] = useState<any[]>([]); 
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  
  // --- SYNC ENGINE ---
  const [syncQueue, setSyncQueue] = useState<number[][]>([]); 
  const [isSyncingHead, setIsSyncingHead] = useState(false); 

  const ydoc = useMemo(() => new Y.Doc(), []);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const provider = new IndexeddbPersistence(docId, ydoc);
    
    setIsOnline(typeof window !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      provider.destroy();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [docId, ydoc]);
 
  useEffect(() => {
    const syncWithCloud = async () => {
      if (!userId || userId === "guest") return;
      
      const remoteUpdate = await getDocumentState(docId);
      if (remoteUpdate) Y.applyUpdate(ydoc, new Uint8Array(remoteUpdate));

      const cloudSessions = await getChatSessions(docId, userId);
      if (cloudSessions.length > 0) {
        setLocalChats(cloudSessions);
        setActiveChatId(cloudSessions[0].id);
      } else { createNewChat(); }
      
      setIsInitialSyncing(false);
      refreshHistory();
    };
    syncWithCloud();
  }, [docId, userId, ydoc]);

  // 2. EDITOR
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false } as any), 
      Collaboration.configure({ document: ydoc }),
      ImageExtension.configure({ inline: true, allowBase64: true })
    ],
    editable: role !== 'VIEWER', 
    immediatelyRender: false,
  });

  // 3. BACKGROUND SYNC ENGINE
  useEffect(() => {
    if (role === 'VIEWER') return;
    const handleUp = (update: Uint8Array) => setSyncQueue(prev => [...prev, Array.from(update)]);
    ydoc.on('update', handleUp);
    return () => { ydoc.off('update', handleUp); };
  }, [ydoc, role]);

useEffect(() => {
    const processQueue = async () => {
      if (syncQueue.length === 0 || isSyncingHead) return;
      
      setIsSyncingHead(true);
      const nextUpdate = syncQueue[0];
      
      try {
        const res = await syncBinaryUpdate(docId, nextUpdate, role);
        if (res && !res.error) {
          setSyncQueue(prev => prev.slice(1)); 
          setIsOnline(true); // Sync success = Online
        } else {
          setIsOnline(false); // Sync fail = Offline
          await new Promise(r => setTimeout(r, 5000));
        }
      } catch (e) {
        setIsOnline(false); // Exception = Offline
        await new Promise(r => setTimeout(r, 5000));
      } finally {
        setIsSyncingHead(false);
      }
    };
    processQueue();
  }, [syncQueue, isSyncingHead, docId, role]);

  // 4. HANDLERS
  const handleSaveSnapshot = async () => {
    if (role === 'VIEWER' || !editor) return;

    // IMPORTANT: Capture the current Yjs Binary State Vector
    const currentBinaryState = Array.from(Y.encodeStateAsUpdate(ydoc));
    const currentHtml = editor.getHTML();

    console.log(">>> [VERSION] Capturing state for history...");
    const res = await saveSnapshot(docId, currentHtml, currentBinaryState, role);

    if (res.success) {
      alert("Version Snapshot Saved Successfully!");
      refreshHistory();
      setSidebarTab('history');
    } else {
      alert(res.error || "Failed to save version");
    }
  };

  const handleRestore = async (vId: string) => {
    if (role !== 'OWNER') return alert("Only owners can restore!");
    if (!confirm("Restore this version? This will overwrite the current live document.")) return;
    
    const res = await restoreToVersion(docId, vId, role);
    if (res.success) {
      // Force reload to let Yjs fetch the restored state from DB
      window.location.reload(); 
    } else {
      alert(res.error);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !pendingImage) || loading || !activeChatId) return;
    const userMsg = { role: "user", content: input, image: pendingImage };
    setLocalChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? (input.slice(0, 20) + "...") : c.title } : c));
    setLoading(true); setInput(""); setPendingImage(null);
    try {
      await saveChatMessage(activeChatId, docId, userId, "user", userMsg.content, userMsg.image);
      const res = await fetch('/api/ai', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: userMsg.content, docContent: editor?.getText() }) });
      const data = await res.json();
      await saveChatMessage(activeChatId, docId, userId, "assistant", data.reply);
      setLocalChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, { role: "assistant", content: data.reply }] } : c));
    } finally { setLoading(false); }
  };

  const createNewChat = () => {
    const id = "chat_" + Date.now();
    setLocalChats(prev => [{ id, title: "New Discussion", messages: [] }, ...prev]);
    setActiveChatId(id);
  };

  const refreshHistory = async () => { setVersions(await getVersions(docId) || []); };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false); };
      rec.onerror = () => setIsListening(false);
      rec.start();
    }
  };

  const readAloud = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  if (isInitialSyncing) return <div className="h-screen w-full flex items-center justify-center font-black uppercase text-slate-400">Syncing Cloud Workspace...</div>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative font-sans">
      
      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-[100] lg:relative lg:translate-x-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          role={role} sidebarTab={sidebarTab} setSidebarTab={setSidebarTab} 
          sessions={localChats} activeSessionId={activeChatId} setActiveSessionId={setActiveChatId}
          versions={versions} editor={editor} loadHistory={refreshHistory} 
          createNewSession={createNewChat} 
          deleteChat={async (id: string, e: any) => { e.stopPropagation(); await deleteChatSession(id, userId); setLocalChats(p => p.filter(c => c.id !== id)); }}
          handleRestore={handleRestore}
          closeSidebar={() => setSidebarOpen(false)}
          openAi={() => setAiOpen(true)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar isOnline={isOnline} role={role} toggleSidebar={() => setSidebarOpen(true)} toggleAi={() => setAiOpen(true)} />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-10 scrollbar-hide">
            <EditorMain role={role} editor={editor} handleSaveSnapshot={handleSaveSnapshot} />
          </main>
          
          {/* AI PANEL */}
          <div className={`fixed inset-y-0 right-0 z-[100] lg:relative lg:translate-x-0 transition-transform duration-300 ${isAiOpen ? 'translate-x-0' : 'translate-x-full lg:block'}`}>
            <AiAssistant 
              activeSession={localChats.find(c => c.id === activeChatId)} 
              loading={loading} input={input} setInput={setInput} sendMessage={sendMessage} 
              readAloud={readAloud} startListening={startListening} isListening={isListening}
              pendingImage={pendingImage} setPendingImage={setPendingImage} fileInputRef={fileInputRef} chatEndRef={chatEndRef} closeAi={() => setAiOpen(false)} 
            />
          </div>
        </div>

        {/* FOOTER */}
        <footer className="h-12 bg-white border-t flex items-center justify-between px-8 text-[10px] font-black uppercase shrink-0">
           <div className="flex gap-4">
             <a href="https://github.com/shubhangi2326" target="_blank" className="text-indigo-600 border-b border-indigo-100">GITHUB</a>
             <a href="https://linkedin.com/in/shubhangi-mahajan2" target="_blank" className="text-indigo-600 border-b border-indigo-100">LINKEDIN</a>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${syncQueue.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-[8px] text-slate-400">{syncQueue.length > 0 ? 'Syncing...' : 'All changes saved'}</span>
              </div>
                <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? (syncQueue.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500') : 'bg-rose-500'}`}></div>
        <span className="text-[8px] text-slate-400">
          {!isOnline ? 'OFFLINE - Sync paused' : (syncQueue.length > 0 ? `${syncQueue.length} Pending` : 'All changes saved')}
        </span>
      </div>
              <span className="bg-indigo-600 text-white px-3 py-1 rounded">SHUBHANGI MAHAJAN</span>
           </div>
        </footer>
      </div>

      {(isSidebarOpen || isAiOpen) && <div onClick={() => { setSidebarOpen(false); setAiOpen(false); }} className="fixed inset-0 bg-black/40 z-[90] lg:hidden animate-in fade-in" />}
    </div>
  );
}