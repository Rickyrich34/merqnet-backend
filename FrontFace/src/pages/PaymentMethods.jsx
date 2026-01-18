console.log("STRIPE ENV =", import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CreditCard,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import Galactic1 from "../assets/Galactic1.png";

// Stripe
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

// ✅ FIX: use Vercel/Vite env var, fallback to localhost
const API = (() => {
  const raw = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return String(raw).trim().replace(/\/+$/, "");
})();

// ✅ Put this in .env and restart Vite:
// VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
const STRIPE_PK = import.meta?.env?.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

// -------------------------
// helpers
// -------------------------
function getToken() {
  return localStorage.getItem("userToken") || localStorage.getItem("token") || "";
}

function authHeaders() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

function formatCurrency(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount ?? "");
  return n.toLocaleString("en-US");
}

// -------------------------
// Shared UI wrapper (no Stripe hooks here)
// -------------------------
function PageShell({ title, subtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full text-white overflow-x-hidden bg-black">
      {/* Galaxy background */}
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
        <div className="absolute inset-0 bg-black/25" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 600px at 20% 10%, rgba(255,140,0,0.12), transparent 55%), radial-gradient(900px 650px at 80% 25%, rgba(0,255,255,0.10), transparent 60%), radial-gradient(900px 700px at 50% 85%, rgba(255,0,255,0.08), transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto pt-32 px-6 pb-20 space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/15 bg-[#0b0a1c]/70 hover:bg-[#0b0a1c]/85 transition backdrop-blur-md text-white/80 hover:text-white"
          aria-label="Back"
          title="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white/95">{title}</h1>
          <p className="mt-1 text-xs text-white/70">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

// -------------------------
// Card list + summary loader (no Stripe hooks)
// -------------------------
function usePaymentData(bidIdFromRoute) {
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsErr, setCardsErr] = useState("");

  const [bid, setBid] = useState(null);
  const [request, setRequest] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryErr, setSummaryErr] = useState("");

  const loadCards = async () => {
    try {
      setCardsLoading(true);
      setCardsErr("");

      const res = await fetch(`${API}/api/payments/cards`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCardsErr(data?.message || "Error loading cards");
        setCards([]);
        return;
      }

      setCards(Array.isArray(data?.cards) ? data.cards : []);
    } catch {
      setCardsErr("Network error loading cards");
      setCards([]);
    } finally {
      setCardsLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!bidIdFromRoute) return;

    try {
      setSummaryLoading(true);
      setSummaryErr("");
      setBid(null);
      setRequest(null);

      const bidRes = await fetch(`${API}/api/bids/${bidIdFromRoute}`, {
        headers: authHeaders(),
      });
      const bidData = await bidRes.json().catch(() => ({}));
      if (!bidRes.ok) {
        setSummaryErr(bidData?.message || "Error loading bid");
        return;
      }
      setBid(bidData);

      const reqId = bidData?.requestId;
      if (!reqId) {
        setSummaryErr("Bid has no requestId");
        return;
      }

      const reqRes = await fetch(`${API}/api/requests/${reqId}`, {
        headers: authHeaders(),
      });
      const reqData = await reqRes.json().catch(() => ({}));
      if (!reqRes.ok) {
        setSummaryErr(reqData?.message || "Error loading request");
        return;
      }
      setRequest(reqData);
    } catch {
      setSummaryErr("Network error loading summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line
  }, [bidIdFromRoute]);

  return {
    cards,
    cardsLoading,
    cardsErr,
    setCardsErr,
    loadCards,

    bid,
    request,
    summaryLoading,
    summaryErr,
  };
}

// -------------------------
// NO STRIPE version (no hooks, no crash)
// -------------------------
function PaymentMethodsNoStripe({ bidIdFromRoute }) {
  const navigate = useNavigate();
  const {
    cards,
    cardsLoading,
    cardsErr,
    setCardsErr,
    loadCards,
    bid,
    request,
    summaryLoading,
    summaryErr,
  } = usePaymentData(bidIdFromRoute);

  const defaultCard = useMemo(() => cards.find((c) => c.isDefault), [cards]);

  const setDefault = async (card) => {
    if (!card?.last4) return;
    try {
      const res = await fetch(`${API}/api/payments/cards/${card.last4}/default`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCardsErr(data?.message || "Failed to set default card");
        return;
      }
      await loadCards();
    } catch {
      setCardsErr("Network error setting default");
    }
  };

  const deleteCard = async (card) => {
    if (!card?.last4) return;
    try {
      const res = await fetch(`${API}/api/payments/cards/${card.last4}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCardsErr(data?.message || "Failed to delete card");
        return;
      }
      await loadCards();
    } catch {
      setCardsErr("Network error deleting card");
    }
  };

  return (
    <PageShell
      title={bidIdFromRoute ? "Proceed to Payment" : "Payment Methods"}
      subtitle={
        bidIdFromRoute
          ? "Stripe key missing. You can view cards/summary but cannot add a card here."
          : "Stripe key missing. You can view/delete cards but cannot add a card here."
      }
    >
      {/* Summary */}
      {bidIdFromRoute && (
        <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
          <div className="flex items-center gap-2 text-white/85 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            Payment Summary
          </div>

          {summaryLoading ? (
            <div className="mt-4 text-white/60 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading summary...
            </div>
          ) : summaryErr ? (
            <div className="mt-4 text-red-400">{summaryErr}</div>
          ) : (
            <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-white/60 text-xs">Bid</div>
                <div className="mt-1 text-white/90 font-semibold break-all">
                  {bid?._id || bidIdFromRoute}
                </div>
                <div className="mt-3 text-white/60 text-xs">Total</div>
                <div className="mt-1 text-orange-200 font-bold text-lg">
                  ${formatCurrency(bid?.totalPrice)}
                </div>
                <div className="mt-3 text-white/60 text-xs">Delivery</div>
                <div className="mt-1 text-white/85">{bid?.deliveryTime || "—"}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-white/60 text-xs">Request</div>
                <div className="mt-1 text-white/90 font-semibold break-all">
                  {request?._id || bid?.requestId || "—"}
                </div>
                <div className="mt-3 text-white/60 text-xs">Product</div>
                <div className="mt-1 text-white/85">
                  {request?.productName || request?.title || "—"}
                </div>
                <div className="mt-3 text-white/60 text-xs">Category</div>
                <div className="mt-1 text-white/85">{request?.category || "—"}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cards */}
      <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
        <div className="flex items-center gap-2 text-white/90 font-semibold">
          <CreditCard className="w-5 h-5 text-cyan-200" />
          Saved Cards
        </div>

        <div className="mt-3 text-red-400 text-sm">
          Missing <span className="font-semibold">VITE_STRIPE_PUBLISHABLE_KEY</span>. Add it to your
          .env and restart Vite to enable Stripe Elements.
        </div>

        {cardsLoading ? (
          <div className="mt-4 text-white/60 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading cards...
          </div>
        ) : cardsErr ? (
          <div className="mt-4 text-red-400">{cardsErr}</div>
        ) : cards.length === 0 ? (
          <div className="mt-4 text-white/60">No cards saved yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {cards.map((c) => (
              <div
                key={`${c.brand}-${c.last4}-${c.exp_month}-${c.exp_year}`}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-sm">
                  <div className="text-white/90 font-semibold">
                    {c.brand || "Card"} •••• {c.last4}
                    {c.isDefault ? (
                      <span className="ml-2 text-xs text-emerald-300 font-semibold">
                        DEFAULT
                      </span>
                    ) : null}
                  </div>
                  <div className="text-white/60 text-xs mt-1">
                    Exp {c.exp_month}/{c.exp_year}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!c.isDefault && (
                    <button
                      onClick={() => setDefault(c)}
                      className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-xs font-semibold"
                    >
                      Set Default
                    </button>
                  )}

                  <button
                    onClick={() => deleteCard(c)}
                    className="px-3 py-2 rounded-lg border border-red-400/20 bg-red-500/10 hover:bg-red-500/15 transition text-xs font-semibold text-red-200 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {bidIdFromRoute && (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-white/80 text-sm font-semibold">Pay Now</div>
            <div className="mt-2 text-xs text-white/60">
              Add Stripe key to enable paying from this page.
            </div>
            <button
              onClick={() => navigate("/payment-methods")}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition"
            >
              Go to Payment Methods
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// -------------------------
// STRIPE version (safe: only used inside <Elements>)
// -------------------------
function PaymentMethodsStripe({ bidIdFromRoute }) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const {
    cards,
    cardsLoading,
    cardsErr,
    setCardsErr,
    loadCards,
    bid,
    request,
    summaryLoading,
    summaryErr,
  } = usePaymentData(bidIdFromRoute);

  const defaultCard = useMemo(() => cards.find((c) => c.isDefault), [cards]);

  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [payOk, setPayOk] = useState("");

  const setDefault = async (card) => {
    if (!card?.last4) return;
    setAddErr("");
    setPayErr("");
    setPayOk("");

    try {
      const res = await fetch(`${API}/api/payments/cards/${card.last4}/default`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCardsErr(data?.message || "Failed to set default card");
        return;
      }
      await loadCards();
    } catch {
      setCardsErr("Network error setting default");
    }
  };

  const deleteCard = async (card) => {
    if (!card?.last4) return;
    setAddErr("");
    setPayErr("");
    setPayOk("");

    try {
      const res = await fetch(`${API}/api/payments/cards/${card.last4}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCardsErr(data?.message || "Failed to delete card");
        return;
      }
      await loadCards();
    } catch {
      setCardsErr("Network error deleting card");
    }
  };

  const addCard = async () => {
    setAddErr("");
    setPayErr("");
    setPayOk("");

    if (!stripe || !elements) {
      setAddErr("Stripe not ready.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setAddErr("Card input not ready.");
      return;
    }

    try {
      setAdding(true);

      const { token, error } = await stripe.createToken(cardElement);
      if (error || !token?.id) {
        setAddErr(error?.message || "Could not tokenize card.");
        return;
      }

      const res = await fetch(`${API}/api/payments/cards`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ tokenId: token.id, makeDefault: true }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddErr(data?.message || "Failed to add card");
        return;
      }

      cardElement.clear();
      await loadCards();
    } catch {
      setAddErr("Network error adding card");
    } finally {
      setAdding(false);
    }
  };

  const payNow = async () => {
    setPayErr("");
    setPayOk("");
    setAddErr("");

    if (!bidIdFromRoute) {
      setPayErr("Missing bidId in route.");
      return;
    }

    const reqId = bid?.requestId || request?._id;
    if (!reqId) {
      setPayErr("Missing requestId for this payment.");
      return;
    }

    if (!defaultCard?.stripeSourceId) {
      setPayErr("No default card set. Add a card and set it as default first.");
      return;
    }

    try {
      setPaying(true);

      const res = await fetch(`${API}/api/payments/pay`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ requestId: reqId, bidId: bidIdFromRoute }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayErr(data?.message || "Payment failed");
        return;
      }

      setPayOk("Payment successful!");
      const receiptId = data?.receiptId;
      if (receiptId) navigate(`/receipt/${receiptId}`);
    } catch {
      setPayErr("Network error processing payment");
    } finally {
      setPaying(false);
    }
  };

  return (
    <PageShell
      title={bidIdFromRoute ? "Proceed to Payment" : "Payment Methods"}
      subtitle={
        bidIdFromRoute
          ? "Confirm your card and pay for the accepted bid."
          : "Manage your saved cards."
      }
    >
      {/* Summary */}
      {bidIdFromRoute && (
        <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
          <div className="flex items-center gap-2 text-white/85 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            Payment Summary
          </div>

          {summaryLoading ? (
            <div className="mt-4 text-white/60 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading summary...
            </div>
          ) : summaryErr ? (
            <div className="mt-4 text-red-400">{summaryErr}</div>
          ) : (
            <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-white/60 text-xs">Bid</div>
                <div className="mt-1 text-white/90 font-semibold break-all">
                  {bid?._id || bidIdFromRoute}
                </div>
                <div className="mt-3 text-white/60 text-xs">Total</div>
                <div className="mt-1 text-orange-200 font-bold text-lg">
                  ${formatCurrency(bid?.totalPrice)}
                </div>
                <div className="mt-3 text-white/60 text-xs">Delivery</div>
                <div className="mt-1 text-white/85">{bid?.deliveryTime || "—"}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-white/60 text-xs">Request</div>
                <div className="mt-1 text-white/90 font-semibold break-all">
                  {request?._id || bid?.requestId || "—"}
                </div>
                <div className="mt-3 text-white/60 text-xs">Product</div>
                <div className="mt-1 text-white/85">
                  {request?.productName || request?.title || "—"}
                </div>
                <div className="mt-3 text-white/60 text-xs">Category</div>
                <div className="mt-1 text-white/85">{request?.category || "—"}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cards + Add */}
      <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
        <div className="flex items-center gap-2 text-white/90 font-semibold">
          <CreditCard className="w-5 h-5 text-cyan-200" />
          Saved Cards
        </div>

        {cardsLoading ? (
          <div className="mt-4 text-white/60 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading cards...
          </div>
        ) : cardsErr ? (
          <div className="mt-4 text-red-400">{cardsErr}</div>
        ) : cards.length === 0 ? (
          <div className="mt-4 text-white/60">No cards saved yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {cards.map((c) => (
              <div
                key={`${c.brand}-${c.last4}-${c.exp_month}-${c.exp_year}`}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-sm">
                  <div className="text-white/90 font-semibold">
                    {c.brand || "Card"} •••• {c.last4}
                    {c.isDefault ? (
                      <span className="ml-2 text-xs text-emerald-300 font-semibold">
                        DEFAULT
                      </span>
                    ) : null}
                  </div>
                  <div className="text-white/60 text-xs mt-1">
                    Exp {c.exp_month}/{c.exp_year}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!c.isDefault && (
                    <button
                      onClick={() => setDefault(c)}
                      className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-xs font-semibold"
                    >
                      Set Default
                    </button>
                  )}

                  <button
                    onClick={() => deleteCard(c)}
                    className="px-3 py-2 rounded-lg border border-red-400/20 bg-red-500/10 hover:bg-red-500/15 transition text-xs font-semibold text-red-200 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Card */}
        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-white/80 text-sm font-semibold">Add a new card</div>

          <div className="mt-3 rounded-lg border border-white/15 bg-[#0b0a1c]/70 p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    color: "#ffffff",
                    fontSize: "14px",
                    "::placeholder": { color: "rgba(255,255,255,0.45)" },
                  },
                },
              }}
            />
          </div>

          {addErr ? <div className="mt-3 text-red-400 text-sm">{addErr}</div> : null}

          <button
            onClick={addCard}
            disabled={adding || !stripe || !elements}
            className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-semibold transition disabled:opacity-50"
          >
            {adding ? "Saving..." : "Save Card"}
          </button>
        </div>
      </div>

      {/* Pay Now */}
      {bidIdFromRoute && (
        <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
          <div className="text-white/90 font-semibold">Pay Now</div>
          <div className="mt-2 text-xs text-white/60">
            You must have a default card saved to complete payment.
          </div>

          {payErr ? <div className="mt-3 text-red-400 text-sm">{payErr}</div> : null}
          {payOk ? <div className="mt-3 text-emerald-300 text-sm">{payOk}</div> : null}

          <button
            onClick={payNow}
            disabled={paying || summaryLoading || !bid || !request}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition disabled:opacity-50"
          >
            {paying ? "Processing..." : "Pay Now"}
          </button>
        </div>
      )}
    </PageShell>
  );
}

// -------------------------
// Page entry
// -------------------------
export default function PaymentMethods() {
  const { bidId } = useParams();

  // ✅ If Stripe PK missing, render NO-Stripe version (no hooks => no crash)
  if (!stripePromise) {
    return <PaymentMethodsNoStripe bidIdFromRoute={bidId || ""} />;
  }

  // ✅ Stripe version safely wrapped
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsStripe bidIdFromRoute={bidId || ""} />
    </Elements>
  );
}
