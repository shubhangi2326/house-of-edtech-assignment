"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('../src/components/Editor'), { ssr: false });

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-indigo-600 animate-pulse uppercase tracking-[0.4em] text-xs">
        Securing Environment...
      </div>
    );
  }

  if (session) {
    const userRole = (session.user as any).role || "VIEWER";
    return <Editor docId="house-of-edtech-assignment" role={userRole} />;
  }

  return null;
}