"use server";

import { prisma } from "../lib/db";
import * as Y from 'yjs';
import { getServerSession } from "next-auth";
import { authOptions } from "../../src/lib/auth"; 


const MAX_PAYLOAD_SIZE = 1024 * 1024 * 2; // 2MB Security Limit

export async function syncBinaryUpdate(docId: string, updateArray: number[], role: string) {
  // 1. Authentication Check
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "AUTH_REQUIRED" };
  
  const userId = (session.user as any).id;

  if (role === 'VIEWER') {
    return { error: "AUTH_DENIED: Viewers cannot modify document state." };
  }

  if (updateArray.length > MAX_PAYLOAD_SIZE) {
    return { error: "SECURITY_VIOLATION: Payload too large." };
  }

  try {
    const incomingUpdate = new Uint8Array(updateArray);
    
    // 4. Fetch Document
    const doc = await prisma.document.findUnique({
      where: { id: docId }
    });

  

    let mergedState: Uint8Array;

    if (doc?.contentBinary) {
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, new Uint8Array(doc.contentBinary));
      Y.applyUpdate(ydoc, incomingUpdate);
      mergedState = Y.encodeStateAsUpdate(ydoc);
    } else {
      mergedState = incomingUpdate;
    }

    // 5. Atomic Upsert
    return await prisma.document.upsert({
      where: { id: docId },
      update: { 
        contentBinary: Buffer.from(mergedState),
        updatedAt: new Date() 
      },
      create: { 
        id: docId, 
        contentBinary: Buffer.from(mergedState),
        userId: userId, 
        title: "Active Collaborative Workspace" 
      }
    });

  } catch (error: any) {
    console.error("SYNC_CRITICAL_ERROR:", error);
    return { error: "INTERNAL_SERVER_ERROR" };
  }
}


export async function saveSnapshot(docId: string, htmlContent: string, role: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || role === 'VIEWER') return { error: "AUTH_DENIED" };

  try {
    const currentDoc = await prisma.document.findUnique({ where: { id: docId } });
    if (!currentDoc) return { error: "DOC_NOT_FOUND" };

    return await prisma.version.create({
      data: {
        documentId: docId,
        content: htmlContent,
        updateData: currentDoc.contentBinary,
        label: `Snapshot - ${new Date().toLocaleTimeString()}`
      }
    });
  } catch (e: any) {
    return { error: "SNAPSHOT_FAILED" };
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
    return { success: false };
  }
}


export async function restoreToVersion(docId: string, versionId: string, role: string) {
  if (role !== 'OWNER') return { error: "AUTH_DENIED: Only owners can restore." };

  try {
    const snapshot = await prisma.version.findUnique({ where: { id: versionId } });
    if (!snapshot || !snapshot.updateData) return { error: "DATA_NOT_FOUND" };

    return await prisma.document.update({
      where: { id: docId },
      data: {
        contentBinary: snapshot.updateData,
        updatedAt: new Date()
      }
    });
  } catch (e: any) {
    return { error: "RESTORE_FAILED" };
  }
}