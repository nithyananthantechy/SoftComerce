"use client";

import { useState } from "react";
import { requestDemo } from "@/lib/api";

export default function DemoRequestModal({
  isOpen,
  onClose,
  productName,
}: {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestDemo({
        name,
        email,
        contact,
        product_name: productName,
        meeting_time: meetingTime,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit demo request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass w-full max-w-md p-8 relative rounded-2xl border border-white/10 shadow-2xl animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition text-xl"
        >
          &times;
        </button>

        {!success ? (
          <>
            <h3 className="text-2xl font-bold text-white mb-2">Request Live Demo</h3>
            <p className="text-sm text-slate-400 mb-6">
              Schedule a personalized meeting for <span className="text-brand-400 font-semibold">{productName}</span>.
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="input-dark py-2 px-3 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  className="input-dark py-2 px-3 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  className="input-dark py-2 px-3 text-sm"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Schedule Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input-dark py-2 px-3 text-sm text-white"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-brand py-2.5 px-4 rounded-xl text-sm font-semibold mt-4 transition hover:shadow-glow disabled:opacity-50"
              >
                {loading ? "Scheduling..." : "Schedule Meeting"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <span className="text-5xl mb-4 block">📅</span>
            <h3 className="text-2xl font-bold text-white mb-2">Request Submitted!</h3>
            <p className="text-slate-400 text-sm mb-6">
              Thank you for scheduling a demo. We have sent a confirmation email, and our founder will connect with you at your chosen time.
            </p>
            <button
              onClick={onClose}
              className="btn-brand py-2 px-6 rounded-xl text-sm font-semibold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
