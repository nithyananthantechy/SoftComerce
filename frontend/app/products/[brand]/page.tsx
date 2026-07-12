"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import DemoRequestModal from "@/components/DemoRequestModal";

interface Product {
  name: string;
  tagline?: string;
  description: string;
  url: string;
  gradient: string;
  features: string[];
  details: {
    summary?: string;
    valueProp?: string;
    howItWorks?: string[];
    useCases?: string[];
    pricing?: { plan: string; price: string; desc: string }[];
    comparison?: { headers: string[]; rows: string[][] };
  };
}

const BRAND_DATA: Record<
  string,
  {
    title: string;
    description: string;
    logo: string;
    products: Product[];
  }
> = {
  nitehire: {
    title: "NiteHire Ecosystem",
    description: "AI-powered hiring platform designed to automate and streamline the recruitment process.",
    logo: "💼",
    products: [
      {
        name: "NiteHire AI Recruitment",
        tagline: "Reduce time-to-hire by up to 60% and save 8+ hours per hire.",
        description: "Automates the entire first-round interview process. Its AI conducts structured interviews, scores candidates objectively, and provides a ranked shortlist with full interview replays, enabling HR to hire smarter.",
        url: "https://nitehire.site",
        gradient: "from-blue-500/20 to-indigo-500/10",
        features: ["AI Interview Automation", "Smart Candidate Scoring", "HD Video/Audio Replay", "Kanban Pipeline", "Offer & Onboarding", "Analytics Dashboard"],
        details: {
          summary: "NiteHire is designed to automate and streamline the initial stages of recruitment for HR teams and provide a convenient job-seeking experience for candidates. The platform saves HR teams significant time by using AI to conduct, score, and rank first-round interviews, allowing them to focus only on the most qualified candidates.",
          valueProp: "Traditional hiring is slow and biased. NiteHire automates first-round interviews, providing an objective, standardized fit score for every candidate. Job Seekers can upload resumes with AI parsing and complete interviews at their convenience.",
          howItWorks: [
            "Post a Job: Create a job post in minutes with custom screening questions. The AI configures the interview flow.",
            "AI Interviews Candidates: Candidates take automated interviews anytime. The AI scores communication, skills, and role relevance.",
            "Review & Hire: HR receives a ranked shortlist with full replays, AI scores, and fit analysis to make final decisions."
          ],
          pricing: [
            { plan: "Job Seeker", price: "Free Forever", desc: "Browse roles, upload resumes with AI parsing, complete AI interviews, and get instant feedback." },
            { plan: "Starter Plan", price: "₹2,399/mo", desc: "For small teams. Includes 5 HR seats and 10 active job posts with a 30-day free trial." },
            { plan: "Growth Plan", price: "₹6,399/mo", desc: "For high-growth companies. Includes 20 HR seats, unlimited job posts, and offer management." },
            { plan: "Enterprise Plan", price: "Custom Pricing", desc: "For large organizations. Includes multi-org management, custom compliance, and advanced analytics." }
          ],
          comparison: {
            headers: ["Feature", "Traditional Hiring", "NiteHire AI"],
            rows: [
              ["First Round Interviews", "Manual scheduling & calling", "Automated, 24/7 availability"],
              ["Candidate Scoring", "Subjective & inconsistent", "Objective, standardized AI scoring"],
              ["Interview Recording", "Usually unrecorded", "Full HD video & audio replay"],
              ["Time Per Hire", "4-6 weeks average", "Under 2 weeks"],
              ["Scalability", "Limited by HR team size", "Screen thousands simultaneously"]
            ]
          }
        }
      }
    ]
  },
  nitechspark: {
    title: "NITECHSPARK Products",
    description: "AI-powered CRM, sales enablement, governance, and compliance-first security platforms.",
    logo: "⚡",
    products: [
      {
        name: "PropoTrack",
        tagline: "AI-Powered CRM & Proposal Platform",
        description: "A sales enablement platform designed to help teams manage clients, generate AI-powered proposals, and track deals through a visual pipeline.",
        url: "https://propotrack.nitechspark.site",
        gradient: "from-cyan-500/20 to-blue-500/10",
        features: ["AI Pitch Generation", "Pipeline Management", "CRM-Lite", "Follow-up Alerts", "Pipeline Analytics", "HubSpot & Salesforce Sync"],
        details: {
          summary: "PropoTrack utilizes Groq-powered Llama 3 to generate personalized outreach pitches and proposals in under 1 second. It resolves the 'blank page' problem for sales teams, organizing proposal lifecycles on a clean Kanban board linked to a contact-history database.",
          valueProp: "A complete unified sales workspace combining proposal automation with pipeline intelligence to help teams win more contracts."
        }
      },
      {
        name: "NiteSentinel",
        tagline: "AI-Powered Cybersecurity Assessment & Hardening",
        description: "Automated vulnerability scanner that maps compliance frameworks and provides plain-English remediation guidelines.",
        url: "https://sentinel.nitechsaprk.in/",
        gradient: "from-purple-500/20 to-violet-500/10",
        features: ["SSH Remote Scanning", "AI-Powered Vulnerability Analysis", "DPDP Act 2023 Compliance", "CTO-ready Executive Reports", "WhatsApp & Email Alerts", "White-Label MSP Portal"],
        details: {
          summary: "NiteSentinel scans multiple layers (Linux, Windows, Network, Web, Cloud, WSL, AI apps) without agents. It maps findings to major frameworks and is India's first affordable tool targeting compliance with the Digital Personal Data Protection (DPDP) Act 2023.",
          valueProp: "Enterprise-grade security scanning for startups, SMBs, and MSSPs at highly accessible price points.",
          pricing: [
            { plan: "Starter Plan", price: "₹8,000/mo", desc: "Up to 5 targets, PDF reports, email alerts, DPDP compliance, and 14-day free trial." },
            { plan: "Professional", price: "₹15,000/mo", desc: "Up to 25 targets, adds WhatsApp alerts and compliance mappings." },
            { plan: "Enterprise", price: "₹25,000/mo", desc: "Unlimited targets, white-label reports, MSP portal, API access, custom compliance mapping." }
          ]
        }
      },
      {
        name: "NexusAI",
        tagline: "Enterprise AI Governance & Control Plane",
        description: "A centralized control layer that enables organizations to govern how internal models and agents are utilized.",
        url: "https://nitechspark.site",
        gradient: "from-emerald-500/20 to-teal-500/10",
        features: ["AI Usage Monitoring", "Policy Enforcement", "Compliance Trail & Audit Log", "Role-Based Access Control", "Data Leakage Prevention"],
        details: {
          summary: "NexusAI provides a central governance layer for organizations deploying multiple LLMs, giving absolute visibility into data flows, token limits, and compliance. It integrates seamlessly with NiteSentinel to secure your organizational AI assets.",
          valueProp: "Stop shadow AI usage and protect proprietary data while empowering your workforce with authorized AI capabilities."
        }
      }
    ]
  },
  nskgroups: {
    title: "NSK Groups Solutions",
    description: "Enterprise ESG databases, unified IT monitoring stacks, and AI personal safety ecosystems.",
    logo: "🏢",
    products: [
      {
        name: "Sentriya",
        tagline: "AI-Powered Women & Child Safety Platform",
        description: "Personal safety network combining multi-method SOS triggers, distress voice detection, and parent monitoring dashboards.",
        url: "https://nitebuddy.nskgroups.website",
        gradient: "from-pink-500/20 to-rose-500/10",
        features: ["One-Tap & Shake SOS", "Distress Voice Recognition", "Silent SOS Trigger", "SMS Fallback Gateway", "Live GPS Journey Tracking", "Geofencing & Child Safety Dashboard"],
        details: {
          summary: "Sentriya (launched as NiteBuddy) utilizes AI threat detection to recognize panic indicators and voice alerts. It operates even without active internet connectivity using standard SMS gateways to dispatch real-time locations to emergency contacts.",
          valueProp: "A proactive safety ecosystem combining AI indicators and instant response metrics rather than standard reactive panic alarms."
        }
      },
      {
        name: "SustainHub",
        tagline: "AI Data Centre Sustainability & ESG Platform",
        description: "Specialized environmental performance monitor translating live facility metrics into actionable sustainability reports.",
        url: "https://sustainhub.nskgroups.website",
        gradient: "from-teal-500/20 to-emerald-500/10",
        features: ["Real-Time Resource Metrics", "PUE & Cooling Analytics", "AI Energy Optimization", "ESG Regulatory Reporting", "Carbon Footprint Tracking", "AI Community Engagement Dashboard"],
        details: {
          summary: "Unlike generic ESG software, SustainHub focuses on data center operations. It monitors power, water consumption, temperature, noise levels, and carbon footprints to generate compliance-ready regulatory reports.",
          valueProp: "Enabling colocation and cloud data centers to meet carbon neutral goals and maintain local community transparency."
        }
      },
      {
        name: "NiteOps",
        tagline: "Unified IT Operations Management",
        description: "All-in-one infrastructure monitoring, network Data Loss Prevention (DLP), and DPDP compliance suite.",
        url: "https://nskgroups.website",
        gradient: "from-blue-600/20 to-indigo-600/10",
        features: ["Real-time Server/App Telemetry", "Network DLP & PII Scans", "DPDP Act Compliance Dashboard", "Zabbix & Grafana Sync", "Python Telemetry Agent", "NexusAI Integration"],
        details: {
          summary: "NiteOps serves as a single pane of glass for enterprise infrastructure. In tandem with NexusAI, it uses active Python agents to capture host metrics while simultaneously scanning database and network flows for unauthorized data transfers.",
          valueProp: "Ditch multiple disjointed tools—monitor servers, secure network data, and maintain DPDP regulatory compliance inside one stack."
        }
      }
    ]
  }
};

