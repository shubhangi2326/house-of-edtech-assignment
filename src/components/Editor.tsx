// // "use client";
// // import { useEffect, useState, useMemo, useRef } from 'react';
// // import { useEditor } from '@tiptap/react';
// // import StarterKit from '@tiptap/starter-kit';
// // import Collaboration from '@tiptap/extension-collaboration';
// // import ImageExtension from '@tiptap/extension-image';
// // import * as Y from 'yjs';
// // import { IndexeddbPersistence } from 'y-indexeddb';
// // import { useSession } from "next-auth/react";

// // // Internal Components
// // import Navbar from './Navbar';
// // import Sidebar from './Sidebar';
// // import EditorMain from './EditorMain';
// // import AiAssistant from './AiAssistant';

// // // Backend Actions
// // import { 
// //   syncBinaryUpdate, 
// //   saveSnapshot, 
// //   getVersions, 
// //   deleteVersion, 
// //   restoreToVersion,
// //   getDocument 
// // } from '../backend/actions';

// // export default function Editor({ docId, role }: { docId: string, role: string }) {
// //   const { data: session } = useSession();
// //   const userId = (session?.user as any)?.id || "guest";
// //   const [isInitialLoading, setIsInitialLoading] = useState(true);

// //   // --- UI & NAVIGATION STATES ---
// //   const [isSidebarOpen, setSidebarOpen] = useState(false);
// //   const [isAiOpen, setAiOpen] = useState(false);
// //   const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
// //   const [sidebarTab, setSidebarTab] = useState<'chats' | 'history'>('chats');

// //   // --- DATA & AI STATES ---
// //   const [localChats, setLocalChats] = useState<any[]>([]); 
// //   const [activeChatId, setActiveChatId] = useState<string | null>(null);
// //   const [input, setInput] = useState("");
// //   const [pendingImage, setPendingImage] = useState<string | null>(null);
// //   const [isListening, setIsListening] = useState(false);
// //   const [loading, setLoading] = useState(false);
// //   const [versions, setVersions] = useState<any[]>([]);

// //   // --- SYNC ENGINE STATES ---
// //   const [syncQueue, setSyncQueue] = useState<number[][]>([]); 
// //   const [isSyncingHead, setIsSyncingHead] = useState(false); 

// //   // --- REFS & MEMO ---
// //   const ydoc = useMemo(() => new Y.Doc(), []);
// //   const chatEndRef = useRef<HTMLDivElement>(null);
// //   const fileInputRef = useRef<HTMLInputElement>(null);
// //   useEffect(() => {
// //     const loadInitialData = async () => {
// //       console.log(">>> [SYNC] Fetching initial state from Cloud...");
// //       const remoteUpdate = await getDocument(docId);
      
// //       if (remoteUpdate) {
// //         // Apply database state to local Yjs doc
// //         Y.applyUpdate(ydoc, new Uint8Array(remoteUpdate));
// //         console.log(">>> [SYNC] Document synced from Database");
// //       }
// //       setIsInitialLoading(false);
// //     };

// //     loadInitialData();
// //   }, [docId, ydoc]);
// //   // 1. LOCAL-FIRST PERSISTENCE (IndexedDB)
// //   useEffect(() => {
// //     if (typeof window === 'undefined') return;
// //     const provider = new IndexeddbPersistence(docId, ydoc);
// //     const updateStatus = () => setIsOnline(navigator.onLine);
    
// //     window.addEventListener('online', updateStatus);
// //     window.addEventListener('offline', updateStatus);
    
// //     return () => {
// //       provider.destroy();
// //       window.removeEventListener('online', updateStatus);
// //       window.removeEventListener('offline', updateStatus);
// //     };
// //   }, [docId, ydoc]);

