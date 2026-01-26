// src/pages/SellerBids.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import navLogo from "../assets/logopic2.png"; // 🔥 LOGO OFICIAL

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SellerBids = () => {
  const navigate = useNavigate();
  const sellerId = localStorage.getItem("userId");

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sellerId) {
      navigate("/login");
      return;
    }

    const fetchBids = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bids/seller/${sellerId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load your bids");
        }

        const data = await res.json();
        setBids(Array.isArray(data) ? data : data.bids || []);
      } catch (err) {
        console.error(err);
        setError("Could not load your bids. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [sellerId, navigate]);

  const handleBackToDashboard = () => {
    navigate("/sellerdashboard");
  };

  const handleViewRequestBids = (requestId) => {
    navigate(`/requests/${requestId}/bids`);
  };

  const handleImproveBid = (bid) => {
    navigate(`/submitbid/${bid.requestId?._id || bid.requestId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-4 border-teal-400 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-teal-100 font-medium tracking-wide">
            Loading your bids...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-900/70 border border-red-500/50 rounded-2xl p-6 max-w-lg w-full">
          <p className="text-red-300 font-semibold mb-2">Error</p>
          <p className="text-slate-100 mb-4">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold transition"
          >
            Back to Seller Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hasBids = bids && bids.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pt-24">

      {/* 🔥 LOGO SUPERIOR — MISMO ESTILO QUE TODAS LAS PÁGINAS */}
      <div className="flex justify-end pr-6 -mt-10 mb-4">
        <img
          src={navLogo}
          alt="MerqNet Logo"
          className="w-28 md:w-32 opacity-95 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]"
        />
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-teal-400">
              MerqNet · Seller
            </p>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              My Active Bids
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              View the requests where you’ve already submitted an offer.
            </p>
          </div>

          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold border border-slate-600 transition"
          >
            ← Back to Seller Dashboard
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-12">
        {!hasBids ? (
          <div className="mt-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-slate-200 mb-2">
              You haven’t submitted any bids yet.
            </p>
            <p className="text-sm text-slate-400 mb-4">
              Browse active buyer requests in your Seller Dashboard and start
              bidding to appear here.
            </p>
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold transition"
            >
              Go to Seller Dashboard
            </button>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    Request
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    Your Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    Your Whole Lot Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    Delivery Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {bids.map((bid) => {
                  const req = bid.requestId || {};
                  return (
                    <tr
                      key={bid._id}
                      className="hover:bg-slate-900/70 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div>
                          <p className="font-semibold text-slate-100">
                            {req.productName || "Request"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Category: {req.category || "N/A"} · Quantity:{" "}
                            {req.quantity ?? "N/A"}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <p className="font-semibold text-emerald-300">
                          {typeof bid.unitPrice === "number"
                            ? `$${bid.unitPrice.toFixed(2)}`
                            : bid.unitPrice || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <p className="font-semibold text-sky-300">
                          {typeof (bid.totalPrice || bid.wholeLotPrice) === "number"
                            ? `$${(bid.totalPrice || bid.wholeLotPrice).toFixed(2)}`
                            : "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <p className="text-slate-100">
                          {bid.deliveryTime || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            bid.accepted
                              ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/40"
                              : "bg-sky-400/10 text-sky-300 border border-sky-400/40"
                          }`}
                        >
                          {bid.accepted ? "Accepted" : "Pending"}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleViewRequestBids(req._id || bid.requestId)
                            }
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-teal-500/60 text-teal-200 transition"
                          >
                            View Bids
                          </button>
                          <button
                            onClick={() => handleImproveBid(bid)}
                            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-xs font-semibold text-slate-950 shadow-sm shadow-teal-500/40 transition"
                          >
                            Improve Bid
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerBids;
