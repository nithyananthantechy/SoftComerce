"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClientAuth } from "@/context/ClientAuthContext";
import { getMyProducts, updateVendorProduct, getMarketplaceServices, getVendorEarnings, updateVendorBankDetails, verifyRegister } from "@/lib/api";
import Logo from "@/components/Logo";

export default function VendorDashboardPage() {
  const { client, logout, isLoading: isAuthLoading } = useClientAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    router.push("/login");
  };

  // Earnings & Bank Details States
  const [earningsData, setEarningsData] = useState<any>({ total_sales: 0, total_earnings: 0, bank_details: {}, orders: [] });
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [holderName, setHolderName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankSaveStatus, setBankSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDemoVideoUrl, setEditDemoVideoUrl] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPricingModel, setEditPricingModel] = useState("per_month");
  const [editCurrency, setEditCurrency] = useState("USD");
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [editCurrentFeature, setEditCurrentFeature] = useState("");
  const [editSelectedServices, setEditSelectedServices] = useState<Record<string, boolean>>({});
  const [editStatus, setEditStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [editError, setEditError] = useState("");

  const refreshProducts = () => {
    setLoading(true);
    getMyProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthLoading) {
      if (!client) {
        router.push("/login");
      } else if (!client.is_seller) {
        router.push("/dashboard");
      }
    }
  }, [client, isAuthLoading, router]);

  const loadEarnings = async () => {
    try {
      const data = await getVendorEarnings();
      setEarningsData(data);
      if (data.bank_details) {
        setBankName(data.bank_details.bank_name || "");
        setAccountNumber(data.bank_details.account_number || "");
        setIfscCode(data.bank_details.ifsc_code || "");
        setHolderName(data.bank_details.holder_name || "");
        setUpiId(data.bank_details.upi_id || "");
      }
    } catch (err) {
      console.error("Failed to load earnings:", err);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSaveStatus("saving");
    try {
      await updateVendorBankDetails({
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        holder_name: holderName,
        upi_id: upiId || null
      });
      setBankSaveStatus("success");
      setTimeout(() => setBankSaveStatus("idle"), 3000);
      await loadEarnings();
    } catch (err) {
      setBankSaveStatus("error");
    }
  };

  useEffect(() => {
    if (isAuthLoading || !client || !client.is_seller) return;
    refreshProducts();
    loadEarnings();
    getMarketplaceServices()
      .then(setDbServices)
      .catch((err) => console.error("Error loading services:", err));
  }, [client, isAuthLoading]);

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

  const handleOpenEditModal = (product: any) => {
    setEditProductId(product.id);
    setEditName(product.name);
    setEditTagline(product.tagline || "");
    setEditVersion(product.version || "1.0.0");
    setEditDescription(product.description || "");
    setEditDemoVideoUrl(product.demo_video_url || "");
    setEditPrice(product.price || "");
    setEditPricingModel(product.pricing_model || "per_month");
    setEditCurrency(product.currency || "USD");
    setEditFeatures(product.features || []);
    setEditCurrentFeature("");
    
    // Ensure all services keys are initialized
    const svc: Record<string, boolean> = {};
    dbServices.forEach((s) => {
      svc[s.service_key] = !!(product.selected_services && product.selected_services[s.service_key]);
    });
    setEditSelectedServices(svc);
    
    setEditStatus("idle");
    setEditError("");
    setIsEditModalOpen(true);
  };

  const handleAddEditFeature = () => {
    if (editCurrentFeature.trim() !== "") {
      setEditFeatures([...editFeatures, editCurrentFeature.trim()]);
      setEditCurrentFeature("");
    }
  };

  const handleRemoveEditFeature = (index: number) => {
    setEditFeatures(editFeatures.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductId) return;

    setEditStatus("submitting");
    const isServerSetupSelected = !!editSelectedServices["server_setup"];

    try {
      await updateVendorProduct(editProductId, {
        name: editName,
        tagline: editTagline,
        version: editVersion,
        description: editDescription,
        features: editFeatures,
        currency: editCurrency,
        pricing_model: editPricingModel,
        price: editPrice,
        need_server: isServerSetupSelected,
        selected_services: editSelectedServices,
        demo_video_url: editDemoVideoUrl
      });
      setIsEditModalOpen(false);
      refreshProducts();
    } catch (err: any) {
      setEditError(err.message || "Failed to update product.");
      setEditStatus("error");
    }
  };

  if (isAuthLoading || loading || !client || !client.is_seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 hero-gradient">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <h1 className="text-xl logo-text text-white leading-tight mt-1">
              Soft<span className="text-orange-400">kart</span> Vendor
            </h1>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition group text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shadow shadow-brand-500/30">
                    {client?.name ? client.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-brand-400 leading-tight transition">{client?.name}</span>
                    <span className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
                      {client?.is_admin ? "Admin" : "Seller"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-white transition ml-1">▼</span>
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-dark-900/95 backdrop-blur-md p-2 shadow-2xl z-50">
                      <Link 
                        href={client?.is_admin ? "/admin" : "/profile"} 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
                      >
                        {client?.is_admin ? "💼 Admin Panel" : "⚙️ Profile Settings"}
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
              <Link href="/" className="text-slate-400 hover:text-white transition font-medium px-1">Return Home</Link>
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition font-medium px-1">Client Dashboard</Link>
            </div>
            <Link href="/vendor/add-product" className="rounded-full bg-orange-500 px-4 py-2 text-white font-medium hover:bg-orange-600 transition text-xs font-semibold active:scale-[0.98]">List Product</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">Seller Dashboard</h2>
          <p className="text-slate-400">Monitor your marketplace listings and payments.</p>
        </div>

        {error && <div className="text-red-400 mb-6 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</div>}

        {/* --- Financial performance and bank settings grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Financial Performance Card */}
          <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Financial Performance</span>
              <h3 className="text-lg font-bold text-white mb-4">Escrow Balance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-3xl font-bold font-mono text-orange-400">
                  ${earningsData.total_earnings.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 block mt-1">Platform Payout Balance (Manual Disbursal)</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-xs">
                <div>
                  <span className="text-slate-500 block">Licenses Sold</span>
                  <span className="text-white font-bold text-base font-mono">{earningsData.total_sales}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pricing Currency</span>
                  <span className="text-white font-bold text-base">USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payout & Bank Account Settings Card */}
          <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2">🏦 Payout Bank Account Details</h3>
            <p className="text-xs text-slate-400 mb-4">Register your bank account details. Softkart manual payment transfers will disburse directly to this account.</p>
            
            <form onSubmit={handleSaveBankDetails} className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Bank Name</label>
                <input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)} className="input-dark w-full py-1.5 px-3 text-xs" placeholder="e.g. HDFC Bank" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Account Holder Name</label>
                <input type="text" required value={holderName} onChange={(e) => setHolderName(e.target.value)} className="input-dark w-full py-1.5 px-3 text-xs" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Account Number</label>
                <input type="text" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="input-dark w-full py-1.5 px-3 text-xs" placeholder="e.g. 5010029381832" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">IFSC Code</label>
                <input type="text" required value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} className="input-dark w-full py-1.5 px-3 text-xs" placeholder="e.g. HDFC0000240" />
              </div>
              <div className="col-span-2 flex items-center justify-between gap-4 pt-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">UPI ID (Optional)</label>
                  <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="input-dark w-full py-1.5 px-3 text-xs" placeholder="e.g. name@upi" />
                </div>
                <button type="submit" disabled={bankSaveStatus === "saving"} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl transition self-end">
                  {bankSaveStatus === "saving" ? "Saving..." : bankSaveStatus === "success" ? "Saved ✓" : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* --- Sales Order History --- */}
        {earningsData.orders.length > 0 && (
          <div className="glass p-6 rounded-2xl border border-white/5 mb-10 overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4">📈 Sales Order History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-900/50 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Buyer Details</th>
                    <th className="px-4 py-3">Paid Amount</th>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {earningsData.orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-white/2 transition">
                      <td className="px-4 py-3 font-bold text-orange-400">#{order.id}</td>
                      <td className="px-4 py-3 text-white font-semibold">{order.product_name}</td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-white">{order.buyer_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{order.buyer_email}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-orange-400">${order.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{order.payment_id || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-bold text-white">Your Listed Products</h3>
        </div>

        {products.length === 0 ? (
          <div className="glass p-12 text-center rounded-3xl border border-orange-500/20">
            <div className="text-6xl mb-6">🏪</div>
            <h3 className="text-2xl font-bold text-white mb-3">Welcome to your store!</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">You haven't listed any products yet. Start selling your software to thousands of Softkart clients.</p>
            <Link href="/vendor/add-product" className="btn-brand py-3 px-8 rounded-xl text-lg shadow-xl shadow-brand-500/20">
              Create First Listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="glass p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-orange-500/30 transition-colors relative overflow-hidden"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{product.name}</h3>
                    <span className="text-slate-400 text-sm font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      v{product.version || "1.0.0"}
                    </span>
                    
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                        product.status === "live"
                          ? "bg-green-500/20 text-green-400"
                          : product.status === "rejected"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {product.status.replace(/_/g, " ")}
                    </span>

                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                        product.payment_status === "paid"
                          ? "bg-green-500/20 text-green-400"
                          : product.payment_status === "overdue"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      FEE {product.payment_status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{product.tagline || product.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-500 mb-3">
                    <div>Price: <span className="text-white">{product.price} {product.currency} ({product.pricing_model.replace('_', ' ')})</span></div>
                    <div>Needs Server: <span className="text-white">{product.need_server ? "Yes" : "No"}</span></div>
                    <div>Listed: <span className="text-white">{new Date(product.created_at).toLocaleDateString()}</span></div>
                  </div>

                  {product.selected_services && Object.keys(product.selected_services).some(k => product.selected_services[k]) && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      {Object.entries(product.selected_services)
                        .filter(([_, enabled]) => enabled)
                        .map(([key]) => {
                          const matchedSvc = dbServices.find(s => s.service_key === key);
                          const label = matchedSvc ? matchedSvc.service_name : key.replace(/_/g, ' ');
                          return (
                            <span key={key} className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                              ⚙️ {label}
                            </span>
                          );
                        })}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <button 
                    onClick={() => handleOpenEditModal(product)} 
                    className="text-center px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition text-sm shadow-md"
                  >
                    Edit Product
                  </button>
                  {product.status === "live" && (
                    <Link href={`/marketplace`} className="text-center px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition text-sm">
                      View Public
                    </Link>
                  )}
                  {product.payment_status === "unpaid" && (
                    <span className="text-center px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                      Pending Admin approval and Zoho invoice payment
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm overflow-y-auto">
          <div className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 p-8 shadow-2xl relative fade-in-up">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition text-2xl"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              ✏️ Edit Product Details
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PRODUCT NAME</label>
                  <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="input-dark w-full" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">TAGLINE</label>
                  <input type="text" required value={editTagline} onChange={(e) => setEditTagline(e.target.value)} className="input-dark w-full" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">VERSION</label>
                  <input type="text" required value={editVersion} onChange={(e) => setEditVersion(e.target.value)} className="input-dark w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">DESCRIPTION</label>
                <textarea required rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="input-dark w-full resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">DEMO VIDEO URL</label>
                <input type="text" value={editDemoVideoUrl} onChange={(e) => setEditDemoVideoUrl(e.target.value)} className="input-dark w-full" placeholder="e.g. YouTube or direct MP4 link" />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">CURRENCY</label>
                  <select value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} className="input-dark w-full" style={{ background: "#1a1f2e" }}>
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PRICING MODEL</label>
                  <select value={editPricingModel} onChange={(e) => setEditPricingModel(e.target.value)} className="input-dark w-full" style={{ background: "#1a1f2e" }}>
                    <option value="per_month">Per Month</option>
                    <option value="per_year">Per Year</option>
                    <option value="per_user">Per User</option>
                    <option value="one_time">One Time</option>
                    <option value="custom">Custom Pricing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PRICE</label>
                  <input 
                    type="text" 
                    required 
                    value={editPrice} 
                    onChange={(e) => setEditPrice(e.target.value)} 
                    className="input-dark w-full" 
                    placeholder={editPricingModel === "custom" ? "e.g. Contact Us" : "e.g. 49"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">FEATURES</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={editCurrentFeature} 
                    onChange={(e) => setEditCurrentFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditFeature();
                      }
                    }}
                    className="input-dark flex-grow" 
                    placeholder="Add a new feature..." 
                  />
                  <button type="button" onClick={handleAddEditFeature} className="btn-brand px-4 py-2 rounded-xl text-lg font-bold">+</button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto bg-dark-900/50 p-2 rounded-xl border border-white/5">
                  {editFeatures.map((feat, i) => (
                    <span key={i} className="text-xs bg-white/5 border border-white/10 text-slate-300 px-2 py-1 rounded-lg flex items-center gap-1.5">
                      {feat}
                      <button type="button" onClick={() => handleRemoveEditFeature(i)} className="text-red-400 hover:text-red-300 font-bold">✕</button>
                    </span>
                  ))}
                  {editFeatures.length === 0 && <span className="text-slate-500 text-xs italic">No features added yet.</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-3">INFRASTRUCTURE & SUPPORT</label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {dbServices.map((service) => {
                    const isChecked = !!editSelectedServices[service.service_key];
                    return (
                      <label key={service.service_key} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-dark-900/30 cursor-pointer hover:bg-dark-900/50 transition">
                        <span className="flex items-center gap-2 text-sm text-slate-300">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => setEditSelectedServices({
                              ...editSelectedServices,
                              [service.service_key]: e.target.checked
                            })}
                            className="h-4 w-4 rounded border-blue-500/50 bg-transparent text-blue-500 focus:ring-blue-500/50" 
                          />
                          {service.service_name}
                        </span>
                        <span className="text-blue-400 font-mono text-xs font-bold">
                          {service.price > 0 
                            ? `+$${Number(service.price).toFixed(2)}${getPricingSuffix(service.pricing_model)}` 
                            : "Free"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editStatus === "submitting"}
                  className="btn-brand px-8 py-2.5 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2"
                >
                  {editStatus === "submitting" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
