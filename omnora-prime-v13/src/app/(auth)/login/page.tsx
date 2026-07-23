"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, WifiOff, RefreshCw } from "lucide-react";
import { humanizeError } from "@/lib/utils/errors";

function isNetworkError(err: any): boolean {
  const msg: string = err?.message || String(err);
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("net::ERR") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("fetch failed") ||
    msg.includes("Offline") ||
    msg.includes("Load failed")
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineError, setIsOfflineError] = useState(false);
  const [hasCachedSession, setHasCachedSession] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Check if a cached session exists so we can offer offline login
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage);
      const sessionKey = keys.find(k => k.includes("supabase") && k.includes("session"));
      if (sessionKey) {
        const raw = localStorage.getItem(sessionKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.access_token || parsed?.session?.access_token) {
            setHasCachedSession(true);
          }
        }
      }
    } catch {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsOfflineError(false);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      router.push("/");
    } catch (err: any) {
      if (isNetworkError(err)) {
        setIsOfflineError(true);
        setError(
          "Cannot reach the authentication server. Check your internet connection — or continue using the cached session if you've logged in before."
        );
      } else {
        setError(humanizeError(err, "login"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Attempt to restore an existing cached session without re-authenticating
  const handleContinueOffline = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        router.push("/");
      } else {
        setError("No valid cached session found. Please connect to the internet and log in once first.");
        setIsOfflineError(false);
      }
    } catch {
      setError("Could not restore session. Please connect to the internet.");
    } finally {
      setIsLoading(false);
    }
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

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 border text-[11px] font-medium ${
                    isOfflineError
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-critical-red/10 border-critical-red/20 text-critical-red animate-shake"
                  }`}
                >
                  {isOfflineError && <WifiOff className="inline w-3 h-3 mr-1.5 mb-0.5" />}
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-electric-blue hover:bg-blue-600 text-white font-bold transition-all flex items-center justify-center group disabled:opacity-60"
            >
              {isLoading ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Authenticating...</>
              ) : (
                <>Establish Secure Session <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Offline cached-session recovery */}
          {isOfflineError && hasCachedSession && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <button
                onClick={handleContinueOffline}
                disabled={isLoading}
                className="w-full py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[12px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <WifiOff className="w-3.5 h-3.5" />
                Continue with Cached Session (Offline)
              </button>
              <p className="text-[9px] text-gray-600 text-center mt-1.5">
                Uses your last authenticated session. Data will sync when back online.
              </p>
            </motion.div>
          )}

          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-center text-[11px] text-gray-500 mb-4">
              Authorized Personnel Only. All access is audited.
            </p>
            <Link
              href="/signup"
              className="block w-full py-3 bg-white/5 border border-white/10 text-center text-[11px] text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Create New Hub Account
            </Link>
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