// //   // 2. EDITOR INITIALIZATION
// //    const editor = useEditor({
// //     extensions: [
// //       StarterKit.configure({ history: false } as any), 
// //       Collaboration.configure({ document: ydoc }),
// //       ImageExtension.configure({ inline: true, allowBase64: true })
// //     ],
// //     editable: role !== 'VIEWER', 
// //     immediatelyRender: false,
// //   });
// //   // 3. LOAD PERSISTED DATA
// //   const refreshHistory = async () => {
// //     const data = await getVersions(docId);
// //     setVersions(data || []);
// //   };

// //   useEffect(() => {
// //     if (!userId) return;
// //     const storageKey = `house-of-edtech-chats-${userId}-${docId}`;
// //     const saved = localStorage.getItem(storageKey);
    
// //     if (saved) {
// //       const parsed = JSON.parse(saved);
// //       if (parsed.length > 0) {
// //         setLocalChats(parsed);
// //         setActiveChatId(parsed[0].id);
// //       } else { createNewChat(); }
// //     } else { createNewChat(); }
    
// //     refreshHistory();
// //   }, [docId, userId]);

// //   // 4. AUTO-SAVE CHATS TO LOCAL STORAGE
// //   useEffect(() => {
// //     if (userId !== "guest") {
// //       localStorage.setItem(`house-of-edtech-chats-${userId}-${docId}`, JSON.stringify(localChats));
// //     }
// //   }, [localChats, docId, userId]);

// //   // 5. YJS SYNC ENGINE (DB Synchronization)
// //   useEffect(() => {
// //     if (role === 'VIEWER') return;
// //     const handleUp = (update: Uint8Array) => setSyncQueue(prev => [...prev, Array.from(update)]);
// //     ydoc.on('update', handleUp);
// //     return () => { ydoc.off('update', handleUp); };
// //   }, [ydoc, role]);

// //   useEffect(() => {
// //     const processQueue = async () => {
// //       if (!isOnline || syncQueue.length === 0 || isSyncingHead) return;
      
// //       setIsSyncingHead(true);
// //       const nextUpdate = syncQueue[0];
      
// //       try {
// //         const res = await syncBinaryUpdate(docId, nextUpdate, role);
// //         if (res && !res.error) {
// //           setSyncQueue(prev => prev.slice(1)); // Success: Pop from queue
// //         } else {
// //           // Wait before retry if server error occurred
// //           await new Promise(r => setTimeout(r, 4000));
// //         }
// //       } catch (e) { 
// //         console.error("Cloud Sync Interrupted. Retrying..."); 
// //         await new Promise(r => setTimeout(r, 4000));
// //       } finally { 
// //         setIsSyncingHead(false); 
// //       }
// //     };
// //     processQueue();
// //   }, [syncQueue, isOnline, isSyncingHead, docId, role]);

// //   // 6. AI & VOICE UTILITIES
// //   const readAloud = (text: string) => {
// //     if (typeof window !== "undefined" && window.speechSynthesis) {
// //       window.speechSynthesis.cancel();
// //       const utterance = new SpeechSynthesisUtterance(text);
// //       utterance.rate = 0.9;
// //       window.speechSynthesis.speak(utterance);
// //     }
// //   };

// //   const startListening = () => {
// //     const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
// //     if (!SR) return alert("Your browser does not support Speech Recognition.");
// //     const rec = new SR();
// //     rec.onstart = () => setIsListening(true);
// //     rec.onresult = (e: any) => { 
// //       setInput(e.results[0][0].transcript); 
// //       setIsListening(false); 
// //     };
// //     rec.onerror = () => setIsListening(false);
// //     rec.start();
// //   };

// //   const sendMessage = async () => {
// //     if ((!input.trim() && !pendingImage) || loading) return;

// //     let currentId = activeChatId;
// //     if (!currentId) {
// //       const newId = "chat_" + Date.now();
// //       setLocalChats([{ id: newId, title: "Quick Discussion", messages: [] }]);
// //       setActiveChatId(newId);
// //       currentId = newId;
// //     }

