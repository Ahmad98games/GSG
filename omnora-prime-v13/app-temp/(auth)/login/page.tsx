"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("admin@noxis.app");
    setPassword("noxis2026");
  };

  return (
    <div className="min-h-screen bg-onyx flex items-center justify-center p-6 font-inter">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-electric-blue/10 rounded-sm flex items-center justify-center mx-auto mb-6 border border-electric-blue/20">
            <ShieldCheck className="w-8 h-8 text-electric-blue" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">NOXIS</h1>
          <p className="text-gray-500 uppercase tracking-[0.2em] text-[10px] font-bold">Secure Industrial Gateway</p>
        </div>

        <div className="bg-surface p-8 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-electric-blue opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-medium">Terminal ID / Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="industrial-input pl-10"
                  placeholder="yourname123@gmail.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-medium">Access Key / Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="industrial-input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-critical-red/10 border border-critical-red/20 text-critical-red text-[11px] font-medium animate-shake">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-electric-blue hover:bg-blue-600 text-white font-bold transition-all flex items-center justify-center group"
            >
              {isLoading ? "Authenticating..." : "Establish Secure Session"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-center text-[11px] text-gray-500 mb-4">
              Authorized Personnel Only. All access is audited.
            </p>
            <div className="space-y-3">
              <Link 
                href="/signup"
                className="block w-full py-3 bg-white/5 border border-white/10 text-center text-[11px] text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Create New Hub Account
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .industrial-input {
          width: 100%;
          background: #121417;
          border: 1px solid #2D3139;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          border-radius: 2px;
        }
        .industrial-input:focus {
          border-color: #60A5FA;
          box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.2);
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
}

