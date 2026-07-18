"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  getAdminMarketplaceProducts, 
  updateMarketplacePayment, 
  updateMarketplaceStatus, 
  notifyMarketplacePayment,
  getAdminMarketplaceServices,
  createAdminMarketplaceService,
  updateAdminMarketplaceService,
  deleteAdminMarketplaceService,
  adminLogout 
} from "@/lib/api";
import Logo from "@/components/Logo";

export default function AdminMarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"listings" | "services">("listings");

  // Admin Services Editor State
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [servicePrice, setServicePrice] = useState(0);
  const [servicePricingModel, setServicePricingModel] = useState("one_time");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceCurrency, setServiceCurrency] = useState("USD");
  const [isAddMode, setIsAddMode] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const prodData = await getAdminMarketplaceProducts();
      setProducts(prodData);
      const svcData = await getAdminMarketplaceServices();
      setServices(svcData);
      setError("");
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.toLowerCase().includes("authenticated") || msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        window.location.href = "/admin/login";
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLogout() {
    await adminLogout();
    window.location.href = "/admin/login";
  }

  async function handlePayment(id: number, status: string) {
    try {
      await updateMarketplacePayment(id, status);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update payment");
    }
  }

  async function handleStatus(id: number, status: string) {
    try {
      await updateMarketplaceStatus(id, status);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  }

  async function handleNotify(id: number) {
    try {
      await notifyMarketplacePayment(id);
      alert("Payment reminder email sent to vendor!");
    } catch (err: any) {
      setError(err.message || "Failed to send reminder");
    }
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

  // --- Services Pricing Settings Actions ---
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceName("");
    setServiceKey("");
    setServicePrice(0);
    setServicePricingModel("one_time");
    setServiceDescription("");
    setServiceCurrency("USD");
    setIsAddMode(true);
  };

  const handleOpenEditService = (svc: any) => {
    setIsAddMode(false);
    setEditingServiceId(svc.id);
    setServiceName(svc.service_name);
    setServiceKey(svc.service_key);
    setServicePrice(Number(svc.price));
    setServicePricingModel(svc.pricing_model || "one_time");
    setServiceDescription(svc.description || "");
    setServiceCurrency(svc.currency || "USD");
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAddMode) {
        await createAdminMarketplaceService({
          service_key: serviceKey,
          service_name: serviceName,
          price: servicePrice,
          pricing_model: servicePricingModel,
          description: serviceDescription,
          currency: serviceCurrency
        });
      } else if (editingServiceId) {
        await updateAdminMarketplaceService(editingServiceId, {
          service_key: serviceKey,
          service_name: serviceName,
          price: servicePrice,
          pricing_model: servicePricingModel,
          description: serviceDescription,
          currency: serviceCurrency
        });
      }
      setIsAddMode(false);
      setEditingServiceId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save service pricing");
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm("Are you sure you want to delete this service option?")) return;
    try {
      await deleteAdminMarketplaceService(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete service");
    }
  };

  return (
    <div className="min-h-screen hero-gradient">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <h1 className="text-base font-bold leading-tight text-white mt-1.5">Admin Marketplace</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm font-medium text-slate-400 transition hover:text-brand-400">
              Proposals
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <Link href="/" className="text-sm font-medium text-slate-400 transition hover:text-brand-400">
              Public site
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Marketplace Management</h2>
            <p className="text-slate-400">Review vendor product listings, approve verification states, and manage Dynamic Service Pricings.</p>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-dark-900/50 p-1.5 rounded-2xl border border-white/5 self-start">
            <button 
              onClick={() => setActiveTab("listings")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "listings" ? "bg-orange-500 text-white shadow-md shadow-orange-500/15" : "text-slate-400 hover:text-white"
              }`}
            >
              🏪 Product Listings
            </button>
            <button 
              onClick={() => setActiveTab("services")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "services" ? "bg-orange-500 text-white shadow-md shadow-orange-500/15" : "text-slate-400 hover:text-white"
              }`}
            >
              ⚙️ Support Service Options
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* --- Listings Tab Content --- */}
        {activeTab === "listings" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500" />
              </div>
            ) : products.length === 0 ? (
              <div className="glass flex flex-col items-center justify-center p-12 text-center">
                <span className="mb-3 text-4xl">📭</span>
                <p className="text-slate-400">No vendor products submitted yet.</p>
              </div>
            ) : (
              <div className="glass overflow-hidden rounded-2xl border border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/5 bg-dark-900/50">
                      <tr>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Vendor</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Product details</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Product Price</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice Amount Due</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {products.map((p) => {
                        const totalBill = 99 + services.reduce((sum, s) => {
                          return sum + (p.selected_services && p.selected_services[s.service_key] ? Number(s.price) : 0);
                        }, 0);

                        return (
                          <tr key={p.id} className="group transition hover:bg-white/2">
                            <td className="px-5 py-4 font-bold text-orange-400">#{p.id}</td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-white">{p.vendor?.name}</p>
                              <a href={`mailto:${p.vendor?.email}`} className="text-xs text-slate-400 hover:text-orange-400 font-mono">{p.vendor?.email}</a>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="font-bold text-white">{p.name}</p>
                                <span className="text-[10px] font-mono px-1 py-0.2 bg-white/5 border border-white/10 rounded text-slate-400">
                                  v{p.version || "1.0.0"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 truncate max-w-xs">{p.tagline}</p>
                              {p.selected_services && Object.keys(p.selected_services).some(k => p.selected_services[k]) && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {Object.entries(p.selected_services)
                                    .filter(([_, enabled]) => enabled)
                                    .map(([key]) => {
                                      const match = services.find(s => s.service_key === key);
                                      const label = match ? match.service_name : key.replace(/_/g, ' ');
                                      return (
                                        <span key={key} className="text-[9px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                          {label}
                                        </span>
                                      );
                                    })}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 font-mono text-xs">
                              {p.price} {p.currency}
                              <div className="text-[10px] text-slate-500 capitalize mt-1">{p.pricing_model.replace('_', ' ')}</div>
                            </td>
                            <td className="px-5 py-4 font-mono text-xs">
                              <div className="font-bold text-orange-400 text-sm mb-1">${totalBill.toFixed(2)}</div>
                              <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-full ${
                                p.payment_status === "paid" ? "bg-green-500/20 text-green-400" :
                                p.payment_status === "overdue" ? "bg-red-500/20 text-red-400" :
                                "bg-amber-500/20 text-amber-400"
                              }`}>
                                {p.payment_status}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-full ${
                                p.status === "live" ? "bg-green-500/20 text-green-400" :
                                p.status === "rejected" ? "bg-red-500/20 text-red-400" :
                                "bg-blue-500/20 text-blue-400"
                              }`}>
                                {p.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                                {p.payment_status !== "paid" && (
                                  <>
                                    <button onClick={() => handleNotify(p.id)} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition">Notify</button>
                                    <button onClick={() => handlePayment(p.id, "paid")} className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 hover:bg-green-500/20 transition">Mark Paid</button>
                                  </>
                                )}
                                {p.status !== "live" && p.payment_status === "paid" && (
                                  <button onClick={() => handleStatus(p.id, "live")} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition">Approve</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Services Tab Content --- */}
        {activeTab === "services" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Services List Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Configured Services</h3>
                  {!isAddMode && editingServiceId === null && (
                    <button 
                      onClick={handleOpenAddService}
                      className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition"
                    >
                      + Add New Service Option
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {services.map((svc) => (
                    <div key={svc.id} className="p-4 rounded-xl border border-white/5 bg-dark-900/40 hover:border-white/10 transition flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-base font-bold text-white">{svc.service_name}</p>
                          <span className="font-mono text-sm font-bold text-orange-400">
                            {svc.currency === "INR" ? "₹" : svc.currency === "USD" ? "$" : (svc.currency || "$")}{Number(svc.price).toFixed(2)}{getPricingSuffix(svc.pricing_model)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mb-2">Key: {svc.service_key}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          {svc.description || "No description provided."}
                        </p>
                      </div>
                      <div className="flex gap-4 pt-3 border-t border-white/5">
                        <button 
                          onClick={() => handleOpenEditService(svc)} 
                          className="text-xs text-orange-400 hover:text-orange-300 font-medium transition"
                        >
                          Edit Details
                        </button>
                        <button 
                          onClick={() => handleDeleteService(svc.id)} 
                          className="text-xs text-red-500 hover:text-red-400 font-medium transition"
                        >
                          Delete Option
                        </button>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <p className="text-slate-500 text-sm italic text-center py-10 col-span-2">No support options defined yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Form Editor Panel */}
            <div className="lg:col-span-1">
              {(isAddMode || editingServiceId !== null) ? (
                <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {isAddMode ? "✨ Create Service Option" : "✏️ Edit Service Option"}
                  </h3>
                  
                  <form onSubmit={handleSaveService} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">KEY NAME (Unique ID, e.g. tech_support)</label>
                      <input 
                        type="text" 
                        required 
                        disabled={!isAddMode}
                        value={serviceKey} 
                        onChange={(e) => setServiceKey(e.target.value)} 
                        className="input-dark w-full py-2.5" 
                        placeholder="e.g. tech_support"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">DISPLAY TITLE (e.g. Dedicated Technical Support)</label>
                      <input 
                        type="text" 
                        required 
                        value={serviceName} 
                        onChange={(e) => setServiceName(e.target.value)} 
                        className="input-dark w-full py-2.5" 
                        placeholder="e.g. Dedicated Support"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">CURRENCY</label>
                        <select 
                          value={serviceCurrency} 
                          onChange={(e) => setServiceCurrency(e.target.value)} 
                          className="input-dark w-full py-2.5 text-sm" 
                          style={{ background: "#1a1f2e" }}
                        >
                          <option value="USD">USD ($)</option>
                          <option value="INR">INR (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">PRICE</label>
                        <input 
                          type="number" 
                          required 
                          value={servicePrice} 
                          onChange={(e) => setServicePrice(Number(e.target.value))} 
                          className="input-dark w-full py-2.5 font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">MODEL</label>
                        <select 
                          value={servicePricingModel} 
                          onChange={(e) => setServicePricingModel(e.target.value)} 
                          className="input-dark w-full py-2.5 text-sm" 
                          style={{ background: "#1a1f2e" }}
                        >
                          <option value="one_time">One Time</option>
                          <option value="per_month">Per Month</option>
                          <option value="per_year">Per Year</option>
                          <option value="per_user">Per User</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">DESCRIPTION (Shown to sellers in checkout checklist)</label>
                      <textarea 
                        rows={4}
                        required 
                        value={serviceDescription} 
                        onChange={(e) => setServiceDescription(e.target.value)} 
                        className="input-dark w-full resize-none py-2.5" 
                        placeholder="e.g. He is dedicately handle it that client..."
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                      <button 
                        type="button" 
                        onClick={() => { setIsAddMode(false); setEditingServiceId(null); }}
                        className="px-5 py-2 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 transition text-sm font-semibold"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition text-sm font-semibold shadow-lg"
                      >
                        Save Option
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="glass p-8 text-center rounded-2xl border border-white/5 text-slate-400">
                  <span className="text-4xl block mb-3">🛠️</span>
                  Select or click **Add New Service Option** to create or update infrastructure & support billing options.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
