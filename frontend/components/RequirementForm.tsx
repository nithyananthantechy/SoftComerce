"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRequest, type StructuredRequirements } from "@/lib/api";
import { CATEGORY_LABELS, type Category } from "@/lib/types";

const FEATURE_OPTIONS = [
  "User authentication",
  "Admin dashboard",
  "Payment gateway",
  "Search functionality",
  "Email notifications",
  "Analytics & reporting",
  "API integrations",
  "Multi-language support",
];

interface Props {
  category: Category;
}

export default function RequirementForm({ category }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [description, setDescription] = useState("");
  const [budgetExpectation, setBudgetExpectation] = useState("");
  const [timelineExpectation, setTimelineExpectation] = useState("");
  const [mustHaveFeatures, setMustHaveFeatures] = useState<string[]>([]);
  const [mustHaveText, setMustHaveText] = useState("");
  const [aiRecommend, setAiRecommend] = useState(false);

  // Web
  const [pages, setPages] = useState(5);
  const [ecommerce, setEcommerce] = useState(false);
  const [cms, setCms] = useState(false);
  const [hosting, setHosting] = useState(false);
  const [domainSsl, setDomainSsl] = useState(false);

  // Mobile
  const [platforms, setPlatforms] = useState<string[]>(["both"]);
  const [backendNeeded, setBackendNeeded] = useState(false);
  const [pushNotif, setPushNotif] = useState(false);
  const [payment, setPayment] = useState(false);

  // Custom software
  const [integrations, setIntegrations] = useState("");
  const [automationAi, setAutomationAi] = useState(false);
  const [userCount, setUserCount] = useState("");
  const [dataStorage, setDataStorage] = useState("");

  function toggleFeature(f: string) {
    setMustHaveFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const structured: StructuredRequirements = {
      project_description: description,
      budget_expectation: budgetExpectation || undefined,
      timeline_expectation: timelineExpectation || undefined,
      must_have_features: mustHaveFeatures,
      must_have_features_text: mustHaveText 
        ? (aiRecommend ? `[User is non-technical and requested AI to recommend all technical features] ${mustHaveText}` : mustHaveText)
        : (aiRecommend ? `[User is non-technical and requested AI to recommend all technical features]` : undefined),
    };

    if (category === "web") {
      structured.web = {
        number_of_pages: pages,
        ecommerce_needed: ecommerce,
        cms_needed: cms,
        hosting_needed: hosting,
        domain_ssl_needed: domainSsl,
      };
    } else if (category === "mobile") {
      structured.mobile = {
        platforms,
        backend_needed: backendNeeded,
        push_notifications: pushNotif,
        payment_integration: payment,
      };
    } else {
      structured.custom_software = {
        integrations: integrations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        automation_ai_features: automationAi,
        expected_user_count: userCount || undefined,
        data_storage_needs: dataStorage || undefined,
      };
    }

    try {
      const req = await createRequest({
        category,
        requirements_raw: description,
        requirements_structured: structured,
      });
      router.push(`/proposal/${req.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 mb-6 flex items-start gap-3">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-brand-100">
          <strong className="text-white block mb-1">Exclusive Service Notice</strong>
          Custom software, app, and web development proposals and execution are exclusively handled by 
          <span className="font-semibold text-brand-400"> NITECHSPARK</span>.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Project Requirements */}
      <Section title="Project Requirements" icon="📋">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Project Description <span className="text-brand-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-dark resize-none"
              placeholder="Describe your project goals, target users, and key functionality..."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Budget Expectation"
              value={budgetExpectation}
              onChange={setBudgetExpectation}
              placeholder="e.g. ₹50,000 – ₹1,00,000"
            />
            <Field
              label="Timeline Expectation"
              value={timelineExpectation}
              onChange={setTimelineExpectation}
              placeholder="e.g. 6-8 weeks"
            />
          </div>
          
          <div className="mt-4 rounded-xl border border-brand-500/30 bg-brand-500/10 p-4">
            <DarkCheckbox 
              label="I'm not sure about technical details — let AI recommend the best features and tech stack for my project." 
              checked={aiRecommend} 
              onChange={setAiRecommend} 
            />
          </div>
        </div>
      </Section>

      {/* Must-Have Features */}
      {!aiRecommend && (
        <Section title="Must-Have Features" icon="✅">
          <div className="mb-4 flex flex-wrap gap-2">
            {FEATURE_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                className={mustHaveFeatures.includes(f) ? "tag-active" : "tag-inactive"}
              >
                {f}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={mustHaveText}
            onChange={(e) => setMustHaveText(e.target.value)}
            className="input-dark resize-none"
            placeholder="Any additional must-have features not listed above..."
          />
        </Section>
      )}

      {/* Web Specific */}
      {category === "web" && !aiRecommend && (
        <Section title="Web-Specific Details" icon="🌐">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Number of Pages</label>
              <input
                type="number"
                min={1}
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="input-dark"
              />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <DarkCheckbox label="E-commerce module needed" checked={ecommerce} onChange={setEcommerce} />
              <DarkCheckbox label="CMS integration needed" checked={cms} onChange={setCms} />
              <DarkCheckbox label="Hosting setup needed" checked={hosting} onChange={setHosting} />
              <DarkCheckbox label="Domain & SSL setup" checked={domainSsl} onChange={setDomainSsl} />
            </div>
          </div>
        </Section>
      )}

      {/* Mobile Specific */}
      {category === "mobile" && !aiRecommend && (
        <Section title="Mobile-Specific Details" icon="📱">
          <div className="mb-4">
            <p className="mb-3 text-sm font-medium text-slate-300">Target Platforms</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "ios", label: "iOS" },
                { value: "android", label: "Android" },
                { value: "both", label: "Both (Cross-platform)" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePlatform(p.value)}
                  className={platforms.includes(p.value) ? "tag-active" : "tag-inactive"}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DarkCheckbox label="Backend API needed" checked={backendNeeded} onChange={setBackendNeeded} />
            <DarkCheckbox label="Push notifications" checked={pushNotif} onChange={setPushNotif} />
            <DarkCheckbox label="Payment integration" checked={payment} onChange={setPayment} />
          </div>
        </Section>
      )}

      {/* Custom Software Specific */}
      {category === "custom_software" && !aiRecommend && (
        <Section title="Custom Software Details" icon="⚙️">
          <div className="space-y-4">
            <Field
              label="Integrations needed (comma-separated)"
              value={integrations}
              onChange={setIntegrations}
              placeholder="e.g. Salesforce, Stripe, Google Sheets"
            />
            <DarkCheckbox label="Automation / AI features needed" checked={automationAi} onChange={setAutomationAi} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Expected user count" value={userCount} onChange={setUserCount} placeholder="e.g. 50-100" />
              <Field label="Data storage needs" value={dataStorage} onChange={setDataStorage} placeholder="e.g. 10GB" />
            </div>
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/" className="text-sm text-slate-500 transition hover:text-brand-400">
          ← Back
        </Link>
        <button
          type="submit"
          disabled={loading}
          id="submit-proposal-btn"
          className="btn-brand flex items-center gap-2 px-8 py-3 text-sm"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating proposal...
            </>
          ) : (
            <>
              Generate Proposal
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="glass p-6">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-white">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-dark"
      />
    </div>
  );
}

function DarkCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="checkbox-dark"
      />
      {label}
    </label>
  );
}
