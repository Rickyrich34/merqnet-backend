import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft } from "lucide-react";

const API = (
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_API_BASE_URL ||
  "https://merqnet-backend-production.up.railway.app"
).replace(/\/$/, "");

function pickFirst(...vals) {
  for (const v of vals) {
    if (v && String(v).trim()) return v;
  }
  return null;
}

function formatMoney(amount, currency = "USD") {
  const num = Number(amount || 0);
  try {
    return num.toLocaleString("en-US", { style: "currency", currency });
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

const History = () => {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const token = pickFirst(
    localStorage.getItem("userToken"),
    localStorage.getItem("token")
  );

  const [buyerHistory, setBuyerHistory] = useState([]);
  const [sellerHistory, setSellerHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("buyer");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const authHeaders = useMemo(() => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  const loadHistory = async () => {
    if (!userId || !token) {
      setBuyerHistory([]);
      setSellerHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const results = await Promise.allSettled([
      axios.get(`${API}/api/receipts/buyer`, { headers: authHeaders }),
      axios.get(`${API}/api/receipts/seller`, { headers: authHeaders }),
    ]);

    if (results[0].status === "fulfilled") {
      const data = results[0].value?.data;
      setBuyerHistory(Array.isArray(data) ? data : []);
    } else {
      console.error("Buyer history fetch failed:", results[0].reason);
      setBuyerHistory([]);
    }

    if (results[1].status === "fulfilled") {
      const data = results[1].value?.data;
      setSellerHistory(Array.isArray(data) ? data : []);
    } else {
      console.error("Seller history fetch failed:", results[1].reason);
      setSellerHistory([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAllAsViewed = async () => {
    try {
      if (!userId || !token) return;
      setMarkingAll(true);

      await axios.put(
        `${API}/api/receipts/mark-all`,
        { userType: activeTab },
        { headers: authHeaders }
      );

      await loadHistory();
    } catch (err) {
      console.error("Mark all viewed error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const activeList = activeTab === "buyer" ? buyerHistory : sellerHistory;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-xl bg-[#0c001e]">
        Loading history...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c001e] text-white px-6 pt-28 pb-[140px]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-center text-4xl font-extrabold mb-6 text-purple-200">
          Purchase & Sales History
        </h1>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-12 h-12 flex items-center justify-center rounded-xl
                       bg-[#1a1033] hover:bg-[#25124a]
                       border border-cyan-500/20
                       shadow-[0_0_18px_rgba(0,220,255,0.10)]
                       transition"
            aria-label="Back"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5 text-cyan-300" />
          </button>

          <button
            disabled={markingAll}
            onClick={markAllAsViewed}
            className={`px-6 py-2 rounded-lg font-bold transition ${
              markingAll
                ? "bg-purple-800 opacity-70 cursor-not-allowed"
                : "bg-purple-700 hover:bg-purple-600 shadow-[0_0_18px_rgba(168,85,247,0.35)]"
            }`}
          >
            {markingAll ? "Marking..." : "Mark all as viewed"}
          </button>
        </div>

        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={() => setActiveTab("buyer")}
            className={`px-6 py-2 rounded-full font-bold transition ${
              activeTab === "buyer"
                ? "bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                : "bg-[#1a1033] hover:bg-[#25124a]"
            }`}
          >
            Buyer History
          </button>

          <button
            onClick={() => setActiveTab("seller")}
            className={`px-6 py-2 rounded-full font-bold transition ${
              activeTab === "seller"
                ? "bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                : "bg-[#1a1033] hover:bg-[#25124a]"
            }`}
          >
            Seller History
          </button>
        </div>

        {activeList.length === 0 ? (
          <div className="text-center text-white/60">No history available.</div>
        ) : (
          <div className="grid gap-4">
            {activeList.map((r) => {
              const isBuyerTab = activeTab === "buyer";
              const viewed = isBuyerTab ? r.viewedByBuyer : r.viewedBySeller;
              const pill = viewed ? "" : "NEW";

              const currency = r.currency || "USD";
              const amountText = formatMoney(r.amount, currency);

              const titleLeft = `Receipt ${r.receiptId || r._id || ""}`.trim();
              const subtitleLeft = r.requestId
                ? `Request: ${r.requestId}`
                : r.bidId
                ? `Bid: ${r.bidId}`
                : "";

              const cardLine =
                r.cardBrand && r.cardLast4
                  ? `${r.cardBrand.toUpperCase()} •••• ${r.cardLast4}${
                      r.cardExpMonth && r.cardExpYear
                        ? ` (exp ${String(r.cardExpMonth).padStart(
                            2,
                            "0"
                          )}/${String(r.cardExpYear).slice(-2)})`
                        : ""
                    }`
                  : r.paymentMethodId
                  ? `Payment method saved`
                  : "";

              return (
                <button
                  key={r._id || r.receiptId}
                  onClick={() =>
                    navigate(`/receipt/${r.receiptId || r._id || ""}`)
                  }
                  className="text-left w-full p-5 rounded-2xl bg-[#12062b] border border-purple-800/40
                             hover:border-purple-500/70 transition shadow-[0_0_30px_rgba(139,92,246,0.12)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-extrabold text-purple-200">
                        {titleLeft || "Receipt"}
                      </div>
                      {subtitleLeft ? (
                        <div className="text-sm text-white/60">
                          {subtitleLeft}
                        </div>
                      ) : null}
                      {cardLine ? (
                        <div className="text-xs text-white/55 mt-1">
                          {cardLine}
                        </div>
                      ) : null}
                    </div>

                    {pill && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-black">
                        {pill}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="text-white/70">
                      Amount:{" "}
                      <span className="text-emerald-300 font-bold">
                        {amountText}
                      </span>
                    </div>

                    <div className="text-white/70">
                      Status:{" "}
                      <span className="text-white/90 font-semibold">
                        {r.status || "Completed"}
                      </span>
                    </div>

                    <div className="text-white/60 col-span-2">
                      Date:{" "}
                      <span className="text-white/80">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
