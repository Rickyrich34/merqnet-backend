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

// -------------------------
// ENV
// -------------------------
const API_BASE = import.meta.env.VITE_API_URL;

// Stripe PK (front)
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Safe stripe init (can be missing in dev)
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

// -------------------------
// Helpers
// -------------------------
function getToken() {
  return localStorage.getItem("userToken") || localStorage.getItem("token") || "";
}

function getUserId() {
  return localStorage.getItem("userId") || "";
}

function money(amount) {
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
    <div className="relative min-h-[100svh] w-full text-white overflow-x-hidden bg-black">
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

      {/* ✅ MOBILE-FIRST: extra bottom padding so fixed bottom bar never covers content */}
      <div className="relative z-10 max-w-5xl mx-auto pt-32 px-6 pb-32 md:pb-20 space-y-8">
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
      const res = await fetch(`${API_BASE}/api/payments/cards`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load cards");
      setCards(Array.isArray(data) ? data : data?.cards || []);
    } catch (e) {
      setCardsErr(e.message || "Failed to load cards");
    } finally {
      setCardsLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!bidIdFromRoute) return;
    try {
      setSummaryLoading(true);
      setSummaryErr("");
      const res = await fetch(`${API_BASE}/api/payments/summary/${bidIdFromRoute}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load summary");
      setBid(data?.bid || null);
      setRequest(data?.request || null);
    } catch (e) {
      setSummaryErr(e.message || "Failed to load summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidIdFromRoute]);

  const defaultCard = useMemo(
    () => cards.find((c) => c.isDefault) || null,
    [cards]
  );

  return {
    cards,
    cardsLoading,
    cardsErr,
    loadCards,
    defaultCard,

    bid,
    request,
    summaryLoading,
    summaryErr,
    loadSummary,
  };
}

// -------------------------
// Shared actions (no Stripe hooks)
// -------------------------
async function apiSetDefault(card) {
  const res = await fetch(`${API_BASE}/api/payments/cards/default`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ stripePaymentMethodId: card.stripePaymentMethodId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to set default");
  return data;
}

async function apiDeleteCard(card) {
  const res = await fetch(`${API_BASE}/api/payments/cards/${card._id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to delete card");
  return data;
}

async function apiPay(bidId) {
  const res = await fetch(`${API_BASE}/api/payments/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ bidId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Payment failed");
  return data;
}

// -------------------------
// NO-Stripe version
// -------------------------
function PaymentMethodsNoStripe({ bidIdFromRoute }) {
  const navigate = useNavigate();

  const {
    cards,
    cardsLoading,
    cardsErr,
    loadCards,
    defaultCard,
    bid,
    request,
    summaryLoading,
    summaryErr,
    loadSummary,
  } = usePaymentData(bidIdFromRoute);

  const [busyId, setBusyId] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [globalErr, setGlobalErr] = useState("");
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [payOk, setPayOk] = useState("");

  const setDefault = async (card) => {
    try {
      setGlobalErr("");
      setBusyId(card._id);
      setBusyAction("default");
      await apiSetDefault(card);
      await loadCards();
    } catch (e) {
      setGlobalErr(e.message || "Failed");
    } finally {
      setBusyId("");
      setBusyAction("");
    }
  };

  const deleteCard = async (card) => {
    try {
      setGlobalErr("");
      setBusyId(card._id);
      setBusyAction("delete");
      await apiDeleteCard(card);
      await loadCards();
    } catch (e) {
      setGlobalErr(e.message || "Failed");
    } finally {
      setBusyId("");
      setBusyAction("");
    }
  };

  const payNow = async () => {
    if (!bidIdFromRoute) return;
    try {
      setPayErr("");
      setPayOk("");
      setPaying(true);

      const data = await apiPay(bidIdFromRoute);

      // If backend returns receiptId, route to it
      const receiptId = data?.receiptId || data?.receipt?._id || data?.receipt?._id;
      if (receiptId) {
        navigate(`/receipt/${receiptId}`);
        return;
      }

      setPayOk("Payment completed.");
      await loadSummary();
    } catch (e) {
      setPayErr(e.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const totalCharged = useMemo(() => {
    const t =
      request?.wholeLotPrice ??
      request?.total ??
      bid?.totalPrice ??
      bid?.price ??
      0;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return n * 1.06;
  }, [bid, request]);

  return (
    <PageShell
      title="Payment Methods"
      subtitle="Add a card and set a default payment method."
    >
      {/* Summary */}
      {bidIdFromRoute ? (
        <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
          <div className="text-white/90 font-semibold">Payment Summary</div>

          {summaryLoading ? (
            <div className="mt-4 text-white/70 flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading summary...
            </div>
          ) : summaryErr ? (
            <div className="mt-4 text-red-400 text-sm">{summaryErr}</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Product</div>
                <div className="mt-1 text-sm font-semibold text-white/90">
                  {request?.productName || "N/A"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Total Charged (incl. 6% MerqNet fee)</div>
                <div className="mt-1 text-sm font-semibold text-emerald-300">
                  {totalCharged != null ? `USD ${money(totalCharged.toFixed(2))}` : "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Cards */}
      <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
        <div className="flex items-center justify-between">
          <div className="text-white/90 font-semibold">Saved Cards</div>

          <button
            onClick={loadCards}
            className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-xs font-semibold"
          >
            Refresh
          </button>
        </div>

        {cardsLoading ? (
          <div className="mt-4 text-white/70 flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading cards...
          </div>
        ) : cardsErr ? (
          <div className="mt-4 text-red-400 text-sm">{cardsErr}</div>
        ) : cards.length === 0 ? (
          <div className="mt-4 text-white/65 text-sm">
            No cards yet. Add one below.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {cards.map((c) => (
              <div
                key={c._id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white/80" />
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-white/90">
                      {(c.brand || "CARD").toUpperCase()} •••• {c.last4}
                    </div>
                    <div className="text-xs text-white/60">
                      Exp {String(c.expMonth).padStart(2, "0")}/{String(c.expYear).slice(-2)}
                      {c.isDefault ? " • Default" : ""}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!c.isDefault && (
                    <button
                      onClick={() => setDefault(c)}
                      disabled={busyId === c._id}
                      className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-xs font-semibold disabled:opacity-50"
                    >
                      {busyId === c._id && busyAction === "default" ? "Setting..." : "Set Default"}
                    </button>
                  )}

                  <button
                    onClick={() => deleteCard(c)}
                    disabled={busyId === c._id}
                    className="px-3 py-2 rounded-lg border border-red-400/20 bg-red-500/10 hover:bg-red-500/15 transition text-xs font-semibold text-red-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {busyId === c._id && busyAction === "delete" ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {globalErr ? <div className="mt-4 text-red-400 text-sm">{globalErr}</div> : null}

        {/* Add Card note */}
        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-white/80 text-sm font-semibold">Add a new card</div>
          <div className="mt-2 text-xs text-white/60">
            Stripe is not available (missing publishable key). Add cards from a Stripe-enabled build.
          </div>
        </div>
      </div>

      {/* Pay Now */}
      {bidIdFromRoute && (
        <>
          <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
            <div className="text-white/90 font-semibold">Pay Now</div>
            <div className="mt-2 text-xs text-white/60">
              You must have a default card saved to complete payment.
            </div>

            {payErr ? <div className="mt-3 text-red-400 text-sm">{payErr}</div> : null}
            {payOk ? <div className="mt-3 text-emerald-300 text-sm">{payOk}</div> : null}

            {/* Desktop button */}
            <div className="mt-4 hidden md:block">
              <button
                onClick={payNow}
                disabled={paying || summaryLoading || !bid || !request || !defaultCard}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition disabled:opacity-50"
              >
                {paying ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>

          {/* ✅ MOBILE FIX: fixed bottom bar so Pay button is ALWAYS visible */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9998] border-t border-white/10 bg-[#0b0a1c]/92 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-4 pt-3 pb-[env(safe-area-inset-bottom)]">
              <button
                onClick={payNow}
                disabled={paying || summaryLoading || !bid || !request || !defaultCard}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition disabled:opacity-50"
              >
                {paying ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

// -------------------------
// Stripe version (hooks allowed)
// -------------------------
function PaymentMethodsStripe({ bidIdFromRoute }) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const {
    cards,
    cardsLoading,
    cardsErr,
    loadCards,
    defaultCard,
    bid,
    request,
    summaryLoading,
    summaryErr,
    loadSummary,
  } = usePaymentData(bidIdFromRoute);

  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  const [busyId, setBusyId] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [globalErr, setGlobalErr] = useState("");

  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [payOk, setPayOk] = useState("");

  const totalCharged = useMemo(() => {
    const t =
      request?.wholeLotPrice ??
      request?.total ??
      bid?.totalPrice ??
      bid?.price ??
      0;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return n * 1.06;
  }, [bid, request]);

  const addCard = async () => {
    if (!stripe || !elements) return;

    try {
      setAdding(true);
      setAddErr("");

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card input not ready");

      // Create PM
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) throw new Error(error.message);

      // Send PM to backend to attach + store
      const res = await fetch(`${API_BASE}/api/payments/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to add card");

      await loadCards();
      cardElement.clear();
    } catch (e) {
      setAddErr(e.message || "Failed to add card");
    } finally {
      setAdding(false);
    }
  };

  const setDefault = async (card) => {
    try {
      setGlobalErr("");
      setBusyId(card._id);
      setBusyAction("default");
      await apiSetDefault(card);
      await loadCards();
    } catch (e) {
      setGlobalErr(e.message || "Failed");
    } finally {
      setBusyId("");
      setBusyAction("");
    }
  };

  const deleteCard = async (card) => {
    try {
      setGlobalErr("");
      setBusyId(card._id);
      setBusyAction("delete");
      await apiDeleteCard(card);
      await loadCards();
    } catch (e) {
      setGlobalErr(e.message || "Failed");
    } finally {
      setBusyId("");
      setBusyAction("");
    }
  };

  const payNow = async () => {
    if (!bidIdFromRoute) return;
    try {
      setPayErr("");
      setPayOk("");
      setPaying(true);

      const data = await apiPay(bidIdFromRoute);

      const receiptId = data?.receiptId || data?.receipt?._id || data?.receipt?._id;
      if (receiptId) {
        navigate(`/receipt/${receiptId}`);
        return;
      }

      setPayOk("Payment completed.");
      await loadSummary();
    } catch (e) {
      setPayErr(e.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <PageShell
      title="Payment Methods"
      subtitle="Add a card and set a default payment method."
    >
      {/* Summary */}
      {bidIdFromRoute ? (
        <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
          <div className="text-white/90 font-semibold">Payment Summary</div>

          {summaryLoading ? (
            <div className="mt-4 text-white/70 flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading summary...
            </div>
          ) : summaryErr ? (
            <div className="mt-4 text-red-400 text-sm">{summaryErr}</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Product</div>
                <div className="mt-1 text-sm font-semibold text-white/90">
                  {request?.productName || "N/A"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Total Charged (incl. 6% MerqNet fee)</div>
                <div className="mt-1 text-sm font-semibold text-emerald-300">
                  {totalCharged != null ? `USD ${money(totalCharged.toFixed(2))}` : "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Cards */}
      <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
        <div className="flex items-center justify-between">
          <div className="text-white/90 font-semibold">Saved Cards</div>

          <button
            onClick={loadCards}
            className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-xs font-semibold"
          >
            Refresh
          </button>
        </div>

        {cardsLoading ? (
          <div className="mt-4 text-white/70 flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading cards...
          </div>
        ) : cardsErr ? (
          <div className="mt-4 text-red-400 text-sm">{cardsErr}</div>
        ) : cards.length === 0 ? (
          <div className="mt-4 text-white/65 text-sm">
            No cards yet. Add one below.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {cards.map((c) => (
              <div
                key={c._id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white/80" />
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-white/90">
                      {(c.brand || "CARD").toUpperCase()} •••• {c.last4}
                    </div>
                    <div className="text-xs text-white/60">
                      Exp {String(c.expMonth).padStart(2, "0")}/{String(c.expYear).slice(-2)}
                      {c.isDefault ? " • Default" : ""}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!c.isDefault && (
                    <button
                      onClick={() => setDefault(c)}
                      disabled={busyId === c._id}
                      className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-xs font-semibold disabled:opacity-50"
                    >
                      {busyId === c._id && busyAction === "default" ? "Setting..." : "Set Default"}
                    </button>
                  )}

                  <button
                    onClick={() => deleteCard(c)}
                    disabled={busyId === c._id}
                    className="px-3 py-2 rounded-lg border border-red-400/20 bg-red-500/10 hover:bg-red-500/15 transition text-xs font-semibold text-red-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {busyId === c._id && busyAction === "delete" ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {globalErr ? <div className="mt-4 text-red-400 text-sm">{globalErr}</div> : null}

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
        <>
          <div className="rounded-2xl border border-white/20 bg-[#0b0a1c]/88 backdrop-blur-md p-6">
            <div className="text-white/90 font-semibold">Pay Now</div>
            <div className="mt-2 text-xs text-white/60">
              You must have a default card saved to complete payment.
            </div>

            {payErr ? <div className="mt-3 text-red-400 text-sm">{payErr}</div> : null}
            {payOk ? <div className="mt-3 text-emerald-300 text-sm">{payOk}</div> : null}

            {/* Desktop button */}
            <div className="mt-4 hidden md:block">
              <button
                onClick={payNow}
                disabled={paying || summaryLoading || !bid || !request}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition disabled:opacity-50"
              >
                {paying ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>

          {/* ✅ MOBILE FIX: fixed bottom bar so Pay button is ALWAYS visible */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9998] border-t border-white/10 bg-[#0b0a1c]/92 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-4 pt-3 pb-[env(safe-area-inset-bottom)]">
              <button
                onClick={payNow}
                disabled={paying || summaryLoading || !bid || !request}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition disabled:opacity-50"
              >
                {paying ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </>
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
