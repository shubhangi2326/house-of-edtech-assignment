"use server";

import { prisma } from "../lib/db";
import * as Y from 'yjs';
import { getServerSession } from "next-auth";
import { authOptions } from "../../src/lib/auth"; 

export async function syncBinaryUpdate(docId: string, updateArray: number[], role: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "AUTH_REQUIRED" };
    
    const userId = (session.user as any).id;
    if (role === 'VIEWER') return { error: "VIEWER_DENIED" };

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
      create: { 
        id: docId, 
        contentBinary: Buffer.from(mergedState),
        userId: userId, 
        title: "Collaborative Document" 
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("CRITICAL_SYNC_ERROR:", error);
    // Error message ko saaf karke bhejna taaki UI pe dikhe
    return { error: error.message || "DATABASE_SAVE_FAILED" };
  }
}

export async function saveSnapshot(docId: string, htmlContent: string, role: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "NO_SESSION_FOUND" };

    const currentDoc = await prisma.document.findUnique({ where: { id: docId } });
    if (!currentDoc) return { error: "DOCUMENT_NOT_FOUND_IN_DB" };

    const newVersion = await prisma.version.create({
      data: {
        documentId: docId,
        content: htmlContent,
        updateData: currentDoc.contentBinary,
        label: `Snapshot - ${new Date().toLocaleTimeString()}`
      }
    });
    
    return { success: true, id: newVersion.id };
  } catch (e: any) {
    console.error("CRITICAL_SNAPSHOT_ERROR:", e);
    // Yeh UI ko batayega ki asali error kya hai (e.g. Missing Column)
    return { error: e.message || "FAILED_TO_CREATE_SNAPSHOT" };
  }
}

export async function getVersions(docId: string) {
  try {
    return await prisma.version.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  } catch (e) {
    return [];
  }
}

export async function deleteVersion(versionId: string) {
  try {
    await prisma.version.delete({ where: { id: versionId } });
    return { success: true };
  } catch (e) {
    return { error: "DELETE_FAILED" };
  }
}

export async function restoreToVersion(docId: string, versionId: string, role: string) {
  if (role !== 'OWNER') return { error: "RESTORE_DENIED" };
  try {
    const snapshot = await prisma.version.findUnique({ where: { id: versionId } });
    if (!snapshot || !snapshot.updateData) return { error: "DATA_MISSING" };

    await prisma.document.update({
      where: { id: docId },
      data: { contentBinary: snapshot.updateData, updatedAt: new Date() }
    });
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "RESTORE_FAILED" };
  }
}