// //     const userMsg = { role: "user", content: input || "Shared Context", image: pendingImage };
    
// //     // Update local state immediately for UI responsiveness
// //     setLocalChats(prev => prev.map(c => 
// //       c.id === currentId 
// //       ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? input.slice(0, 20) : c.title } 
// //       : c
// //     ));
    
// //     setLoading(true); 
// //     setInput(""); 
// //     setPendingImage(null);

// //     try {
// //       const res = await fetch('/api/ai', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ 
// //           message: userMsg.content, 
// //           docContent: editor?.getText(), 
// //           history: localChats.find(c => c.id === currentId)?.messages || [], 
// //           image: userMsg.image 
// //         })
// //       });
// //       const data = await res.json();
      
// //       setLocalChats(prev => prev.map(c => 
// //         c.id === currentId 
// //         ? { ...c, messages: [...c.messages, { role: "assistant", content: data.reply }] } 
// //         : c
// //       ));
// //     } catch (err) {
// //       alert("AI Service temporarily unavailable.");
// //     } finally { 
// //       setLoading(false); 
// //     }
// //   };

// //   // 7. SNAPSHOT & CHAT MANAGEMENT
// //   const createNewChat = () => {
// //     const newId = "chat_" + Date.now();
// //     setLocalChats(prev => [{ id: newId, title: "New Discussion", messages: [] }, ...prev]);
// //     setActiveChatId(newId);
// //     setSidebarTab('chats');
// //     if (window.innerWidth < 1024) setSidebarOpen(false);
// //   };

// //   const handleDeleteChat = (id: string, e: React.MouseEvent) => {
// //     e.stopPropagation();
// //     if (!confirm("Delete this discussion permanently?")) return;
// //     const updated = localChats.filter(c => c.id !== id);
// //     setLocalChats(updated);
// //     if (activeChatId === id) setActiveChatId(updated.length > 0 ? updated[0].id : null);
// //   };

// //   const handleSaveSnapshot = async () => {
// //     if (role === 'VIEWER') return;
// //     const res = await saveSnapshot(docId, editor?.getHTML() || "", role);
// //     if (res.error) alert(res.error);
// //     else {
// //       alert("Version State Synchronized Successfully!");
// //       await refreshHistory();
// //       setSidebarTab('history');
// //     }
// //   };

// //   const handleRestore = async (versionId: string) => {
// //     if (role !== 'OWNER') return alert("Access Restricted: Only Owners can restore documents.");
// //     if (!confirm("This will overwrite current document content. Proceed?")) return;
    
// //     const res = await restoreToVersion(docId, versionId, role);
// //     if (res.success) window.location.reload();
// //     else alert(res.error);
// //   };
// //  if (isInitialLoading) {
// //     return (
// //       <div className="h-screen w-full flex items-center justify-center bg-slate-50">
// //         <div className="flex flex-col items-center gap-4">
// //           <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
// //           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Waking up the Cloud...</p>
// //         </div>
// //       </div>
// //     );
// //   }
// //   return (
// //     <div className="flex h-screen bg-[#F8FAFC] text-[#0f172a] overflow-hidden relative font-sans">
      
// //       {/* SIDEBAR DRAWER - Responsive overlay on mobile, fixed on desktop */}
// //       <div className={`fixed inset-y-0 left-0 z-[100] lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
// //         <Sidebar 
// //           role={role} 
// //           sidebarTab={sidebarTab} 
// //           setSidebarTab={setSidebarTab} 
// //           sessions={localChats} 
// //           activeSessionId={activeChatId} 
// //           setActiveSessionId={setActiveChatId} 
// //           createNewSession={createNewChat} 
// //           deleteChat={handleDeleteChat}
// //           versions={versions} 
// //           editor={editor} 
// //           loadHistory={refreshHistory}
// //           handleRestore={handleRestore}
// //         />
// //       </div>

