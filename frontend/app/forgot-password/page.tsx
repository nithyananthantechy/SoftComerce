"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { forgotPassword, resetPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [step, setStep] = useState<1 | 2>(1); // 1 = request email, 2 = verify and reset
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(3);

  // Auto-redirect after success
  useEffect(() => {
    if (status !== "success") return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, router]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await forgotPassword(email);
      setSuccessMsg(res.message || "A 6-digit verification code has been dispatched to your email address.");
      setStep(2);
      setStatus("idle");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not request code. Please try again.");
      setStatus("error");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      setStatus("error");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setStatus("error");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      await resetPassword({
        email,
        otp,
        new_password: newPassword
      });
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password. Check your code.");
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 hero-gradient">
      <div className="mb-8 flex flex-col items-center">
        <Logo className="h-12 w-12 mb-3" />
        <h1 className="text-3xl font-bold text-white logo-text">
          Soft<span className="logo-text-gradient">kart</span>
        </h1>
      </div>

      <div className="glass max-w-md w-full p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-500/10 blur-[60px] rounded-full pointer-events-none" />

        {status === "success" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful</h2>
            <p className="text-slate-400 text-sm mb-6">
              Your password has been securely updated.
            </p>
            <p className="text-brand-400 text-sm font-semibold mb-4 animate-pulse">
              Redirecting to login in {countdown} second{countdown !== 1 ? "s" : ""}...
            </p>
            <Link href="/login" className="text-sm font-semibold text-brand-400 hover:underline">
              Go to Login now →
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {step === 1 ? "Forgot Password" : "Reset Password"}
            </h2>
            <p className="text-slate-400 text-sm text-center mb-6">
              {step === 1 
                ? "Enter your email address and we'll send you a 6-digit OTP code to verify ownership."
                : `Enter the 6-digit code sent to ${email} along with your new password.`}
            </p>

            {errorMsg && (
              <div className="mb-5 text-red-400 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20 text-sm text-center">
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && step === 2 && (
              <div className="mb-5 text-green-400 bg-green-500/10 p-3.5 rounded-xl border border-green-500/20 text-sm text-center">
                ✉️ {successMsg}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-dark w-full"
                    placeholder="name@company.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full btn-brand py-3 rounded-xl font-bold transition shadow-lg shadow-brand-500/20 text-sm hover:scale-[1.01]"
                >
                  {status === "submitting" ? "Requesting..." : "Send Verification Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    maxLength={6}
                    pattern="\d{6}"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="input-dark w-full text-center tracking-[8px] font-mono text-xl"
                    placeholder="000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-dark w-full pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-dark w-full pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
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
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    ← Back to Email
                  </button>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="btn-brand py-3 px-6 rounded-xl font-bold transition shadow-lg shadow-brand-500/20 text-sm hover:scale-[1.01]"
                  >
                    {status === "submitting" ? "Verifying..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/login" className="text-sm text-slate-400 hover:text-white transition font-medium">
          Return to Log In
        </Link>
      </div>
    </div>
  );
}
