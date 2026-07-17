"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClientAuth } from "@/context/ClientAuthContext";
import Logo from "@/components/Logo";
import { 
  updateProfile, 
  requestPasswordChange, 
  verifyPasswordChange, 
  requestEmailChange, 
  verifyEmailChange 
} from "@/lib/api";

export default function ProfilePage() {
  const { client, logout, isLoading: isAuthLoading, refreshClient } = useClientAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    router.push("/login");
  };

  // Profile fields state
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [profileError, setProfileError] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "success" | "error" | "sending" | "sent" | "verifying">("idle");
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStep, setPasswordStep] = useState<1 | 2>(1); // 1 = details, 2 = OTP confirmation
  const [passwordOtp, setPasswordOtp] = useState("");
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");

  // Email update state
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState<1 | 2>(1); // 1 = request, 2 = verify
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "verifying" | "success" | "error">("idle");
  const [emailError, setEmailError] = useState("");
  const [emailSuccessMsg, setEmailSuccessMsg] = useState("");

  useEffect(() => {
    if (!isAuthLoading) {
      if (!client) {
        router.push("/login");
      } else {
        setName(client.name || "");
        setCompany(client.company || "");
        setPhone(client.phone || "");
      }
    }
  }, [client, isAuthLoading, router]);

  if (isAuthLoading || !client) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 hero-gradient">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus("saving");
    setProfileError("");
    try {
      await updateProfile({ name, company, phone });
      setProfileStatus("success");
      await refreshClient();
      setTimeout(() => setProfileStatus("idle"), 3000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile details.");
      setProfileStatus("error");
    }
  };

  const handleRequestPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordStatus("error");
      return;
    }
    setPasswordStatus("sending");
    setPasswordError("");
    try {
      const res = await requestPasswordChange({ current_password: currentPassword, new_password: newPassword });
      setPasswordSuccessMsg(res.message || "A verification OTP has been dispatched to your email.");
      setPasswordStep(2);
      setPasswordStatus("sent");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to initiate password change.");
      setPasswordStatus("error");
    }
  };

  const handleVerifyPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus("verifying");
    setPasswordError("");
    try {
      await verifyPasswordChange({ 
        current_password: currentPassword, 
        new_password: newPassword, 
        otp: passwordOtp 
      });
      setPasswordStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOtp("");
      setPasswordStep(1);
      setTimeout(() => setPasswordStatus("idle"), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Invalid or expired verification code.");
      setPasswordStatus("error");
    }
  };

  const handleRequestEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === client.email) {
      setEmailError("Please enter a new email address.");
      setEmailStatus("error");
      return;
    }
    setEmailStatus("sending");
    setEmailError("");
    try {
      const res = await requestEmailChange(newEmail);
      setEmailSuccessMsg(res.message || "Verification code sent to the new email.");
      setEmailStep(2);
      setEmailStatus("sent");
    } catch (err: any) {
      setEmailError(err.message || "Failed to send email verification OTP.");
      setEmailStatus("error");
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus("verifying");
    setEmailError("");
    try {
      await verifyEmailChange(emailOtp);
      setEmailStatus("success");
      setNewEmail("");
      setEmailOtp("");
      setEmailStep(1);
      await refreshClient();
      setTimeout(() => setEmailStatus("idle"), 3000);
    } catch (err: any) {
      setEmailError(err.message || "Invalid or expired verification code.");
      setEmailStatus("error");
    }
  };

  return (
    <div className="min-h-screen hero-gradient pb-20">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <h1 className="text-xl logo-text text-white leading-tight mt-1">
              Soft<span className="logo-text-gradient">kart</span>
            </h1>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-slate-300 hover:text-white transition font-medium px-2">Home</Link>
            
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition group text-left"
              >
                <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shadow shadow-brand-500/30">
                  {client.name ? client.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-brand-400 leading-tight transition">{client.name}</span>
                  <span className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
                    {client.is_admin ? "Admin" : client.is_seller ? "Seller" : "Client"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-white transition ml-1">▼</span>
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-dark-900/95 backdrop-blur-md p-2 shadow-2xl z-50">
                    <Link 
                      href={client.is_admin ? "/admin" : "/profile"} 
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
                    >
                      {client.is_admin ? "💼 Admin Panel" : "⚙️ Profile Settings"}
                    </Link>
                    <div className="h-px bg-white/5 my-1" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-sm text-left font-medium"
                    >
                      🚪 Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <Link href={client.is_admin ? "/admin" : "/dashboard"} className="rounded-full border border-brand-500/50 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400 transition hover:bg-brand-500/20 active:scale-[0.98]">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Account Profile</h2>
            <p className="text-slate-400 text-sm">Manage your profile metadata, login credentials, and verified email settings.</p>
          </div>
          <div>
            <span className="bg-brand-500/10 text-brand-400 px-4 py-1.5 rounded-full text-xs font-mono font-bold border border-brand-500/20">
              {client.is_seller ? "🏪 Seller Profile" : "👤 Client Profile"}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Summary & Logout */}
          <div className="md:col-span-1 space-y-6">
            <div className="glass p-6 rounded-3xl border border-white/10 text-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-brand-500/10 blur-[40px] rounded-full pointer-events-none" />
              <div className="w-20 h-20 bg-brand-gradient rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-lg shadow-brand-500/20">
                {client.name ? client.name.charAt(0).toUpperCase() : "U"}
              </div>
              <h3 className="text-lg font-bold text-white">{client.name}</h3>
              <p className="text-xs text-slate-400 font-mono mb-2">{client.email}</p>
              
              <div className="h-px bg-white/5 my-4" />
              
              <div className="space-y-2.5 text-left text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Company:</span>
                  <span className="text-slate-300 font-medium">{client.company || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-300 font-medium">{client.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Joined:</span>
                  <span className="text-slate-300 font-medium">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>


          </div>

          {/* Right Column: Edit Options */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Edit details card */}
            <div className="glass p-6 rounded-3xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>👤</span> Profile Details
              </h3>
              
              {profileStatus === "success" && (
                <div className="mb-4 text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-sm">
                  ✓ Profile details updated successfully.
                </div>
              )}
              {profileError && (
                <div className="mb-4 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm">
                  ⚠️ {profileError}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">FULL NAME</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="input-dark w-full text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">COMPANY NAME</label>
                    <input 
                      type="text" 
                      value={company} 
                      onChange={(e) => setCompany(e.target.value)} 
                      className="input-dark w-full text-sm" 
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PHONE NUMBER</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="input-dark w-full text-sm" 
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={profileStatus === "saving"}
                    className="btn-brand px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20"
                  >
                    {profileStatus === "saving" ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </form>
            </div>

            {/* Email OTP Verification Update Card */}
            <div className="glass p-6 rounded-3xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <span>✉️</span> Verified Email Address
              </h3>
              <p className="text-slate-400 text-xs mb-5">Updating your registered email address requires validation via a 6-digit OTP code.</p>

              {emailStatus === "success" && (
                <div className="mb-4 text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-sm">
                  ✓ Email address updated successfully.
                </div>
              )}
              {emailError && (
                <div className="mb-4 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm">
                  ⚠️ {emailError}
                </div>
              )}
              {emailSuccessMsg && emailStep === 2 && (
                <div className="mb-4 text-brand-400 bg-brand-500/10 border border-brand-500/20 p-3 rounded-xl text-sm">
                  ✉️ {emailSuccessMsg}
                </div>
              )}

              <div className="bg-white/3 border border-white/5 rounded-2xl p-4 mb-5">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">CURRENT REGISTERED EMAIL</span>
                <span className="text-white font-mono text-sm">{client.email}</span>
              </div>

              {emailStep === 1 ? (
                <form onSubmit={handleRequestEmailOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">NEW EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      required 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      placeholder="enter.new@email.com"
                      className="input-dark w-full text-sm" 
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      disabled={emailStatus === "sending"}
                      className="btn-brand px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20"
                    >
                      {emailStatus === "sending" ? "Sending Code..." : "Send Verification OTP"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">ENTER 6-DIGIT VERIFICATION CODE</label>
                    <input 
                      type="text" 
                      required 
                      maxLength={6}
                      value={emailOtp} 
                      onChange={(e) => setEmailOtp(e.target.value)} 
                      placeholder="000000"
                      className="input-dark w-full text-center tracking-[8px] font-mono text-lg font-bold" 
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setEmailStep(1); setEmailStatus("idle"); }}
                      className="text-xs text-slate-400 hover:text-white transition"
                    >
                      ← Back to Change Email
                    </button>
                    <button 
                      type="submit" 
                      disabled={emailStatus === "verifying"}
                      className="btn-brand px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20"
                    >
                      {emailStatus === "verifying" ? "Verifying..." : "Verify & Save Email"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Change password card */}
            <div className="glass p-6 rounded-3xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>🔐</span> Change Password
              </h3>

              {passwordStatus === "success" && (
                <div className="mb-4 text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-sm">
                  ✓ Password changed successfully.
                </div>
              )}
              {passwordError && (
                <div className="mb-4 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm">
                  ⚠️ {passwordError}
                </div>
              )}

              {passwordSuccessMsg && passwordStep === 2 && (
                <div className="mb-4 text-brand-400 bg-brand-500/10 border border-brand-500/20 p-3 rounded-xl text-sm">
                  ✉️ {passwordSuccessMsg}
                </div>
              )}

              {passwordStep === 1 ? (
                <form onSubmit={handleRequestPasswordOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">CURRENT PASSWORD</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        required 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        className="input-dark w-full text-sm pr-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition"
                      >
                        {showCurrentPassword ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">NEW PASSWORD</label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          required 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          className="input-dark w-full text-sm pr-10" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition"
                        >
                          {showNewPassword ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">CONFIRM NEW PASSWORD</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          required 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          className="input-dark w-full text-sm pr-10" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition"
                        >
                          {showConfirmPassword ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      disabled={passwordStatus === "sending"}
                      className="btn-brand px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20"
                    >
                      {passwordStatus === "sending" ? "Sending Code..." : "Change Password"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyPasswordOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">ENTER 6-DIGIT VERIFICATION CODE</label>
                    <input 
                      type="text" 
                      required 
                      maxLength={6}
                      value={passwordOtp} 
                      onChange={(e) => setPasswordOtp(e.target.value)} 
                      placeholder="000000"
                      className="input-dark w-full text-center tracking-[8px] font-mono text-lg font-bold" 
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setPasswordStep(1); setPasswordStatus("idle"); }}
                      className="text-xs text-slate-400 hover:text-white transition"
                    >
                      ← Back to Change Password
                    </button>
                    <button 
                      type="submit" 
                      disabled={passwordStatus === "verifying"}
                      className="btn-brand px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20"
                    >
                      {passwordStatus === "verifying" ? "Verifying..." : "Verify & Save Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