// //       <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
// //         {/* TOP NAVBAR */}
// //      <Navbar 
// //   isOnline={isOnline} 
// //   role={role} 
// //   toggleSidebar={() => setSidebarOpen(true)} 
// //   toggleAi={() => setAiOpen(true)} 
// // />

// //         <div className="flex-1 flex overflow-hidden">
// //           {/* MAIN EDITOR AREA */}
// //           <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide">
// //             <EditorMain 
// //               role={role} 
// //               editor={editor} 
// //               handleSaveSnapshot={handleSaveSnapshot} 
// //             />
// //           </main>
          
// //           {/* AI PANEL DRAWER - Responsive overlay on mobile, fixed on desktop */}
// //           <div className={`fixed inset-y-0 right-0 z-[100] lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isAiOpen ? 'translate-x-0' : 'translate-x-full lg:block'}`}>
// //             <AiAssistant 
// //               activeSession={localChats.find(c => c.id === activeChatId)} 
// //               loading={loading} 
// //               input={input} 
// //               setInput={setInput} 
// //               sendMessage={sendMessage} 
// //               readAloud={readAloud} 
// //               pendingImage={pendingImage} 
// //               setPendingImage={setPendingImage} 
// //               startListening={startListening} 
// //               isListening={isListening} 
// //               fileInputRef={fileInputRef} 
// //               chatEndRef={chatEndRef} 
// //               closeAi={() => setAiOpen(false)} 
// //             />
// //           </div>
// //         </div>

// //         {/* COMPREHENSIVE FOOTER */}
// //         <footer className="h-12 bg-white border-t border-slate-200 flex items-center justify-between px-6 sm:px-8 text-[9px] md:text-[10px] font-black uppercase tracking-widest shrink-0 z-50">
// //           <div className="flex gap-4 md:gap-8 items-center">
// //             <div className="flex gap-3">
// //               <a href="https://github.com/shubhangi2326" target="_blank" className="text-indigo-600 hover:text-indigo-800 transition-colors border-b border-indigo-100">GitHub</a>
// //               <a href="https://linkedin.com/in/shubhangi-mahajan2" target="_blank" className="text-indigo-600 hover:text-indigo-800 transition-colors border-b border-indigo-100">LinkedIn</a>
// //             </div>
// //             {/* Syncing Status Indicator */}
// //             <div className={`hidden sm:flex items-center gap-1.5 transition-opacity duration-300 ${isSyncingHead || syncQueue.length > 0 ? 'opacity-100' : 'opacity-40'}`}>
// //               <div className={`w-1.5 h-1.5 rounded-full ${isSyncingHead ? 'bg-indigo-600 animate-ping' : 'bg-slate-400'}`}></div>
// //               <span>{isSyncingHead ? 'Syncing to Cloud' : 'Cloud in Sync'}</span>
// //             </div>
// //           </div>
// //           <div className="flex items-center gap-4">
// //              <span className="hidden sm:inline-block text-slate-400">© 2025 EdTech Studio</span>
// //              <span className="bg-indigo-600 text-white px-3 py-1 rounded shadow-md shadow-indigo-200">SHUBHANGI MAHAJAN</span>
// //           </div>
// //         </footer>
// //       </div>

// //       {/* MOBILE OVERLAY SHADE - Closes drawers when background is clicked */}
// //       {(isSidebarOpen || isAiOpen) && ( 
// //         <div 
// //           onClick={() => { setSidebarOpen(false); setAiOpen(false); }} 
// //           className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300" 
// //         /> 
// //       )}
// //     </div>
// //   );
// // }

// "use client";
// import { useEffect, useState, useMemo, useRef } from 'react';
// import { useEditor } from '@tiptap/react';
// import StarterKit from '@tiptap/starter-kit';
// import Collaboration from '@tiptap/extension-collaboration';
// import ImageExtension from '@tiptap/extension-image';
// import * as Y from 'yjs';
// import { IndexeddbPersistence } from 'y-indexeddb';
// import { useSession } from "next-auth/react";

