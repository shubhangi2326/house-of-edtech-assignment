"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.ok) router.push("/");
    else alert("Invalid Credentials");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">House of EdTech</h1>
          <p className="text-slate-500 text-sm font-medium">Collaborative Engine Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all" required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-200">
            Sign In to Editor
          </button>
        </form>

        <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 text-center">Test Credentials (RBAC)</p>
          <div className="grid grid-cols-1 gap-2 text-[10px] font-bold text-slate-600">
            <div className="flex justify-between"><span>Owner:</span> <span>owner@edtech.com / 123456</span></div>
            <div className="flex justify-between"><span>Editor:</span> <span>editor@edtech.com / 123456</span></div>
            <div className="flex justify-between"><span>Viewer:</span> <span>viewer@edtech.com / 123456</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}