"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use } from "react";
import RequirementForm from "@/components/RequirementForm";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import { useClientAuth } from "@/context/ClientAuthContext";
import { useEffect } from "react";

const VALID: Category[] = ["web", "mobile", "custom_software"];

const CATEGORY_ICONS: Record<Category, string> = {
  web: "🌐",
  mobile: "📱",
  custom_software: "⚙️",
};

export default function SubmitPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = use(params);
  const { client, isLoading } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !client) {
      router.push("/login");
    }
  }, [client, isLoading, router]);

  if (!VALID.includes(category as Category)) {
    notFound();
  }

  const cat = category as Category;

  if (isLoading || !client) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-brand-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-brand-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-sm">
                {CATEGORY_ICONS[cat]}
              </div>
              <div>
                <p className="text-[12px] font-bold logo-text text-white leading-none mt-1">
                  Soft<span className="logo-text-gradient">kart</span>
                </p>
                <p className="text-sm font-semibold text-white leading-tight">
                  {CATEGORY_LABELS[cat]}
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Logged in as <span className="text-white font-medium">{client.name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Page title */}
        <div className="mb-8 fade-in-up">
          <h1 className="font-display text-3xl font-bold text-white">
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </h1>
          <p className="mt-2 text-slate-500">
            Fill in your requirements below — our AI will generate a scoped proposal with budget range instantly.
          </p>
          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold">1</span>
            <span className="text-brand-400 font-medium">Fill requirements</span>
            <span className="h-px w-8 bg-white/10" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[10px]">2</span>
            <span>AI generates proposal</span>
            <span className="h-px w-8 bg-white/10" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[10px]">3</span>
            <span>Review & confirm</span>
          </div>
        </div>

        <RequirementForm category={cat} />
      </main>
    </div>
  );
}