export default function BrandProductsPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const resolvedParams = use(params);
  const brandKey = resolvedParams.brand.toLowerCase();
  const brand = BRAND_DATA[brandKey];

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");

  if (!brand) {
    notFound();
  }

  function openDemo(productName: string) {
    setSelectedProduct(productName);
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/products" className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <div>
              <h1 className="text-xl logo-text text-white leading-tight mt-1">
                Soft<span className="logo-text-gradient">comerce</span>
              </h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="text-sm font-medium text-slate-300 hover:text-brand-400 transition"
            >
              ← Back to Brands
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-slate-300 hover:text-brand-400 transition"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Brand Banner */}
        <div className="mb-12 flex items-center gap-4 fade-in-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-4xl">
            {brand.logo}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white font-display">{brand.title}</h2>
            <p className="text-slate-400 mt-1 max-w-2xl">{brand.description}</p>
          </div>
        </div>

        {/* Product Cards */}
        <div className="space-y-12 fade-in-up" style={{ animationDelay: "0.1s" }}>
          {brand.products.map((product) => (
            <div
              key={product.name}
              className="glass p-8 md:p-10 rounded-3xl relative overflow-hidden group border border-white/5 shadow-xl"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-300`}
              />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-brand-400 transition-colors">
                      {product.name}
                    </h3>
                    {product.tagline && (
                      <p className="text-brand-400 font-medium text-sm mt-1">
                        {product.tagline}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openDemo(product.name)}
                      className="btn-brand py-2 px-5 rounded-xl text-sm font-semibold"
                    >
                      Request Demo
                    </button>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 rounded-xl text-sm border border-white/10 text-white hover:bg-white/5 transition font-semibold"
                    >
                      Visit Product Website
                    </a>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-3 mt-8 pt-8 border-t border-white/5">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Product Overview
                      </h4>
                      <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                        {product.description}
                      </p>
                    </div>

                    {product.details.summary && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Executive Summary
                        </h4>
                        <p className="text-slate-400 leading-relaxed text-sm">
                          {product.details.summary}
                        </p>
                      </div>
                    )}

                    {product.details.howItWorks && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                          How It Works
                        </h4>
                        <ul className="space-y-3">
                          {product.details.howItWorks.map((step, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-slate-300">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold mt-0.5">
                                {idx + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {product.details.comparison && (
                      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-dark-950/40 mt-6">
                        <table className="w-full text-left text-xs md:text-sm">
                          <thead>
                            <tr className="border-b border-white/5 bg-dark-900/50">
                              {product.details.comparison.headers.map((h, i) => (
                                <th key={i} className="px-4 py-3 font-semibold text-slate-400">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {product.details.comparison.rows.map((row, i) => (
                              <tr key={i} className="hover:bg-white/2">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-4 py-3 text-slate-300">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        Key Features & Capabilities
                      </h4>
                      <ul className="space-y-2.5">
                        {product.features.map((feat) => (
                          <li key={feat} className="flex items-center gap-2.5 text-xs text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {product.details.pricing && (
                      <div className="rounded-2xl border border-white/5 bg-white/2 p-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                          Pricing Details
                        </h4>
                        <div className="space-y-4">
                          {product.details.pricing.map((p, idx) => (
                            <div key={idx} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                              <div className="flex justify-between items-baseline gap-2">
                                <span className="font-semibold text-white text-sm">{p.plan}</span>
                                <span className="text-brand-400 font-bold text-sm shrink-0">{p.price}</span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-1 leading-normal">{p.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-16 border-t border-white/5 py-8 text-center">
        <p className="text-sm text-slate-600">
          © {new Date().getFullYear()}{" "}
          <span className="text-brand-500">NITECHSPARK</span>. All rights reserved.
        </p>
      </footer>

      <DemoRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        productName={selectedProduct}
      />
    </div>
  );
}
