"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Lock, Mail, ArrowRight, ShieldCheck, WifiOff, RefreshCw, Info } from "lucide-react";
import Link from "next/link";
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

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineError, setIsOfflineError] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsOfflineError(false);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signupError) throw signupError;

      if (data?.user?.identities?.length === 0) {
        setError("This email is already registered. Please login instead.");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      if (isNetworkError(err)) {
        setIsOfflineError(true);
        setError(
          "Account creation requires an internet connection to register your Hub with the Noxis cloud. Please connect and try again."
        );
      } else {
        setError(humanizeError(err, "register account"));
      }
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
            <UserPlus className="w-8 h-8 text-electric-blue" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create Hub Account</h1>
          <p className="text-gray-500 uppercase tracking-[0.2em] text-[10px] font-bold">New Industrial Node Registration</p>
        </div>

        {/* Offline first notice */}
        <div className="mb-4 p-3 bg-[#0F1114] border border-white/[0.06] flex items-start gap-2.5">
          <Info className="w-3.5 h-3.5 text-[#60A5FA] flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-500 leading-relaxed">
            <strong className="text-gray-400">First-time setup only.</strong> Internet is required to create your account. After your first login, Noxis Hub works fully offline.
          </p>
        </div>

        <div className="bg-surface p-8 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald opacity-50 group-hover:opacity-100 transition-opacity" />

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-medium">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="industrial-input pl-10"
                  placeholder="admin@yourfactory.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-medium">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="industrial-input pl-10"
                  placeholder="Min. 8 characters"
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
                      : "bg-critical-red/10 border-critical-red/20 text-critical-red"
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
              className="w-full py-4 bg-emerald hover:bg-emerald-600 text-white font-bold transition-all flex items-center justify-center group disabled:opacity-60"
            >
              {isLoading ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Preparing...</>
              ) : (
                <>Set your Hub Profile <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-[11px] text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-electric-blue hover:underline font-bold">
                Login here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-6 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
           <div className="flex items-center space-x-2">
              <ShieldCheck size={12} />
              <span>TLS 1.3 Secure</span>
           </div>
           <span>|</span>
           <span>AES-256 Encrypted</span>
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
      `}</style>
    </div>
  );
}
