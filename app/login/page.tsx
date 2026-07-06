"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) router.push("/");
    else alert("Invalid Credentials");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-[420px] w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Compact Header */}
        <div className="bg-indigo-600 p-5 flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-tight leading-none">House of EdTech</h1>
            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">Engine v2.1</p>
          </div>
        </div>

        <div className="p-6">
          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="email" placeholder="Email Address" value={email} 
                onChange={(e) => setEmail(e.target.value)}
                suppressHydrationWarning 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all" 
                required 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" placeholder="Password" value={password} 
                onChange={(e) => setPassword(e.target.value)}
                suppressHydrationWarning 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all" 
                required 
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-100 active:scale-[0.98] text-sm">
              Sign In to Dashboard
            </button>
          </form>

          {/* Credentials Section - Made Clear and Readable */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Access Accounts</p>
            
            <div className="space-y-3">
              {/* OWNER */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="mt-1"><ChevronRight size={14} className="text-indigo-500"/></div>
                <div className="text-[13px] leading-relaxed">
                  <p className="font-black text-indigo-600 text-[11px] uppercase tracking-tighter">Owner Access</p>
                  <p className="text-slate-600 font-medium">Email: <span className="text-slate-900 font-bold">owner@edtech.com</span></p>
                  <p className="text-slate-600 font-medium">Password: <span className="text-slate-900 font-bold">123456</span></p>
                </div>
              </div>

              {/* EDITOR */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="mt-1"><ChevronRight size={14} className="text-emerald-500"/></div>
                <div className="text-[13px] leading-relaxed">
                  <p className="font-black text-emerald-600 text-[11px] uppercase tracking-tighter">Editor Access</p>
                  <p className="text-slate-600 font-medium">Email: <span className="text-slate-900 font-bold">editor@edtech.com</span></p>
                  <p className="text-slate-600 font-medium">Password: <span className="text-slate-900 font-bold">123456</span></p>
                </div>
              </div>

              {/* VIEWER */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="mt-1"><ChevronRight size={14} className="text-amber-500"/></div>
                <div className="text-[13px] leading-relaxed">
                  <p className="font-black text-amber-600 text-[11px] uppercase tracking-tighter">Viewer Access</p>
                  <p className="text-slate-600 font-medium">Email: <span className="text-slate-900 font-bold">viewer@edtech.com</span></p>
                  <p className="text-slate-600 font-medium">Password: <span className="text-slate-900 font-bold">123456</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}