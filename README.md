# 🚀 Advanced Local-First Collaborative Document Engine (v2.1)

Developed for the **House of EdTech Fullstack Developer Assignment**. This project demonstrates a sophisticated approach to distributed systems, browser memory management, and deterministic state synchronization.

## Engineering Philosophy & Problem Solving

### 1. Deterministic Conflict Resolution (CRDTs)
Unlike traditional editors that use Operational Transformation (OT), this engine leverages **Yjs (Conflict-free Replicated Data Types)**. 
- **Why?** CRDTs allow for decentralized state merging. Edits are commutative and associative, ensuring that regardless of network latency or the order of updates, all collaborators converge to the exact same state without a central authority.

### 2. Local-First Architecture & Background Sync
- **Source of Truth:** The primary source of truth is the client-side **IndexedDB**. 
- **Zero-Blocking UI:** The user can open, edit, and close documents with zero network requests blocking the main thread.
- **Robust Queueing Engine:** I implemented a custom background synchronization system with an **Async Action Queue**. If the network fails, updates are queued and automatically retried using a sequence-preserved reconciliation strategy when connectivity is restored.

### 3. Binary Sync & Memory Management
- **Performance:** To prevent browser lag and OOM (Out of Memory) issues, the system synchronizes using **Uint8Array (Binary Diffs)** instead of heavy HTML strings.
- **Payload Validation:** The server strictly validates synchronization payloads (Max 2MB) to protect against malicious data injection and server-side memory exhaustion.

### 4. Granular RBAC & Tenant Isolation
- **Role-Based Access Control:** Implemented strict `Owner`, `Editor`, and `Viewer` roles. 
- **Server-Side Security:** Authorization is enforced at the Server Action level. Viewer updates are discarded at the gateway, fulfilling the requirement that viewers cannot push state updates.
- **Tenant Isolation:** Every database query is scoped via **strict ORM scoping** in PostgreSQL to ensure absolute data isolation between users.

### 5. Multimodal AI & Accessibility
- **Cognitive Assistant:** Integrated **Groq (Llama 3.3)** for real-time document analysis.
- **Inclusive Design:** Features high-fidelity **Text-to-Speech (Speaker)** and **Speech-to-Text (Mic)** using the Web Speech API to ensure the platform is accessible to all users.
- **Vision Fallback:** Implemented strategic fallback logic for visual context when multimodal models are undergoing maintenance.

## 🛠️ Technical Stack
- **Framework:** Next.js 16 (App Router + Turbopack)
- **Collaboration Engine:** Yjs + IndexedDB (Local-First)
- **Database:** PostgreSQL via Prisma ORM
- **Authentication:** NextAuth.js (JWT Strategy)
- **Styling:** Tailwind CSS (Responsive Design)
- **AI Libraries:** Groq Cloud SDK

## ⚙️ Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up your `.env` with `DATABASE_URL`, `NEXTAUTH_SECRET`, and `GROQ_API_KEY`.
4. Push the schema: `npx prisma db push`
5. Run the dev server: `npm run dev`

---
### 👤 Developer Profile
**Name:** SHUBHANGI MAHAJAN  
**GitHub:** [shubhangi2326](https://github.com/shubhangi2326)  
**LinkedIn:** [Shubhangi Mahajan](https://linkedin.com/in/shubhangi-mahajan2)

*House of EdTech Proprietary Sync Engine v2.1*