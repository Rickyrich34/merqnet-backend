import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Search, ReceiptText } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* ----------------------------- AUTH HELPERS ----------------------------- */
function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("userToken") || "";
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x.trim();
  if (typeof x === "object" && x._id) return String(x._id).trim();
  return String(x).trim();
}

/* ----------------------------- DATA HELPERS ----------------------------- */
function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmtMoney(v) {
  const n = safeNum(v);
  if (n === null) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtQty(v) {
  const n = safeNum(v);
  if (n === null) return "—";
  return n.toLocaleString();
}

function buildShippingText(req) {
  const s = req?.shippingAddress || req?.shipping || req?.shipTo || null;
  if (!s || typeof s !== "object") return "Not provided";

  const street = s.street || s.streetAddress || "";
  const city = s.city || "";
  const state = s.state || "";
  const country = s.country || "";
  const postalCode = s.postalCode || s.zip || "";

  const parts1 = [city, state].filter(Boolean).join(", ");
  const parts2 = [country, postalCode].filter(Boolean).join(" ");
  const compact = [parts1, parts2].filter(Boolean).join(" • ");
  const full = [street, compact].filter(Boolean).join(" — ");

  return full || compact || "Not provided";
}

function getBuyerLabel(req) {
  const b = req?.buyer || req?.client || req?.clientID || req?.user || null;

  if (typeof b === "string") return b;
  if (b && typeof b === "object") {
    const first = b.firstName || b.firstname || "";
    const last = b.lastName || b.lastname || "";
    const full = [first, last].filter(Boolean).join(" ").trim();
    return full || b.email || b.username || b.name || "Buyer";
  }

  return req?.buyerName || req?.clientName || req?.email || "Buyer";
}

function getCategory(req) {
  return req?.category || req?.type || "Other";
}

function getTitle(req) {
  return req?.productName || req?.name || req?.title || "Request";
}

function getQuantity(req) {
  return req?.quantity ?? req?.qty ?? req?.amount ?? "—";
}

/* ----------------------------- API CALLS ----------------------------- */
async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

/* ----------------------------- COMPONENT ----------------------------- */
export default function BuyerDashboard() {
  const navigate = useNavigate();

  const userId = useMemo(() => normalizeId(localStorage.getItem("userId")), []);
  const token = getToken();

  const [requests, setRequests] = useState([]);
  const [offersMap, setOffersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!token || !userId) navigate("/login");
  }, [token, userId, navigate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await apiGet(`/api/requests/buyer/${userId}`);
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.requests || [];
        setRequests(list);
      } catch (err) {
        console.error("BuyerDashboard load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (token && userId) load();
    return () => (cancelled = true);
  }, [token, userId]);

  useEffect(() => {
    let cancelled = false;

    const loadOffersFor = async (reqId) => {
      try {
        const data = await apiGet(`/api/bids/request/${reqId}`);
        if (cancelled) return;

        const bids = Array.isArray(data) ? data : data?.bids || [];
        const numericOffers = bids
          .map((b) => safeNum(b?.totalPrice ?? b?.totalprice ?? b?.amount ?? b?.price))
          .filter((n) => n !== null);

        const lowest = numericOffers.length ? Math.min(...numericOffers) : null;

        setOffersMap((prev) => ({
          ...prev,
          [reqId]: { lowestOffer: lowest, offersCount: bids.length },
        }));
      } catch {
        if (cancelled) return;
        setOffersMap((prev) => ({
          ...prev,
          [reqId]: { lowestOffer: null, offersCount: 0 },
        }));
      }
    };

    if (!requests?.length) return;
    requests.forEach((r) => {
      const rid = normalizeId(r?._id || r?.id);
      if (rid) loadOffersFor(rid);
    });

    return () => (cancelled = true);
  }, [requests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const id = String(r?._id || r?.id || "").toLowerCase();
      const name = String(getTitle(r)).toLowerCase();
      const cat = String(getCategory(r)).toLowerCase();
      return id.includes(q) || name.includes(q) || cat.includes(q);
    });
  }, [requests, query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-36 pb-20">
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-2xl border border-white/15 bg-[#0B001F]/85 hover:bg-[#0B001F] transition p-2.5"
            >
              <ChevronLeft className="w-5 h-5 text-white/80" />
            </button>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Buyer Dashboard</h1>
              <p className="text-xs sm:text-sm text-white/55 mt-1">
                Track your requests and choose your winning offer when ready.
              </p>
            </div>
          </div>

          {/* Create New Request (NO hyphens in route) */}
          <button
            onClick={() => navigate("/createrequest")}
            className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-[#0B001F]/85 hover:bg-[#0B001F] transition px-4 py-2.5"
          >
            <Plus className="w-5 h-5 text-cyan-200" />
            <span className="text-sm font-semibold text-cyan-200">Create New Request</span>
          </button>
        </div>

        <div className="mt-8 bg-[#0B001F]/80 border border-cyan-500/25 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-cyan-100">Find a request</h2>
              <p className="text-xs text-white/55 mt-1">Search your requests by name, ID, or category.</p>
            </div>

            <div className="text-xs text-white/50">
              Showing <span className="text-white/80">{filtered.length}</span> / {requests.length}
            </div>
          </div>

          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search my requests…"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 outline-none"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4">
          {filtered.map((r) => {
            const rid = normalizeId(r?._id || r?.id);
            const info = offersMap[rid] || { offersCount: 0, lowestOffer: null };

            return (
              <div
                key={rid}
                className="border border-white/10 rounded-2xl p-4 bg-[#0B001F]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="font-semibold">{getTitle(r)}</div>
                  <div className="text-xs text-white/50">Category: {getCategory(r)}</div>
                  <div className="text-xs text-white/50">Qty: {fmtQty(getQuantity(r))}</div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-xs text-white/60">Offers: {info.offersCount}</div>
                  <div className="text-sm text-cyan-200 font-semibold">
                    {info.lowestOffer !== null ? fmtMoney(info.lowestOffer) : "—"}
                  </div>

                  <button
                    onClick={() => navigate(`/bids/${rid}`)}
                    className="flex items-center gap-1 text-sm px-4 py-2 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 transition shadow-[0_8px_25px_rgba(251,191,36,0.45)]"
                  >
                    <ReceiptText className="w-4 h-4" />
                    View bids
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