// import Navbar from './Navbar';
// import Sidebar from './Sidebar';
// import EditorMain from './EditorMain';
// import AiAssistant from './AiAssistant';

// import { 
//   syncBinaryUpdate, saveSnapshot, getVersions, deleteVersion, 
//   restoreToVersion, getDocumentState, saveChatMessage, getChatSessions, deleteChatSession 
// } from '../backend/actions';

// export default function Editor({ docId, role }: { docId: string, role: string }) {
//   const { data: session } = useSession();
//   const userId = (session?.user as any)?.id || "guest";

//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const [isAiOpen, setAiOpen] = useState(false);
//   const [isOnline, setIsOnline] = useState(true); // Tracking real connectivity
//   const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  
//   const [sidebarTab, setSidebarTab] = useState<'chats' | 'history'>('chats');
//   const [localChats, setLocalChats] = useState<any[]>([]); 
//   const [activeChatId, setActiveChatId] = useState<string | null>(null);
//   const [input, setInput] = useState("");
//   const [pendingImage, setPendingImage] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [versions, setVersions] = useState<any[]>([]);
  
//   // SYNC QUEUE: Assignment Requirement for Offline Reconcilation
//   const [syncQueue, setSyncQueue] = useState<number[][]>([]); 
//   const [isSyncingHead, setIsSyncingHead] = useState(false); 

//   const ydoc = useMemo(() => new Y.Doc(), []);
//   const chatEndRef = useRef<HTMLDivElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // 1. IMPROVED CONNECTIVITY MONITORING
//   useEffect(() => {
//     if (typeof window === 'undefined') return;

//     // Local-First Persistence: Save edits even when offline
//     const provider = new IndexeddbPersistence(docId, ydoc);

//     const updateStatus = () => {
//       // Logic: navigator.onLine is just a hint, we'll confirm during sync
//       setIsOnline(navigator.onLine);
//       if (!navigator.onLine) {
//         console.warn(">>> [NETWORK] Device is offline. Sync paused.");
//       }
//     };

//     window.addEventListener('online', updateStatus);
//     window.addEventListener('offline', updateStatus);
    
//     // Initial check
//     updateStatus();

//     return () => {
//       provider.destroy();
//       window.removeEventListener('online', updateStatus);
//       window.removeEventListener('offline', updateStatus);
//     };
//   }, [docId, ydoc]);

//   // 2. INITIAL DATA LOAD
//   useEffect(() => {
//     const syncWithCloud = async () => {
//       if (!userId || userId === "guest") return;
//       try {
//         const remoteUpdate = await getDocumentState(docId);
//         if (remoteUpdate) Y.applyUpdate(ydoc, new Uint8Array(remoteUpdate));
//         const cloudSessions = await getChatSessions(docId, userId);
//         if (cloudSessions.length > 0) {
//           setLocalChats(cloudSessions);
//           setActiveChatId(cloudSessions[0].id);
//         } else { createNewChat(); }
//       } catch (err) {
//         console.error("Initial load failed. Working offline.");
//         setIsOnline(false);
//       } finally {
//         setIsInitialSyncing(false);
//         refreshHistory();
//       }
//     };
//     syncWithCloud();
//   }, [docId, userId, ydoc]);

//   // 3. TIPTAP EDITOR INIT
//   const editor = useEditor({
//     extensions: [
//       StarterKit.configure({ history: false } as any), 
//       Collaboration.configure({ document: ydoc }),
//       ImageExtension.configure({ inline: true, allowBase64: true })
//     ],
//     editable: role !== 'VIEWER', 
//     immediatelyRender: false,
//   });

//   // 4. THE BACKGROUND SYNC ENGINE (Requirement: Offline Sync)
//   useEffect(() => {
//     if (role === 'VIEWER') return;
//     const handleUp = (update: Uint8Array) => setSyncQueue(prev => [...prev, Array.from(update)]);
//     ydoc.on('update', handleUp);
//     return () => { ydoc.off('update', handleUp); };
//   }, [ydoc, role]);

