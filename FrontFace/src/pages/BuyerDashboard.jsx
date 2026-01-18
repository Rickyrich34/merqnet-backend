import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Search, ReceiptText } from "lucide-react";

import Galactic1 from "../assets/Galactic1.png";

const API_BASE_URL = "http://localhost:5000";

/* ----------------------------- AUTH HELPERS ----------------------------- */
function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("userToken") || "";
}

function authHeaders() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

function clampNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
}

function money(n) {
  const x = clampNumber(n);
  if (x === null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(x);
}

function extractBidPrice(b) {
  const candidates = [
    b?.wholeLotPrice,
    b?.totalPrice,
    b?.finalPrice,
    b?.amount,
    b?.price,
    b?.bidPrice,
    b?.unitPrice,
  ];
  for (const c of candidates) {
    const x = clampNumber(c);
    if (x !== null) return x;
  }
  return null;
}

// Handles both: requestId: "..." OR requestId: { _id: "..." }
function normalizeId(val) {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (val._id) return String(val._id);
    if (val.id) return String(val.id);
  }
  return String(val);
}

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [requests, setRequests] = useState([]);
  const [bidsCount, setBidsCount] = useState({});
  const [bidMeta, setBidMeta] = useState({});

  // requestId -> { receiptId, createdAt }
  const [paidMap, setPaidMap] = useState({});
  const [loading, setLoading] = useState(false);

  // UI-only controls
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!userId || !getToken()) {
      navigate("/login");
      return;
    }
    fetchAll();
    // eslint-disable-next-line
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      await fetchRequests();
      await fetchBuyerReceipts();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    const res = await fetch(`${API_BASE_URL}/api/requests/buyer/${userId}`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      setRequests([]);
      return;
    }

    const data = await res.json();
    const finalRequests = Array.isArray(data)
      ? data
      : Array.isArray(data.requests)
      ? data.requests
      : [];

    setRequests(finalRequests);

    finalRequests.forEach((req) => {
      fetchBidCount(req._id);
      fetchBidMeta(req._id);
    });
  };

  const fetchBidCount = async (requestId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bids/request/${requestId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;

      const data = await res.json();
      const count = Array.isArray(data) ? data.length : 0;

      setBidsCount((prev) => ({ ...prev, [requestId]: count }));
    } catch {}
  };

  const fetchBidMeta = async (requestId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bids/request/${requestId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;

      const data = await res.json();
      const bids = Array.isArray(data) ? data : [];

      let lowest = null;
      for (const b of bids) {
        const p = extractBidPrice(b);
        if (p === null) continue;
        if (lowest === null || p < lowest) lowest = p;
      }

      setBidMeta((prev) => ({
        ...prev,
        [requestId]: { lowest },
      }));
    } catch {}
  };

  const fetchBuyerReceipts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/receipts/buyer`, {
        headers: authHeaders(),
      });

      if (!res.ok) return;

      const data = await res.json();
      const receipts = Array.isArray(data)
        ? data
        : Array.isArray(data.receipts)
        ? data.receipts
        : [];

      const map = {};
      receipts.forEach((r) => {
        const reqId = normalizeId(r?.requestId);
        const recId = r?.receiptId || null;
        if (!reqId || !recId) return;

        const createdAt = r?.createdAt ? new Date(r.createdAt).getTime() : 0;

        if (!map[reqId] || createdAt > (map[reqId].createdAt || 0)) {
          map[reqId] = { receiptId: recId, createdAt };
        }
      });

      setPaidMap(map);
    } catch (e) {
      console.error("fetchBuyerReceipts error:", e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) return;

      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Error deleting request:", err);
    }
  };

  const isPaidRequest = (reqId) => !!paidMap[String(reqId)];

  const activeRequests = useMemo(
    () => requests.filter((r) => !isPaidRequest(r._id)),
    [requests, paidMap]
  );

  const historyRequests = useMemo(() => {
    const paid = requests.filter((r) => isPaidRequest(r._id));
    return paid.sort((a, b) => {
      const ta = paidMap[String(a._id)]?.createdAt || 0;
      const tb = paidMap[String(b._id)]?.createdAt || 0;
      return tb - ta;
    });
  }, [requests, paidMap]);

  const openRequestsCount = activeRequests.length;

  const activeOffersCount = useMemo(() => {
    return activeRequests.reduce((sum, r) => sum + (bidsCount[r._id] || 0), 0);
  }, [activeRequests, bidsCount]);

  // ✅ Only search (no category dropdown). You can still search by category text if you type it.
  const filteredActiveRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeRequests;

    return activeRequests.filter((r) => {
      return (
        String(r?.productName || "").toLowerCase().includes(q) ||
        String(r?.category || "").toLowerCase().includes(q) ||
        String(r?._id || "").toLowerCase().includes(q)
      );
    });
  }, [activeRequests, searchQuery]);

  return (
    <div className="relative min-h-screen w-full text-white overflow-x-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${Galactic1})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-5 pt-32 pb-28">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-2xl border border-cyan-500/30 bg-[#0B001F]/85 hover:bg-[#0B001F] transition p-2.5 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-cyan-200" />
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-cyan-200">Buyer Dashboard</h1>
            {loading ? <p className="mt-1 text-xs text-white/60">Loading...</p> : null}
          </div>

          <button
            onClick={() => navigate("/createrequest")}
            className="rounded-2xl border border-cyan-500/30 bg-[#0B001F]/85 hover:bg-[#0B001F] transition p-2.5 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
            aria-label="Place New Request"
            title="Place New Request"
          >
            <Plus className="w-5 h-5 text-cyan-200" />
          </button>
        </div>

        {/* Search Panel (no category dropdown) */}
        <div
          className="
            mt-8
            bg-[#0B001F]/90
            border border-cyan-500/30
            shadow-[0_0_35px_rgba(34,211,238,0.35)]
            rounded-3xl
            p-5
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-100">Find a request</p>
              <p className="text-xs text-white/55 mt-1">
                Search your requests by name, ID, or category text.
              </p>
            </div>

            <span className="text-[11px] text-white/55">
              Showing{" "}
              <span className="text-cyan-200 font-semibold">{filteredActiveRequests.length}</span>{" "}
              / {activeRequests.length}
            </span>
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300/80" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my requests…"
              aria-label="Search my requests"
              title="Search my requests"
              className="w-full bg-[#0a0128] pl-10 pr-4 py-3 rounded-xl border border-cyan-700 focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div
            className="
              bg-[#0B001F]/90
              border border-cyan-500/30
              shadow-[0_0_28px_rgba(34,211,238,0.25)]
              rounded-3xl
              p-5
            "
          >
            <p className="text-xs text-white/70">Open Requests</p>
            <p className="text-3xl font-bold text-cyan-200 mt-2">{openRequestsCount}</p>
          </div>

          <div
            className="
              bg-[#0B001F]/90
              border border-fuchsia-500/20
              shadow-[0_0_28px_rgba(217,70,239,0.18)]
              rounded-3xl
              p-5
            "
          >
            <p className="text-xs text-white/70">Active Offers</p>
            <p className="text-3xl font-bold text-fuchsia-200 mt-2">{activeOffersCount}</p>
          </div>
        </div>

        {/* Header */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-cyan-100">My Active Offers</h2>
            <p className="text-xs text-white/55 mt-1">
              Review bids and pick your winner when ready.
            </p>
          </div>

          <button
            onClick={() => navigate("/createrequest")}
            className="
              inline-flex items-center gap-2
              bg-[#0B001F]/90
              border border-cyan-500/30
              text-yellow-300
              px-4 py-2
              rounded-xl
              hover:bg-[#0B001F]
              transition
              shadow-[0_0_20px_rgba(34,211,238,0.22)]
            "
          >
            <Plus className="w-4 h-4" />
            Place New Request
          </button>
        </div>

        {/* Active cards */}
        <div className="mt-5 flex flex-col gap-5">
          {activeRequests.length === 0 ? (
            <div
              className="
                bg-[#0B001F]/90
                border border-cyan-500/20
                rounded-3xl
                p-6
                text-white/70
                shadow-[0_0_20px_rgba(34,211,238,0.18)]
              "
            >
              No active offers right now.
            </div>
          ) : filteredActiveRequests.length === 0 ? (
            <div
              className="
                bg-[#0B001F]/90
                border border-cyan-500/20
                rounded-3xl
                p-6
                text-white/70
                shadow-[0_0_20px_rgba(34,211,238,0.18)]
              "
            >
              No matches for that search.
            </div>
          ) : (
            filteredActiveRequests.map((req) => {
              const meta = bidMeta[req._id] || {};
              const lowestText =
                meta.lowest !== undefined && meta.lowest !== null ? money(meta.lowest) : null;

              return (
                <div
                  key={req._id}
                  className="
                    bg-[#0B001F]/90
                    border border-cyan-500/25
                    shadow-[0_0_30px_rgba(34,211,238,0.20)]
                    rounded-3xl
                    p-6
                  "
                >
                  <p className="text-xs text-white/70">
                    {req.category} • x{req.quantity}
                  </p>

                  <h3 className="text-xl font-bold text-white mt-1">{req.productName}</h3>

                  <p className="text-sm text-white/80 mt-3">
                    Lowest offer:{" "}
                    <span className="text-orange-200 font-semibold">
                      {lowestText || "No offers yet"}
                    </span>
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/requests/${req._id}/acceptbid`)}
                      className="
                        flex-1
                        bg-cyan-500 hover:bg-cyan-400
                        text-black font-semibold
                        py-2.5
                        rounded-xl
                        shadow-[0_0_20px_rgba(34,211,238,0.35)]
                        transition
                      "
                    >
                      View Offers
                    </button>

                    <button
                      onClick={() => handleDelete(req._id)}
                      className="
                        border border-red-500/40
                        text-red-200
                        bg-red-500/10 hover:bg-red-500/15
                        px-4 py-2.5
                        rounded-xl
                        transition
                      "
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Purchase History */}
        <div className="mt-12">
          <h2 className="text-lg font-bold text-cyan-100">Purchase History</h2>
          <p className="text-xs text-white/55 mt-1">
            Paid requests are archived here with their receipt.
          </p>

          <div className="mt-5 flex flex-col gap-5">
            {historyRequests.length === 0 ? (
              <div
                className="
                  bg-[#0B001F]/90
                  border border-cyan-500/20
                  rounded-3xl
                  p-6
                  text-white/70
                  shadow-[0_0_20px_rgba(34,211,238,0.18)]
                "
              >
                No purchases yet.
              </div>
            ) : (
              historyRequests.map((req) => {
                const receiptId = paidMap[String(req._id)]?.receiptId || null;

                return (
                  <div
                    key={req._id}
                    className="
                      bg-[#0B001F]/90
                      border border-emerald-500/25
                      shadow-[0_0_26px_rgba(16,185,129,0.18)]
                      rounded-3xl
                      p-6
                    "
                  >
                    <p className="text-xs text-white/70">
                      {req.category} • x{req.quantity}
                    </p>

                    <h3 className="text-xl font-bold text-white mt-1">{req.productName}</h3>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-emerald-200 text-sm font-semibold">Status: PAID</span>
                      <span className="text-xs text-white/70">
                        Receipt: <span className="text-white">{receiptId || "—"}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => receiptId && navigate(`/receipt/${receiptId}`)}
                      disabled={!receiptId}
                      className="
                        mt-5 w-full inline-flex items-center justify-center gap-2
                        bg-[#0a0128]
                        border border-cyan-700
                        text-cyan-200
                        py-2.5
                        rounded-xl
                        hover:bg-[#0b0230]
                        transition
                        disabled:opacity-50
                      "
                    >
                      <ReceiptText className="w-4 h-4" />
                      View Receipt
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
