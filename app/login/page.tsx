"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Hydration fix
  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) router.push("/");
    else alert("Invalid Credentials");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">House of EdTech</h1>
          <p className="text-slate-500 text-sm font-medium">Collaborative Engine v2.1</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="email" placeholder="Email Address" value={email} 
              onChange={(e) => setEmail(e.target.value)}
              suppressHydrationWarning // Fixes fdprocessedid error
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all" 
              required 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="password" placeholder="Password" value={password} 
              onChange={(e) => setPassword(e.target.value)}
              suppressHydrationWarning // Fixes fdprocessedid error
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all" 
              required 
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-200 active:scale-[0.98]">
            Sign In to Editor
          </button>
        </form>

        <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-700">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 text-center">RBAC Credentials</p>
          <div className="space-y-2 text-[10px] font-medium text-slate-400">
            <div className="flex justify-between border-b border-slate-800 pb-1"><span>Owner:</span> <span className="text-white">owner@edtech.com / 123456</span></div>
            <div className="flex justify-between border-b border-slate-800 pb-1"><span>Editor:</span> <span className="text-white">editor@edtech.com / 123456</span></div>
            <div className="flex justify-between"><span>Viewer:</span> <span className="text-white">viewer@edtech.com / 123456</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}