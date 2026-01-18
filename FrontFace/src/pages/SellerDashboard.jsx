import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  User,
  Filter,
  Briefcase,
  MapPin,
  Package,
  Trophy,
  TrendingDown,
  Minus,
} from "lucide-react";

import Galactic1 from "../assets/Galactic1.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CATEGORY_OPTIONS = [
  "All Categories",
  "Construction & Industrial",
  "Technology & Electronics",
  "Medical & Laboratory Equipment",
  "Home & Garden",
  "Automotive & Parts",
  "Sports & Outdoors",
  "Office & Business Supplies",
  "Food & Beverage Supplies",
  "Clothing & Textiles",
  "Beauty & Personal Care",
  "Entertainment & Media",
  "Services",
  "Other",
];

function formatShipping(addr) {
  if (!addr) return null;

  // Support both shapes:
  // shippingAddress: { street, city, state, country, postalCode }
  // or shippingAddress: { streetAddress, city, state, country, postalCode }
  const street = addr.street || addr.streetAddress || "";
  const city = addr.city || "";
  const state = addr.state || "";
  const country = addr.country || "";
  const postal = addr.postalCode || addr.zip || "";

  const line1 = [city, state].filter(Boolean).join(", ");
  const line2 = [country, postal].filter(Boolean).join(" ");

  const compact = [line1, line2].filter(Boolean).join(" • ");
  const full = [street, compact].filter(Boolean).join(" — ");

  return full || compact || null;
}

function getToken() {
  return localStorage.getItem("userToken") || localStorage.getItem("token") || "";
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function formatMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `$${x.toLocaleString("en-US")}`;
}

const SellerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // requestId -> { bestPrice, myPrice, status, bestSellerEmail }
  const [offerMap, setOfferMap] = useState({});
  const [offersLoading, setOffersLoading] = useState(false);

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const API = `${API_BASE_URL}/api/requests`;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!userId) {
          setRequests([]);
          return;
        }

        const isAll = selectedCategory === "All Categories";
        const url = isAll
          ? `${API}/filtered/${userId}`
          : `${API}/filtered/${userId}?category=${encodeURIComponent(selectedCategory)}`;

        const res = await axios.get(url);
        setRequests(res.data.requests || []);
      } catch (error) {
        console.error("Error loading seller dashboard:", error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, selectedCategory, API]);

  const visibleRequests = useMemo(() => {
    return (requests || []).filter((req) => req?.clientID?._id !== userId);
  }, [requests, userId]);

  const matchingCount = visibleRequests.length;

  // Load best offer + my offer per request (seller competition UI)
  useEffect(() => {
    const loadOffers = async () => {
      try {
        if (!userId || visibleRequests.length === 0) {
          setOfferMap({});
          return;
        }

        setOffersLoading(true);

        const results = await Promise.all(
          visibleRequests.map(async (r) => {
            try {
              const res = await axios.get(`${API_BASE_URL}/api/bids/request/${r._id}`, {
                headers: authHeaders(),
              });
              const bids = Array.isArray(res.data) ? res.data : [];

              // best = lowest totalPrice
              const withPrice = bids
                .map((b) => ({ b, price: safeNumber(b?.totalPrice) }))
                .filter((x) => x.price > 0);

              const best = withPrice.sort((a, b) => a.price - b.price)[0] || null;
              const myBids = bids
                .filter((b) => String(b?.sellerId?._id || b?.sellerId) === String(userId))
                .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

              const myLatest = myBids[0] || null;

              const bestPrice = best ? best.price : 0;
              const myPrice = myLatest ? safeNumber(myLatest?.totalPrice) : 0;
              const bestSellerEmail = best?.b?.sellerId?.email || "";

              let status = "NO_OFFER";
              if (bestPrice > 0 && myPrice > 0) {
                status = bestPrice === myPrice ? "WINNING" : "OUTBID";
              } else if (myPrice > 0) {
                status = "WINNING"; // only offer so far
              } else if (bestPrice > 0) {
                status = "NO_OFFER";
              }

              return [String(r._id), { bestPrice, myPrice, status, bestSellerEmail }];
            } catch {
              return [String(r._id), { bestPrice: 0, myPrice: 0, status: "NO_OFFER", bestSellerEmail: "" }];
            }
          })
        );

        const map = results.reduce((acc, [k, v]) => {
          acc[k] = v;
          return acc;
        }, {});

        setOfferMap(map);
      } finally {
        setOffersLoading(false);
      }
    };

    loadOffers();
  }, [userId, visibleRequests]);

  if (loading) return <p className="text-white pt-44">Loading...</p>;

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
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 600px at 18% 12%, rgba(34,211,238,0.12), transparent 58%), radial-gradient(900px 650px at 82% 24%, rgba(245,158,11,0.10), transparent 62%), radial-gradient(900px 700px at 50% 90%, rgba(148,163,184,0.06), transparent 65%)",
          }}
        />
      </div>

      {/* Safe for fixed navbar */}
      <div className="relative z-10 max-w-xl mx-auto px-5 pt-44 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="
              rounded-2xl
              border border-cyan-400/25
              bg-[#0B001F]/80
              hover:bg-[#0B001F]
              transition
              p-2.5
              shadow-[0_0_18px_rgba(34,211,238,0.14)]
              backdrop-blur-md
            "
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-cyan-200" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-200" />
              <div className="font-semibold tracking-wide text-white/90">MerqNet</div>
            </div>

            <h1 className="mt-2 text-[22px] font-semibold text-white/95">
              Seller Dashboard
            </h1>

            <div className="mt-2 inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-amber-400/25 bg-[#0B001F]/75 text-white/75">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.7)]" />
              SELLER MODE — submit offers on matched requests
            </div>
          </div>

          <div className="w-10" />
        </div>

        {/* Category filter */}
        <div
          className="
            mt-6
            rounded-3xl
            border border-cyan-400/20
            bg-[#0B001F]/82
            p-5
            backdrop-blur-md
            shadow-[0_0_30px_rgba(34,211,238,0.10)]
          "
        >
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Filter className="w-4 h-4 text-cyan-200" />
            <span className="font-semibold">Category Filter</span>
          </div>

          <div className="mt-3 relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="
                w-full
                bg-[#0a0128]
                px-4 py-3 pr-10
                rounded-xl
                border border-cyan-700/70
                focus:ring-2 focus:ring-cyan-400
                appearance-none
                text-white
              "
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c} className="bg-[#050017] text-white">
                  {c}
                </option>
              ))}
            </select>

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-200 pointer-events-none">
              ▼
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div
            className="
              rounded-3xl
              border border-cyan-400/25
              bg-[#0B001F]/82
              p-5
              shadow-[0_0_28px_rgba(34,211,238,0.12)]
            "
          >
            <p className="text-xs text-white/70">Matching Requests</p>
            <span className="text-3xl font-bold text-cyan-200">{matchingCount}</span>
          </div>

          <div
            className="
              rounded-3xl
              border border-amber-400/25
              bg-[#0B001F]/82
              p-5
              shadow-[0_0_28px_rgba(245,158,11,0.10)]
            "
          >
            <p className="text-xs text-white/70">Quick Tip</p>
            <p className="text-sm font-semibold text-amber-100 mt-2 leading-snug">
              Verify quantity + shipping before submitting your offer.
            </p>
          </div>
        </div>

        {/* Requests */}
        <div className="mt-7 flex flex-col gap-5">
          {visibleRequests.length === 0 ? (
            <div
              className="
                rounded-3xl
                border border-white/15
                bg-[#0B001F]/78
                p-6
                text-white/70
              "
            >
              No matching requests right now.
            </div>
          ) : (
            visibleRequests.map((req) => {
              const shipText = formatShipping(req?.shippingAddress);
              const offer = offerMap?.[String(req._id)] || {
                bestPrice: 0,
                myPrice: 0,
                status: "NO_OFFER",
                bestSellerEmail: "",
              };

              const statusUI = (() => {
                if (offersLoading) {
                  return (
                    <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-white/10 bg-black/20 text-white/60">
                      <Minus className="w-3.5 h-3.5" /> Checking offers...
                    </span>
                  );
                }

                if (offer.status === "WINNING") {
                  return (
                    <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-200 font-semibold">
                      <Trophy className="w-3.5 h-3.5" /> WINNING
                    </span>
                  );
                }

                if (offer.status === "OUTBID") {
                  return (
                    <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-red-400/25 bg-red-500/10 text-red-200 font-semibold">
                      <TrendingDown className="w-3.5 h-3.5" /> OUTBID
                    </span>
                  );
                }

                return (
                  <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-white/10 bg-black/20 text-white/60">
                    <Minus className="w-3.5 h-3.5" /> NO OFFER YET
                  </span>
                );
              })();

              return (
                <div
                  key={req._id}
                  className="
                    rounded-3xl
                    border border-white/15
                    bg-[#0B001F]/80
                    p-6
                    shadow-[0_0_26px_rgba(2,6,23,0.55)]
                  "
                >
                  <p className="text-xs text-white/70">
                    {req.category} •{" "}
                    <span className="text-white/85 font-semibold">
                      {req.productName}
                    </span>
                  </p>

                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {req.productName}
                  </h3>

                  {/* Offer status (seller competition) */}
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    {statusUI}

                    <div className="text-[11px] text-white/70 text-right">
                      <div>
                        Best offer:{" "}
                        <span className="text-amber-200 font-semibold">
                          {formatMoney(offer.bestPrice)}
                        </span>
                      </div>
                      <div>
                        Your offer:{" "}
                        <span className="text-cyan-200 font-semibold">
                          {offer.myPrice > 0 ? formatMoney(offer.myPrice) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buyer */}
                  <p className="mt-2 text-xs text-white/70 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-amber-200" />
                    {req.clientID?.fullName || "Unknown"}
                  </p>

                  {/* Quantity */}
                  <p className="mt-2 text-xs text-white/75 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-cyan-200" />
                    Qty:{" "}
                    <span className="text-white/90 font-semibold">
                      {req.quantity ?? "N/A"}
                    </span>
                  </p>

                  {/* Shipping */}
                  <p className="mt-2 text-xs text-white/75 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-200" />
                    Ships to:{" "}
                    <span className="text-white/90 font-semibold">
                      {shipText || "Not provided"}
                    </span>
                  </p>

                  <button
                    onClick={() => navigate(`/submitbid/${req._id}`)}
                    className="
                      mt-4
                      w-full
                      bg-amber-400 hover:bg-amber-300
                      text-black font-semibold
                      py-3
                      rounded-xl
                      shadow-[0_0_22px_rgba(245,158,11,0.22)]
                      transition
                    "
                  >
                    Submit Offer
                  </button>

                  <div className="mt-4 text-[11px] text-white/55">
                    Request ID: <span className="text-white/80">{req._id}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reminder */}
        <div
          className="
            mt-10
            bg-[#0B001F]/75
            border border-amber-400/20
            rounded-3xl
            p-5
            text-xs text-white/65
          "
        >
          <span className="text-amber-200 font-semibold">Seller reminder:</span>{" "}
          You only submit offers. The buyer chooses the winner.
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