//   useEffect(() => {
//     const processQueue = async () => {
//       // If we are offline or already syncing, wait.
//       if (!isOnline || syncQueue.length === 0 || isSyncingHead) return;
      
//       setIsSyncingHead(true);
//       const nextUpdate = syncQueue[0];
      
//       try {
//         const res = await syncBinaryUpdate(docId, nextUpdate, role);
//         if (res && !res.error) {
//           // SUCCESS: Remove from queue and mark online
//           setSyncQueue(prev => prev.slice(1)); 
//           if (!isOnline) setIsOnline(true);
//         } else {
//           // SERVER ERROR: Mark offline and wait
//           setIsOnline(false);
//           await new Promise(r => setTimeout(r, 5000));
//         }
//       } catch (e) {
//         // NETWORK CRASH: Mark offline and wait
//         setIsOnline(false);
//         await new Promise(r => setTimeout(r, 5000));
//       } finally {
//         setIsSyncingHead(false);
//       }
//     };
//     processQueue();
//   }, [syncQueue, isOnline, isSyncingHead, docId, role]);

//   // 5. HANDLERS
//   const sendMessage = async () => {
//     if ((!input.trim() && !pendingImage) || loading || !activeChatId) return;
//     const userMsg = { role: "user", content: input, image: pendingImage };
//     setLocalChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? (input.slice(0, 20) + "...") : c.title } : c));
//     setLoading(true); setInput(""); setPendingImage(null);
//     try {
//       await saveChatMessage(activeChatId, docId, userId, "user", userMsg.content, userMsg.image);
//       const res = await fetch('/api/ai', { method: 'POST', body: JSON.stringify({ message: userMsg.content, docContent: editor?.getText() }) });
//       const data = await res.json();
//       await saveChatMessage(activeChatId, docId, userId, "assistant", data.reply);
//       setLocalChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, { role: "assistant", content: data.reply }] } : c));
//     } finally { setLoading(false); }
//   };

//   const createNewChat = () => {
//     const id = "chat_" + Date.now();
//     setLocalChats(prev => [{ id, title: "New Discussion", messages: [] }, ...prev]);
//     setActiveChatId(id);
//   };

//   const refreshHistory = async () => { setVersions(await getVersions(docId) || []); };

//   const startListening = () => {
//     const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
//     if (SR) {
//       const rec = new SR();
//       rec.onstart = () => setIsListening(true);
//       rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false); };
//       rec.onerror = () => setIsListening(false);
//       rec.start();
//     }
//   };

//   const readAloud = (text: string) => {
//     if (typeof window !== "undefined" && window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//       window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
//     }
//   };

//   if (isInitialSyncing) return (
//     <div className="h-screen w-full flex flex-col items-center justify-center bg-white font-sans">
//       <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
//       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booting Collaborative Workspace...</p>
//     </div>
//   );

//   return (
//     <div className="flex h-screen bg-slate-50 overflow-hidden relative font-sans">
      
//       {/* SIDEBAR */}
//       <div className={`fixed inset-y-0 left-0 z-[100] lg:relative lg:translate-x-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
//         <Sidebar 
//           role={role} sidebarTab={sidebarTab} setSidebarTab={setSidebarTab} 
//           sessions={localChats} activeSessionId={activeChatId} setActiveSessionId={setActiveChatId}
//           versions={versions} editor={editor} loadHistory={refreshHistory} 
//           createNewSession={createNewChat} 
//           deleteChat={async (id: string, e: any) => { e.stopPropagation(); await deleteChatSession(id, userId); setLocalChats(p => p.filter(c => c.id !== id)); }}
//           handleRestore={async (vId: string) => { const res = await restoreToVersion(docId, vId, role); if (res.success) window.location.reload(); }}
//           closeSidebar={() => setSidebarOpen(false)}
//           openAi={() => setAiOpen(true)}
//         />
//       </div>

