"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useClientAuth } from "@/context/ClientAuthContext";
import { getPublicProducts, requestMarketplaceDemo } from "@/lib/api";


export default function MarketplacePage() {
  const { client, logout } = useClientAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    router.push("/login");
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "https://www.w3schools.com/html/mov_bbb.mp4";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let vidId = "";
      if (url.includes("v=")) {
        vidId = url.split("v=")[1]?.split("&")[0];
      } else {
        vidId = url.split("/").pop() || "";
      }
      return `https://www.youtube.com/embed/${vidId}`;
    }
    if (url.includes("vimeo.com")) {
      const vidId = url.split("/").pop();
      return `https://player.vimeo.com/video/${vidId}`;
    }
    return url;
  };

  const handlePlayVideo = (url: string) => {
    if (!url) {
      alert("No custom demo video was uploaded by the seller. Loading default platform walkthrough instead.");
      setActiveVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
    } else {
      setActiveVideoUrl(getEmbedUrl(url));
    }
    setShowVideoModal(true);
  };

  const handleRequestDemo = async (product: any) => {
    if (!client) {
      alert("Please log in first to request a product demo.");
      router.push("/login");
      return;
    }
    try {
      if (product.id.startsWith("db-")) {
        const dbId = parseInt(product.id.replace("db-", ""));
        await requestMarketplaceDemo(dbId);
      }
      alert(`Demo request sent successfully! The seller of "${product.name}" has been notified.`);
    } catch (err: any) {
      alert(err.message || "Failed to submit demo request");
    }
  };

  useEffect(() => {
    getPublicProducts()
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => {
        console.error("Failed to load marketplace products:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const EMOJIS = ["📊", "🎨", "🔒", "⚙️", "🚀", "⚡", "🤖", "📈", "💻", "🛡️"];

  const formattedRealProducts = products.map((p) => {
    let formattedPrice = "Custom Pricing";
    if (p.price) {
      const sym = p.currency === "USD" ? "$" : p.currency === "INR" ? "₹" : p.currency + " ";
      const model = p.pricing_model === "per_month" ? "/mo" :
                    p.pricing_model === "per_year" ? "/yr" :
                    p.pricing_model === "one_time" ? " one-time" :
                    p.pricing_model === "per_user" ? "/user" : "";
      formattedPrice = `${sym}${p.price}${model}`;
    }

    return {
      id: `db-${p.id}`,
      vendor: p.vendor?.name || "Independent Seller",
      name: p.name,
      tagline: p.tagline || p.description || "",
      price: formattedPrice,
      icon: EMOJIS[p.id % EMOJIS.length],
      features: p.features || [],
      demo_video_url: p.demo_video_url || ""
    };
  });

  const displayProducts = formattedRealProducts;

  return (
    <div className="min-h-screen hero-gradient pb-20">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <div>
              <h1 className="text-xl logo-text text-white leading-tight mt-1">
                Soft<span className="logo-text-gradient">kart</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-brand-400 transition mr-2">
              Home
            </Link>
            
            {client ? (
              <div className="flex items-center gap-3">
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
            ) : (
              <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition px-2">
                Log In
              </Link>
            )}
            
            <Link href="/vendor/add-product" className="rounded-full bg-orange-500/10 border border-orange-500/30 px-4 py-1.5 text-xs font-medium text-orange-400 transition hover:bg-orange-500/20 flex items-center gap-1.5 active:scale-[0.98]">
              <span>🏬</span> Sell your Product
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-16 text-center fade-in-up">
          <div className="inline-block rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-6 text-sm text-slate-300">
            Powered by Softkart Partners
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-6">
            Third-Party <span className="text-brand-400">Marketplace</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Discover top-tier software, templates, and applications built by independent developers and partner companies. Easily purchase and integrate them into your workflow.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
            {displayProducts.map((product) => (
              <div key={product.id} className="glass p-6 rounded-2xl flex flex-col h-full hover:border-brand-500/30 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                    {product.icon}
                  </div>
                  <div className="bg-brand-500/10 text-brand-400 px-3 py-1 rounded-full text-xs font-semibold border border-brand-500/20">
                    {product.price}
                  </div>
                </div>
                
                <div className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  By {product.vendor}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                <p className="text-slate-400 text-sm mb-6 flex-grow">{product.tagline}</p>
                
                <div className="space-y-2 mb-6">
                  {product.features.map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-1.5 mt-auto">
                  <button 
                    onClick={() => handleRequestDemo(product)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium transition-all text-[11px] px-1 text-center"
                  >
                    Request Demo
                  </button>
                  <button 
                    onClick={() => handlePlayVideo(product.demo_video_url)}
                    className="flex-1 py-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400 font-semibold hover:bg-brand-500/20 transition-all text-[11px] px-1 text-center"
                  >
                    Demo Video
                  </button>
                  <Link 
                    href={`/marketplace/purchase/${product.id}`}
                    className="flex-1 text-center py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-all text-[11px] px-1 flex items-center justify-center shadow-md shadow-brand-500/10"
                  >
                    Purchase
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sell CTA */}
        <div className="mt-24 glass rounded-3xl p-10 text-center relative overflow-hidden border border-orange-500/20 fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
          <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Are you a Software Developer?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto relative z-10">
            Join the Softkart ecosystem. List your digital products on our marketplace, reach our enterprise clients, and we can even handle server deployments for your buyers.
          </p>
          <Link href="/vendor/add-product" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-orange-500/25 transition relative z-10">
            Start Selling Today
          </Link>
        </div>
      </main>

      {showVideoModal && activeVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md">
          <div className="glass max-w-3xl w-full rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl fade-in-up">
            <button 
              onClick={() => { setShowVideoModal(false); setActiveVideoUrl(null); }}
              className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black text-white rounded-full p-2.5 transition text-lg w-10 h-10 flex items-center justify-center border border-white/10"
            >
              ✕
            </button>
            <div className="p-4 bg-dark-900/80 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">📺 Product Video Walkthrough</h3>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {activeVideoUrl.includes("youtube.com") || activeVideoUrl.includes("youtube") || activeVideoUrl.includes("player.vimeo") ? (
                <iframe 
                  src={activeVideoUrl} 
                  className="w-full h-full border-none" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              ) : (
                <video 
                  src={activeVideoUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="p-4 bg-dark-900/50 flex justify-end">
              <button 
                onClick={() => { setShowVideoModal(false); setActiveVideoUrl(null); }}
                className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition text-sm font-semibold"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
