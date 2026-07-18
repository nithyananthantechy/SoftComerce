"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useClientAuth } from "@/context/ClientAuthContext";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { submitVendorProduct, getMarketplaceServices } from "@/lib/api";

export default function AddProductPage() {
  const { client, isLoading } = useClientAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [pricingModel, setPricingModel] = useState("per_month");
  const [price, setPrice] = useState("");
  const [demoVideoUrl, setDemoVideoUrl] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [currentFeature, setCurrentFeature] = useState("");
  const [agreeFee, setAgreeFee] = useState(false);
  
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!client) {
        router.push("/login");
      } else if (!client.is_seller) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, client, router]);

  useEffect(() => {
    getMarketplaceServices()
      .then((data) => {
        setDbServices(data);
        const initial: Record<string, boolean> = {};
        data.forEach((s: any) => {
          initial[s.service_key] = false;
        });
        setSelectedServices(initial);
      })
      .catch((err) => console.error("Error loading services:", err));
  }, []);

  if (isLoading || !client || !client.is_seller) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-brand-400">Loading...</div>
      </div>
    );
  }

  const handleAddFeature = () => {
    if (currentFeature.trim() !== "") {
      setFeatures([...features, currentFeature.trim()]);
      setCurrentFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeFee) {
      setErrorMsg("You must agree to the listing fee to publish your product.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    
    const isServerSetupSelected = !!selectedServices["server_setup"];

    try {
      await submitVendorProduct({
        name,
        tagline,
        description,
        features,
        currency,
        pricing_model: pricingModel,
        price,
        need_server: isServerSetupSelected,
        version,
        selected_services: selectedServices,
        demo_video_url: demoVideoUrl
      });
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit product.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen hero-gradient flex flex-col items-center justify-center p-6">
        <div className="glass p-10 rounded-3xl max-w-lg text-center border border-green-500/30">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🎉
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Showcase Waiting Admin Approval</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Reach <a href="mailto:nithyananthan@nskgroups.website" className="text-orange-400 hover:underline font-semibold">nithyananthan@nskgroups.website</a> and finish the payment. Once the product is approved, your product will be listed in the marketplace.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="btn-secondary py-2.5 px-6 rounded-xl text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition">
              Return Home
            </Link>
            <Link href="/vendor/dashboard" className="btn-brand py-2.5 px-6 rounded-xl">
              Go to Seller Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getPricingSuffix = (model: string) => {
    switch (model) {
      case "per_month": return " / mo";
      case "per_year": return " / yr";
      case "per_user": return " / user";
      case "one_time": return " one-time";
      case "custom": return " custom";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen hero-gradient pb-20">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/vendor/dashboard" className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-brand-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Dashboard
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 text-sm">
                🏬
              </div>
              <div>
                <p className="text-[12px] font-bold logo-text text-white leading-none mt-1">Vendor<span className="text-orange-400">Portal</span></p>
                <p className="text-sm font-semibold text-white leading-tight">List Your Product</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 text-center fade-in-up">
          <h1 className="font-display text-4xl font-bold text-white mb-4">Sell on Softkart Marketplace</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Reach thousands of potential buyers by listing your software, app, or digital product on our marketplace. 
            Fill out the details below to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 fade-in-up" style={{ animationDelay: "0.1s" }}>
          
          {/* Product Details Section */}
          <div className="glass p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">📦</div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-brand-400">01.</span> Product Information
            </h2>
            
            <div className="space-y-5 relative z-10">
              <div className="grid md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Product Name <span className="text-brand-400">*</span></label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-dark" placeholder="e.g. Acme CRM" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tagline <span className="text-brand-400">*</span></label>
                  <input type="text" required value={tagline} onChange={(e) => setTagline(e.target.value)} className="input-dark" placeholder="e.g. The ultimate customer management tool" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Version <span className="text-brand-400">*</span></label>
                  <input type="text" required value={version} onChange={(e) => setVersion(e.target.value)} className="input-dark" placeholder="e.g. 1.0.0" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Description <span className="text-brand-400">*</span></label>
                <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="input-dark resize-none" placeholder="Describe what your product does and who it's for..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Demo Video URL (YouTube, Vimeo, or MP4 Direct Link)</label>
                <input type="text" value={demoVideoUrl} onChange={(e) => setDemoVideoUrl(e.target.value)} className="input-dark" placeholder="e.g. https://www.youtube.com/watch?v=... or https://example.com/demo.mp4" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Key Features</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={currentFeature} 
                    onChange={(e) => setCurrentFeature(e.target.value)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="input-dark flex-1" 
                    placeholder="e.g. Advanced Analytics" 
                  />
                  <button type="button" onClick={handleAddFeature} className="btn-brand px-4 py-2 rounded-xl text-lg font-bold">+</button>
                </div>
                <div className="flex flex-col gap-2">
                  {features.map((feat, index) => (
                    <div key={index} className="flex items-center justify-between bg-dark-900/50 p-3 rounded-lg border border-white/5">
                      <span className="text-slate-300 text-sm flex items-center gap-2">
                        <span className="text-brand-400">•</span> {feat}
                      </span>
                      <button type="button" onClick={() => handleRemoveFeature(index)} className="text-red-400 hover:text-red-300 text-xs font-medium">Remove</button>
                    </div>
                  ))}
                  {features.length === 0 && (
                    <p className="text-slate-500 text-xs italic">No features added yet.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Price Estimate <span className="text-brand-400">*</span></label>
                <div className="flex gap-3">
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-dark shrink-0" style={{ width: "96px", minWidth: "96px" }}>
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                  </select>
                  <select value={pricingModel} onChange={(e) => setPricingModel(e.target.value)} className="input-dark shrink-0" style={{ width: "160px", minWidth: "160px" }}>
                    <option value="per_month">Per Month</option>
                    <option value="per_year">Per Year</option>
                    <option value="per_user">Per User</option>
                    <option value="one_time">One Time</option>
                    <option value="custom">Custom Pricing</option>
                  </select>
                  <input 
                    type="text" 
                    required 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    className="input-dark flex-grow" 
                    placeholder={pricingModel === "custom" ? "e.g. Contact Us or Free Tier" : "e.g. 49 or 500"} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Section */}
          <div className="glass p-8 rounded-3xl relative overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-brand-400">02.</span> Infrastructure & Support
            </h2>
            
            <div className="space-y-4">
              {dbServices.filter((s) => s.service_key !== "listing_fee").map((service) => {
                const isChecked = !!selectedServices[service.service_key];
                return (
                  <div key={service.service_key} className={`rounded-xl border p-5 transition-colors ${
                    isChecked ? "border-blue-500/50 bg-blue-500/10" : "border-white/5 bg-dark-900/30"
                  }`}>
                    <label className="flex cursor-pointer items-start gap-4 text-sm text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={(e) => setSelectedServices({
                          ...selectedServices,
                          [service.service_key]: e.target.checked
                        })} 
                        className="mt-1 h-5 w-5 rounded border-blue-500/50 bg-transparent text-blue-500 focus:ring-blue-500/50" 
                      />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <strong className="text-white block text-base mb-1">{service.service_name}</strong>
                          <span className="text-blue-400 font-mono font-bold">
                            {service.price > 0 
                              ? `+${service.currency === "INR" ? "₹" : "$"}${Number(service.price).toFixed(2)}${getPricingSuffix(service.pricing_model)}` 
                              : "Free"}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
              {dbServices.filter((s) => s.service_key !== "listing_fee").length === 0 && (
                <p className="text-slate-500 text-sm italic">Loading support and infrastructure options...</p>
              )}
            </div>
          </div>

          {/* Billing Section */}
          {(() => {
            const usesINR = currency === "INR";
            const currencySymbol = usesINR ? "₹" : "$";
            
            const listingFeeSvc = dbServices.find(s => s.service_key === "listing_fee");
            let listingFee = 99;
            let listingFeeModel = "one_time";
            let listingFeeName = "Marketplace Listing Fee";
            let listingFeeSymbol = "$";
            
            if (listingFeeSvc) {
              listingFeeName = listingFeeSvc.service_name;
              listingFeeModel = listingFeeSvc.pricing_model;
              if (usesINR && listingFeeSvc.currency === "USD") {
                listingFee = Number(listingFeeSvc.price) * 83.5;
                listingFeeSymbol = "₹";
              } else if (!usesINR && listingFeeSvc.currency === "INR") {
                listingFee = Number(listingFeeSvc.price) / 83.5;
                listingFeeSymbol = "$";
              } else {
                listingFee = Number(listingFeeSvc.price);
                listingFeeSymbol = listingFeeSvc.currency === "INR" ? "₹" : "$";
              }
            } else {
              listingFee = usesINR ? 8200 : 99;
              listingFeeSymbol = currencySymbol;
            }

            const totalAmount = listingFee + dbServices.reduce((sum, s) => sum + (s.service_key !== "listing_fee" && selectedServices[s.service_key] ? Number(s.price) : 0), 0);

            return (
              <div className="glass p-8 rounded-3xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-brand-400">03.</span> Marketplace Billing
                </h2>
                
                <div className="mb-6 bg-dark-900/50 rounded-xl p-5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-300 text-sm">{listingFeeName} ({listingFeeModel === "one_time" ? "One-time" : "Monthly"})</span>
                    <span className="text-white font-mono font-bold">{listingFeeSymbol}{listingFee.toFixed(2)}{getPricingSuffix(listingFeeModel)}</span>
                  </div>

                  {dbServices.filter((s) => s.service_key !== "listing_fee").map((service) => {
                    if (!selectedServices[service.service_key]) return null;
                    return (
                      <div key={service.service_key} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{service.service_name}</span>
                        <span className="text-slate-300 font-mono">
                          +{service.currency === "INR" ? "₹" : "$"}{Number(service.price).toFixed(2)}{getPricingSuffix(service.pricing_model)}
                        </span>
                      </div>
                    );
                  })}

                  <div className="flex justify-between items-center pt-2 border-t border-white/10 font-bold text-base">
                    <span className="text-white">Total Amount Due</span>
                    <span className="text-orange-400 font-mono">
                      {currencySymbol}{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pt-2">Includes verification, indexing, and selected infrastructure/support services.</p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
                  <input type="checkbox" required checked={agreeFee} onChange={(e) => setAgreeFee(e.target.checked)} className="h-5 w-5 rounded border-brand-500/50 bg-transparent text-brand-500 focus:ring-brand-500/50 mt-0.5" />
                  <span>
                    I agree to pay the total amount of {currencySymbol}{totalAmount.toFixed(2)} for listing and services. I understand an invoice will be sent to my email.
                  </span>
                </label>

            {status === "error" && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}
          </div>
            );
          })()}

          {/* Submit Action */}
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={status === "submitting"} className="btn-brand px-10 py-4 rounded-xl text-lg font-semibold shadow-xl shadow-brand-500/20 flex items-center gap-3">
              {status === "submitting" ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  List Product
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </>
              )}
            </button>
          </div>
          
        </form>
      </main>
    </div>
  );
}
