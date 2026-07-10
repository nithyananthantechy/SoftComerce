import Link from "next/link";
import Logo from "@/components/Logo";

const PRODUCTS = [
  {
    name: "NITECHSPARK",
    description: "Our flagship technology consulting and custom software development services. We build scalable, modern applications tailored to your business needs.",
    features: ["Custom Software", "AI Automation", "Web & Mobile"],
    url: "#",
    gradient: "from-blue-500/20 to-cyan-500/10",
  },
  {
    name: "NSK Groups",
    description: "Enterprise resource planning and business management solutions designed to streamline your operations and boost productivity.",
    features: ["ERP Solutions", "Business Management", "Data Analytics"],
    url: "#",
    gradient: "from-brand-500/20 to-brand-700/10",
  },
  {
    name: "NiteHire",
    description: "Intelligent recruitment and applicant tracking system. Find the right talent faster with our AI-driven hiring platform.",
    features: ["Applicant Tracking", "AI Screening", "Interview Management"],
    url: "#",
    gradient: "from-violet-500/20 to-purple-500/10",
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <div>
              <h1 className="text-xl logo-text text-white leading-tight mt-1">
                Soft<span className="logo-text-gradient">comerce</span>
              </h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-300 hover:text-brand-400 transition"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-16 text-center fade-in-up">
          <h2 className="text-4xl font-bold text-white md:text-5xl mb-4">
            Our <span className="gradient-text">Products & Services</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Explore our ecosystem of enterprise solutions. Request a demo or learn more about how we can accelerate your business.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 fade-in-up" style={{ animationDelay: "0.1s" }}>
          {PRODUCTS.map((product) => (
            <div key={product.name} className="glass p-8 rounded-2xl relative overflow-hidden group flex flex-col h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors">
                  {product.name}
                </h3>
                <p className="text-slate-400 leading-relaxed mb-6 flex-grow">
                  {product.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.features.map((feature) => (
                    <span key={feature} className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-300 border border-white/10 group-hover:border-brand-500/30">
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3 mt-auto">
                  <a href={product.url} className="btn-primary py-2 px-4 rounded-lg text-sm flex-1 text-center">
                    Request Demo
                  </a>
                  <a href={product.url} className="px-4 py-2 rounded-lg text-sm border border-white/10 text-white hover:bg-white/5 transition flex-1 text-center">
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-20 glass p-10 rounded-2xl text-center fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-2xl font-bold text-white mb-3">Looking for custom development?</h3>
          <p className="text-slate-400 mb-6">Use Softcomerce to generate an instant proposal and budget estimate for your unique project.</p>
          <Link href="/" className="btn-primary py-3 px-8 rounded-lg inline-block font-medium">
            Generate AI Proposal
          </Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-white/5 py-8 text-center">
        <p className="text-sm text-slate-600">
          © {new Date().getFullYear()}{" "}
          <span className="text-brand-500">NITECHSPARK</span>. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
