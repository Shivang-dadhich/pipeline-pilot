import React, { useState, useEffect } from "react";
import {
  Building2,
  Globe,
  Rocket,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Layers,
} from "lucide-react";

export default function App() {
  const [leads, setLeads] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isProcessingId, setIsProcessingId] = useState(null);

  // User product context state
  const [myCompany, setMyCompany] = useState("CloudScale AI");
  const [myProduct, setMyProduct] = useState("Smart CRM");
  const [myDesc, setMyDesc] = useState(
    "An automated CRM for high-growth real estate teams.",
  );
  const [contextSaved, setContextSaved] = useState(false);

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    fetchLeads();
    fetchContext();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_URL}/leads`);
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  const fetchContext = async () => {
    try {
      const res = await fetch(`${API_URL}/context`);
      const data = await res.json();
      if (data.companyName) {
        setMyCompany(data.companyName);
        setMyProduct(data.productName);
        setMyDesc(data.productDescription);
        setContextSaved(true);
      }
    } catch (err) {
      console.error("Error fetching context:", err);
    }
  };

  const saveContext = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: myCompany,
          productName: myProduct,
          productDescription: myDesc,
          keyBenefits: ["Saves time", "Automates pipelines"],
        }),
      });
      setContextSaved(true);
      alert(
        "Product Profile updated successfully! The Agent will now target pitches for this product.",
      );
    } catch (err) {
      alert("Failed to save context.");
    }
  };

  const addLead = async (e) => {
    e.preventDefault();
    if (!companyName || !websiteUrl) return;
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, websiteUrl }),
      });
      const newLead = await res.json();
      setLeads([newLead, ...leads]);
      setCompanyName("");
      setWebsiteUrl("");
    } catch (err) {
      console.error("Error adding lead:", err);
    }
  };

  const runAgent = async (id) => {
    setIsProcessingId(id);
    try {
      const res = await fetch(`${API_URL}/leads/process/${id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh whole board state to show updated columns smoothly
        fetchLeads();
      } else {
        alert(data.error || "Agent failed to execute.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingId(null);
    }
  };

  // Helper arrays to map leads out onto corresponding Kanban lanes
  const columns = ["Discovered", "Researched", "Drafted", "Sent"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header Banner */}
      <header className="bg-slate-900 text-white py-6 px-8 shadow-md mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Layers className="text-indigo-400 h-8 w-8" />
            <h1 className="text-2xl font-bold tracking-tight">
              PipelinePilot{" "}
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500 text-white ml-2">
                AGENT v1.0
              </span>
            </h1>
          </div>
          <div className="text-slate-400 text-sm">
            Role: Senior Agent Controller
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Hand Options Column: Config and Entry Forms */}
        <div className="space-y-6 lg:col-span-1">
          {/* Form 1: Your Product Profile Context */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Rocket className="text-indigo-600 h-5 w-5" /> 1. Configure Your
              Product Profile
            </h2>
            <form onSubmit={saveContext} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Company Name
                </label>
                <input
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-indigo-500"
                  value={myCompany}
                  onChange={(e) => {
                    setMyCompany(e.target.value);
                    setContextSaved(false);
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Product Name
                </label>
                <input
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-indigo-500"
                  value={myProduct}
                  onChange={(e) => {
                    setMyProduct(e.target.value);
                    setContextSaved(false);
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Value Proposition / Core Pitch
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-indigo-500"
                  value={myDesc}
                  onChange={(e) => {
                    setMyDesc(e.target.value);
                    setContextSaved(false);
                  }}
                />
              </div>
              <button
                type="submit"
                className={`w-full py-2 rounded text-sm font-semibold transition-all ${contextSaved ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
              >
                {contextSaved
                  ? "✓ Profile Synced with Agent"
                  : "Update Core Profile Context"}
              </button>
            </form>
          </div>

          {/* Form 2: Add New Target Lead Prospect */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="text-indigo-600 h-5 w-5" /> 2. Add Target
              Company
            </h2>
            <form onSubmit={addLead} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Prospect Company Name
                </label>
                <input
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-indigo-500"
                  placeholder="e.g., Jaipur Enterprises"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Website URL
                </label>
                <input
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-indigo-500"
                  placeholder="e.g., jaipurent.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded text-sm font-semibold transition-all"
              >
                Inject Lead Into Pipeline
              </button>
            </form>
          </div>
        </div>

        {/* Right Hand Column: Main Real-time Kanban Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">
              Pipeline Board Lanes
            </h2>
            <button
              onClick={fetchLeads}
              className="p-1.5 bg-slate-200 rounded hover:bg-slate-300 text-slate-700 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {columns.map((col) => (
              <div
                key={col}
                className="bg-slate-100 p-3 rounded-lg border border-slate-200 min-h-[450px]"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {col}
                  </span>
                  <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {leads.filter((l) => l.status === col).length}
                  </span>
                </div>

                <div className="space-y-3">
                  {leads
                    .filter((l) => l.status === col)
                    .map((lead) => (
                      <div
                        key={lead._id}
                        className="bg-white p-3 rounded shadow-sm border border-slate-200 hover:border-indigo-300 transition-all"
                      >
                        <div className="font-bold text-sm text-slate-800 truncate">
                          {lead.companyName}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 mb-2 truncate">
                          <Globe className="h-3 w-3 inline" /> {lead.websiteUrl}
                        </div>

                        {lead.industry && lead.industry !== "Unknown" && (
                          <div className="bg-slate-100 text-[10px] inline-block px-2 py-0.5 rounded font-medium text-slate-600 mb-2">
                            {lead.industry}
                          </div>
                        )}

                        {lead.estimatedRoi > 0 && (
                          <div className="text-xs font-bold text-emerald-600 mb-2">
                            Est. ROI: ${lead.estimatedRoi.toLocaleString()}
                          </div>
                        )}

                        {/* Render processing triggers depending on column status */}
                        {lead.status === "Discovered" && (
                          <button
                            onClick={() => runAgent(lead._id)}
                            disabled={isProcessingId !== null}
                            className="w-full mt-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1.5 rounded text-xs flex items-center justify-center gap-1 disabled:opacity-50 transition-all"
                          >
                            {isProcessingId === lead._id ? (
                              <>
                                Answering...{" "}
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              </>
                            ) : (
                              <>
                                Trigger Agent <ArrowRight className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        )}

                        {lead.status === "Drafted" && (
                          <div className="space-y-3 mt-3 pt-3 border-t border-slate-100">
                            <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                              Generated Pitch:
                            </div>

                            {/* Scrollable, styled container for the email content */}
                            <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-line leading-relaxed shadow-inner">
                              {lead.generatedPitch}
                            </div>

                            <button
                              onClick={async () => {
                                await fetch(
                                  `${API_URL}/leads/${lead._id}/status`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ status: "Sent" }),
                                  },
                                );
                                fetchLeads();
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                            >
                              Approve & Mark Sent{" "}
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {lead.status === "Sent" && (
                          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 justify-center mt-2 bg-emerald-50 py-1 rounded">
                            ✓ Sent Successfully
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
