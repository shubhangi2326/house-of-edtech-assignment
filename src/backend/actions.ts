"use server";
import { prisma } from "../lib/db";
import * as Y from 'yjs';
import { getServerSession } from "next-auth";
import { authOptions } from "../../src/lib/auth"; 

// 1. Fetch Initial State
export async function getDocumentState(docId: string) {
  try {
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    return doc?.contentBinary ? Array.from(new Uint8Array(doc.contentBinary)) : null;
  } catch (e) { return null; }
}

// 2. Sync Binary Update (Cloud Reconciliation)
export async function syncBinaryUpdate(docId: string, updateArray: number[], role: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || role === 'VIEWER') return { error: "AUTH_DENIED" };
    const userId = (session.user as any).id;

    const incomingUpdate = new Uint8Array(updateArray);
    const doc = await prisma.document.findUnique({ where: { id: docId } });

    let mergedState: Uint8Array;
    if (doc?.contentBinary) {
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, new Uint8Array(doc.contentBinary));
      Y.applyUpdate(ydoc, incomingUpdate);
      mergedState = Y.encodeStateAsUpdate(ydoc);
    } else {
      mergedState = incomingUpdate;
    }

    await prisma.document.upsert({
      where: { id: docId },
      update: { contentBinary: Buffer.from(mergedState), updatedAt: new Date() },
      create: { id: docId, contentBinary: Buffer.from(mergedState), userId, title: "Cloud Document" }
    });
    return { success: true };
  } catch (e) { return { error: "SAVE_FAILED" }; }
}

// 3. Version Control (FIXED: Capturing specific binary state)
export async function saveSnapshot(docId: string, htmlContent: string, binaryUpdate: number[], role: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || role === 'VIEWER') return { error: "DENIED" };

    // We now save the ACTUAL binary state from the client at this moment
    await prisma.version.create({
      data: {
        documentId: docId,
        content: htmlContent,
        updateData: Buffer.from(new Uint8Array(binaryUpdate)),
        label: `Snapshot - ${new Date().toLocaleTimeString()}`
      }
    });
    return { success: true };
  } catch (e: any) {
    console.error("SNAPSHOT_ERROR:", e.message);
    return { error: "FAILED_TO_SAVE_VERSION" };
  }
}

export async function getVersions(docId: string) {
  return await prisma.version.findMany({ where: { documentId: docId }, orderBy: { createdAt: 'desc' }, take: 20 });
}

export async function deleteVersion(versionId: string) {
  await prisma.version.delete({ where: { id: versionId } });
  return { success: true };
}

export async function restoreToVersion(docId: string, versionId: string, role: string) {
  if (role !== 'OWNER') return { error: "RESTORE_DENIED: Owners only" };

  try {
    const snapshot = await prisma.version.findUnique({ where: { id: versionId } });
    if (!snapshot || !snapshot.updateData) return { error: "SNAPSHOT_EMPTY" };

    // Overwrite the main document's binary state with the snapshot's binary state
    await prisma.document.update({
      where: { id: docId },
      data: {
        contentBinary: snapshot.updateData,
        updatedAt: new Date()
      }
    });
    return { success: true };
  } catch (e: any) {
    return { error: "RESTORE_FAILED" };
  }
}

// 4. Chat Persistence
export async function saveChatMessage(sessionId: string, docId: string, userId: string, role: string, content: string, image?: string | null) {
  try {
    return await prisma.chatMessage.create({ data: { sessionId, docId, userId, role, content, image: image || null } });
  } catch (e) { return null; }
}

export async function getChatSessions(docId: string, userId: string) {
  try {
    const messages = await prisma.chatMessage.findMany({ where: { docId, userId }, orderBy: { createdAt: 'asc' } });
    const sessionsMap: any = {};
    messages.forEach((m) => {
      if (!sessionsMap[m.sessionId]) {
        sessionsMap[m.sessionId] = { id: m.sessionId, title: m.content.slice(0, 20) + "...", messages: [] };
      }
      sessionsMap[m.sessionId].messages.push({ role: m.role, content: m.content, image: m.image });
    });
    return Object.values(sessionsMap);
  } catch (e) { return []; }
}

export async function deleteChatSession(sessionId: string, userId: string) {
  try {
    await prisma.chatMessage.deleteMany({ where: { sessionId, userId } });
    return { success: true };
  } catch (e) { return { error: "DELETE_FAILED" }; }
}