//       <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
//         {/* Navbar with LIVE CONNECTION UI */}
//         <Navbar isOnline={isOnline} role={role} toggleSidebar={() => setSidebarOpen(true)} toggleAi={() => setAiOpen(true)} />

//         <div className="flex-1 flex overflow-hidden">
//           <main className="flex-1 overflow-y-auto p-4 sm:p-10 scrollbar-hide">
//             <EditorMain role={role} editor={editor} handleSaveSnapshot={async () => { await saveSnapshot(docId, editor?.getHTML() || "", role); refreshHistory(); setSidebarTab('history'); }} />
//           </main>
          
//           {/* AI PANEL */}
//           <div className={`fixed inset-y-0 right-0 z-[100] lg:relative lg:translate-x-0 transition-transform duration-300 ${isAiOpen ? 'translate-x-0' : 'translate-x-full lg:block'}`}>
//             <AiAssistant 
//               activeSession={localChats.find(c => c.id === activeChatId)} 
//               loading={loading} input={input} setInput={setInput} sendMessage={sendMessage} 
//               readAloud={readAloud} startListening={startListening} isListening={isListening}
//               pendingImage={pendingImage} setPendingImage={setPendingImage} fileInputRef={fileInputRef} chatEndRef={chatEndRef} closeAi={() => setAiOpen(false)} 
//             />
//           </div>
//         </div>

//         {/* FOOTER with Sync Status */}
//         <footer className="h-12 bg-white border-t flex items-center justify-between px-8 text-[10px] font-black uppercase shrink-0">
//            <div className="flex gap-4">
//              <a href="https://github.com/shubhangi2326" target="_blank" className="text-indigo-600 border-b border-indigo-50">GITHUB</a>
//              <a href="https://linkedin.com/in/shubhangi-mahajan2" target="_blank" className="text-indigo-600 border-b border-indigo-50">LINKEDIN</a>
//            </div>
           
//            <div className="flex items-center gap-6">
//               {/* SYNC INDICATOR - Critical for the assignment grade */}
//               <div className="flex items-center gap-2">
//                 <div className={`w-2 h-2 rounded-full ${syncQueue.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
//                 <span className="text-[8px] text-slate-400">
//                   {syncQueue.length > 0 ? `${syncQueue.length} Pending Updates` : 'All changes synced'}
//                 </span>
//               </div>
//               <span className="bg-indigo-600 text-white px-3 py-1 rounded">SHUBHANGI MAHAJAN</span>
//            </div>
//         </footer>
//       </div>

//       {(isSidebarOpen || isAiOpen) && <div onClick={() => { setSidebarOpen(false); setAiOpen(false); }} className="fixed inset-0 bg-black/40 z-[90] lg:hidden animate-in fade-in" />}
//     </div>
//   );
// }

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

  // 1. INITIAL LOAD (Sync Editor & Chat)
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
      if (!isOnline || syncQueue.length === 0 || isSyncingHead) return;
      setIsSyncingHead(true);
      const nextUpdate = syncQueue[0];
      try {
        const res = await syncBinaryUpdate(docId, nextUpdate, role);
        if (res && !res.error) setSyncQueue(prev => prev.slice(1));
        else await new Promise(r => setTimeout(r, 4000));
      } finally { setIsSyncingHead(false); }
    };
    processQueue();
  }, [syncQueue, isOnline, isSyncingHead, docId, role]);

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
              <span className="bg-indigo-600 text-white px-3 py-1 rounded">SHUBHANGI MAHAJAN</span>
           </div>
        </footer>
      </div>

      {(isSidebarOpen || isAiOpen) && <div onClick={() => { setSidebarOpen(false); setAiOpen(false); }} className="fixed inset-0 bg-black/40 z-[90] lg:hidden animate-in fade-in" />}
    </div>
  );
}