"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useClientAuth } from "@/context/ClientAuthContext";
import { getPublicProducts, purchaseMarketplaceProduct } from "@/lib/api";

const MOCK_MARKETPLACE_PRODUCTS = [
  {
    id: "mkt-1",
    vendor: "DataFlow Systems",
    name: "FlowAnalytics Pro",
    tagline: "Real-time user behavior analytics platform",
    price: "$49/mo",
    priceVal: 49.00,
    icon: "📊",
    features: ["Real-time Tracking", "Custom Dashboards", "Export to CSV"],
  },
  {
    id: "mkt-2",
    vendor: "CreativeApps Inc",
    name: "DesignUI Toolkit",
    tagline: "Premium UI components for Next.js and Tailwind",
    price: "$199 one-time",
    priceVal: 199.00,
    icon: "🎨",
    features: ["500+ Components", "Figma Files", "Lifetime Updates"],
  },
  {
    id: "mkt-3",
    vendor: "SecureNet Ltd",
    name: "AuthGuard Enterprise",
    tagline: "Drop-in authentication and role management",
    price: "$99/mo",
    priceVal: 99.00,
    icon: "🔒",
    features: ["OAuth2", "MFA Support", "SSO Integration"],
  }
];

export default function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { client, isLoading: isAuthLoading } = useClientAuth();
  const resolvedParams = use(params);
  const productIdStr = resolvedParams.id;

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [address, setAddress] = useState("");

  // Payment states
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!client) {
      alert("Please log in to purchase products.");
      router.push("/login");
      return;
    }
    setBuyerName(client.name || "");
    setBuyerEmail(client.email || "");

    // Load product
    if (productIdStr.startsWith("mkt-")) {
      const found = MOCK_MARKETPLACE_PRODUCTS.find(p => p.id === productIdStr);
      setProduct(found || null);
      setLoading(false);
    } else {
      const dbId = parseInt(productIdStr.replace("db-", ""));
      getPublicProducts()
        .then((list) => {
          const matched = list.find((p: any) => p.id === dbId);
          if (matched) {
            let formattedPrice = "Custom Pricing";
            let numericPrice = 0;
            if (matched.price) {
              numericPrice = Number(matched.price);
              const sym = matched.currency === "USD" ? "$" : matched.currency === "INR" ? "₹" : matched.currency + " ";
              const model = matched.pricing_model === "per_month" ? "/mo" :
                            matched.pricing_model === "per_year" ? "/yr" :
                            matched.pricing_model === "one_time" ? " one-time" :
                            matched.pricing_model === "per_user" ? "/user" : "";
              formattedPrice = `${sym}${matched.price}${model}`;
            }
            setProduct({
              id: dbId,
              vendor: matched.vendor?.name || "Independent Seller",
              name: matched.name,
              tagline: matched.tagline || matched.description || "",
              price: formattedPrice,
              priceVal: numericPrice,
              icon: "⚙️",
              features: matched.features || [],
              isDb: true
            });
          }
        })
        .catch(err => console.error("Error loading product detail:", err))
        .finally(() => setLoading(false));
    }
  }, [productIdStr, client, isAuthLoading, router]);

  const handleOpenPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerEmail || !address) {
      alert("Please fill in all checkout fields.");
      return;
    }
    setShowRazorpay(true);
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    setErrorMsg("");
    try {
      // Simulate Razorpay network processing latency
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (product.isDb) {
        // Record purchase in DB
        await purchaseMarketplaceProduct(product.id, {
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          shipping_address: address,
          amount: product.priceVal,
          payment_id: "pay_mock_" + Math.random().toString(36).substring(2, 9).toUpperCase()
        });
      }

      // Generate random mock license key
      const randKey = `SOFT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setLicenseKey(randKey);
      setSuccess(true);
      setShowRazorpay(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Payment simulation failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen hero-gradient flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl mb-4">📭</span>
        <h2 className="text-xl font-bold text-white mb-2">Product Not Found</h2>
        <Link href="/marketplace" className="text-brand-400 hover:underline">Return to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient pb-20">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <h1 className="text-xl logo-text text-white leading-tight mt-1">
              Soft<span className="logo-text-gradient">kart</span>
            </h1>
          </div>
          <Link href="/marketplace" className="text-sm font-medium text-slate-300 hover:text-white transition">
            ✕ Cancel Purchase
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {success ? (
          /* Success Screen */
          <div className="max-w-xl mx-auto glass p-10 rounded-3xl border border-green-500/20 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-green-500" />
            <span className="text-5xl block mb-6">🎉</span>
            <h2 className="text-3xl font-bold text-white mb-2">Softpurchase Successful!</h2>
            <p className="text-slate-400 text-sm mb-6">Thank you for purchasing <strong>{product.name}</strong> from {product.vendor}.</p>
            
            <div className="bg-dark-900/50 rounded-2xl border border-white/5 p-6 mb-8 text-left space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Generated License Key</span>
                <span className="font-mono text-lg font-bold text-orange-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 block text-center tracking-wider font-bold">
                  {licenseKey}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Buyer Name</span>
                  <span className="text-white font-medium">{buyerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Buyer Email</span>
                  <span className="text-white font-medium">{buyerEmail}</span>
                </div>
              </div>
              <div className="text-xs border-t border-white/5 pt-3">
                <span className="text-slate-500 block">Delivery Address</span>
                <span className="text-white leading-relaxed">{address}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-8">
              A copy of this Zoho purchase invoice receipt has been dispatched to {buyerEmail}.
            </p>

            <Link 
              href="/marketplace"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-orange-500/25 transition w-full text-center"
            >
              Return to Marketplace
            </Link>
          </div>
        ) : (
          /* Checkout Forms */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Billing Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass p-8 rounded-3xl relative overflow-hidden">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  💳 Checkout Billing & Delivery
                </h2>
                
                <form onSubmit={handleOpenPayment} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">FULL NAME</label>
                    <input 
                      type="text" 
                      required 
                      value={buyerName} 
                      onChange={(e) => setBuyerName(e.target.value)} 
                      className="input-dark w-full py-2.5" 
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      required 
                      value={buyerEmail} 
                      onChange={(e) => setBuyerEmail(e.target.value)} 
                      className="input-dark w-full py-2.5" 
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">SHIPPING / DELIVERY COORDINATES (For license delivery)</label>
                    <textarea 
                      required 
                      rows={4}
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      className="input-dark w-full resize-none py-2.5" 
                      placeholder="Street address, City, ZIP, Country"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Payment</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Product Sidebar Summary */}
            <div className="lg:col-span-1">
              <div className="glass p-6 rounded-3xl border border-white/5 space-y-6 sticky top-24">
                <h3 className="text-lg font-bold text-white">Product Summary</h3>
                
                <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl border border-white/10">
                    {product.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white leading-tight">{product.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">By {product.vendor}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {product.features.slice(0, 4).map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">License Subtotal</span>
                    <span className="text-white font-mono">{product.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-white/5">
                    <span className="text-white">Amount Due Now</span>
                    <span className="text-orange-400 font-mono text-base">{product.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Razorpay Gateway Mockup Modal Overlay --- */}
      {showRazorpay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-[#111424] rounded-2xl shadow-2xl w-full max-w-md border border-white/10 overflow-hidden relative">
            {/* Top Razorpay brand strip */}
            <div className="bg-[#0b0e1b] px-6 py-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">R</span>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase">NITECHSPARK Gateways</h4>
                  <p className="text-[10px] text-slate-500 leading-none">razorpay.nitechspark.in</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRazorpay(false)} 
                className="text-slate-400 hover:text-white transition text-sm"
              >
                ✕
              </button>
            </div>

            {/* Inner Details */}
            <div className="p-6 space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="bg-dark-900/50 rounded-xl p-4 border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Paying for product</span>
                  <span className="text-white font-bold text-sm">{product.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold font-mono">Amount</span>
                  <span className="text-blue-400 font-bold text-lg font-mono">{product.price}</span>
                </div>
              </div>

              {paying ? (
                /* Processing State */
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <span className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
                  <p className="text-sm font-medium text-slate-300">Processing secure transaction via Razorpay...</p>
                  <p className="text-[10px] text-slate-500">Please do not close this window or click refresh.</p>
                </div>
              ) : (
                /* Form Choices */
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Choose Payment Method</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleSimulatePayment} className="p-4 rounded-xl border border-white/5 bg-white/2 hover:border-blue-500/50 hover:bg-blue-500/5 text-left transition space-y-1">
                      <span className="block text-xl">💳</span>
                      <strong className="block text-xs text-white">Cards</strong>
                      <span className="text-[9px] text-slate-500 block">Visa, MasterCard</span>
                    </button>
                    <button onClick={handleSimulatePayment} className="p-4 rounded-xl border border-white/5 bg-white/2 hover:border-blue-500/50 hover:bg-blue-500/5 text-left transition space-y-1">
                      <span className="block text-xl">📱</span>
                      <strong className="block text-xs text-white">UPI Pay</strong>
                      <span className="text-[9px] text-slate-500 block">GooglePay, PhonePe</span>
                    </button>
                    <button onClick={handleSimulatePayment} className="p-4 rounded-xl border border-white/5 bg-white/2 hover:border-blue-500/50 hover:bg-blue-500/5 text-left transition space-y-1">
                      <span className="block text-xl">🏦</span>
                      <strong className="block text-xs text-white">Netbanking</strong>
                      <span className="text-[9px] text-slate-500 block">All Indian Banks</span>
                    </button>
                    <button onClick={handleSimulatePayment} className="p-4 rounded-xl border border-white/5 bg-white/2 hover:border-blue-500/50 hover:bg-blue-500/5 text-left transition space-y-1">
                      <span className="block text-xl">💼</span>
                      <strong className="block text-xs text-white">Wallets</strong>
                      <span className="text-[9px] text-slate-500 block">Mobikwik, AmazonPay</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Secured Footer */}
            <div className="bg-[#0b0e1b] px-6 py-4 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5">
              <span>🔒 256-bit SSL Secure Payment</span>
              <span>Powered by Razorpay</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
