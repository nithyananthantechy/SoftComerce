"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientAuth } from "@/context/ClientAuthContext";
import { clientLogin } from "@/lib/api";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshClient } = useClientAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await clientLogin(email, password);
      await refreshClient();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex hero-gradient">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col px-8 md:px-16 lg:px-24 xl:px-32 relative z-10 py-12 min-h-screen">
        {/* Top Link Spacer */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium text-slate-400 group-hover:text-brand-400 transition">Back to home</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto fade-in-up my-auto">
          <div className="mb-10 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <Logo className="h-10 w-10 drop-shadow-2xl" />
              <h1 className="text-2xl logo-text text-white leading-tight mt-1">
                Soft<span className="logo-text-gradient">kart</span>
              </h1>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 font-display">Welcome Back</h1>
            <p className="text-slate-400 text-lg">Log in to view your requests and manage software solutions.</p>
          </div>

          <div className="glass p-8 md:p-10 rounded-3xl relative border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-50 rounded-3xl pointer-events-none" />
            
            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-inner"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2 flex justify-between">
                  <span>Password</span>
                  <Link href="/forgot-password" className="text-brand-400 hover:text-brand-300 font-normal text-xs transition">Forgot password?</Link>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-inner"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-brand py-3.5 rounded-xl mt-4 font-semibold text-base shadow-lg shadow-brand-500/25 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-slate-400 mt-8 text-sm relative z-10">
              Don't have an account? <Link href="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition ml-1">Create one now</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Visuals (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-dark-900 border-l border-white/5 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/40 via-brand-500/10 to-transparent" />
        
        {/* Decorative elements */}
        <div className="relative z-10 max-w-lg p-12 glass rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl transform translate-x-12 translate-y-12 rotate-3 hover:rotate-0 transition-transform duration-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Fast-Track Your Vision</h3>
              <p className="text-brand-300 text-sm">Custom AI & Software Solutions</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-2 bg-white/10 rounded-full w-3/4" />
            <div className="h-2 bg-white/10 rounded-full w-full" />
            <div className="h-2 bg-white/10 rounded-full w-5/6" />
            <div className="flex gap-2 pt-4">
              <div className="h-8 w-24 bg-brand-500/20 rounded-lg border border-brand-500/30" />
              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10" />
            </div>
          </div>
        </div>
        
        {/* Abstract glowing orbs */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-500/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
