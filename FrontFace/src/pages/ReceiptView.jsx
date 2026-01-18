import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import RatingModal from "../components/RatingModal";

const API_BASE = "http://localhost:5000";

function getToken() {
  return (
    localStorage.getItem("userToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

function getUserId() {
  return localStorage.getItem("userId") || "";
}

function pickId(val) {
  if (!val) return "";
  if (typeof val === "object") return String(val._id || "");
  return String(val);
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Try to infer amount from common receipt shapes.
 * Supports:
 * - receipt.amount
 * - receipt.totalPrice
 * - receipt.bidId.totalPrice
 * - receipt.requestId.wholeLotPrice / unitPrice
 * - receipt.payment.amount / receipt.payment.amountPaid
 * - receipt.amountCents / amount_in_cents (auto /100)
 */
function resolveAmount(receipt) {
  if (!receipt) return null;

  // cents-first if provided explicitly
  const cents =
    toNumber(receipt.amountCents) ??
    toNumber(receipt.amount_in_cents) ??
    toNumber(receipt.payment?.amountCents) ??
    toNumber(receipt.payment?.amount_in_cents);

  if (cents != null) return cents / 100;

  const candidates = [
    receipt.amount,
    receipt.amountPaid,
    receipt.totalPrice,
    receipt.price,
    receipt.payment?.amount,
    receipt.payment?.amountPaid,
    receipt.bidId?.totalPrice,
    receipt.bidId?.total_amount,
    receipt.requestId?.wholeLotPrice,
    receipt.requestId?.unitPrice,
  ];

  for (const c of candidates) {
    const n = toNumber(c);
    if (n != null) return n;
  }

  return null;
}

/**
 * Try to resolve a "payment method" summary from common receipt shapes.
 * Supports:
 * - receipt.paymentMethod { brand,last4,expMonth,expYear,funding,country }
 * - receipt.cardBrand/cardLast4/expMonth/expYear
 * - receipt.payment_method_details.card (stripe-like)
 */
function resolvePaymentMethod(receipt) {
  if (!receipt) return null;

  const pmObj = receipt.paymentMethod || receipt.payment_method || receipt.payment?.paymentMethod;

  const stripeLikeCard =
    receipt.payment_method_details?.card ||
    receipt.paymentMethodDetails?.card ||
    receipt.payment?.payment_method_details?.card;

  const brand =
    pmObj?.brand ||
    receipt.cardBrand ||
    receipt.brand ||
    stripeLikeCard?.brand ||
    null;

  const last4 =
    pmObj?.last4 ||
    receipt.cardLast4 ||
    receipt.last4 ||
    stripeLikeCard?.last4 ||
    null;

  const expMonth =
    pmObj?.expMonth ||
    pmObj?.exp_month ||
    receipt.expMonth ||
    receipt.expMonthNumber ||
    stripeLikeCard?.exp_month ||
    null;

  const expYear =
    pmObj?.expYear ||
    pmObj?.exp_year ||
    receipt.expYear ||
    stripeLikeCard?.exp_year ||
    null;

  const funding =
    pmObj?.funding ||
    stripeLikeCard?.funding ||
    null;

  const country =
    pmObj?.country ||
    stripeLikeCard?.country ||
    null;

  // If we have at least brand or last4, we consider it available
  if (!brand && !last4 && !expMonth && !expYear && !funding && !country) return null;

  return { brand, last4, expMonth, expYear, funding, country };
}

export default function ReceiptView() {
  const { receiptId } = useParams();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Rating UI
  const [ratingOpen, setRatingOpen] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Complete UI
  const [completing, setCompleting] = useState(false);

  const token = useMemo(() => getToken(), []);
  const userId = useMemo(() => getUserId(), []);

  const statusLower = String(receipt?.status || "").toLowerCase();
  const isCompleted = statusLower === "completed";
  const isPaid = statusLower === "paid";
  const isRated = Boolean(receipt?.rating?.value);

  // ✅ ROLE CHECK
  const isBuyer = useMemo(() => {
    if (!receipt || !userId) return false;
    const buyerId = pickId(receipt.buyerId);
    return String(buyerId) === String(userId);
  }, [receipt, userId]);

  // ✅ AMOUNT (robust)
  const amountValue = useMemo(() => resolveAmount(receipt), [receipt]);
  const currencyCode = String(receipt?.currency || receipt?.payment?.currency || "usd").toUpperCase();

  const amountDisplay = Number.isFinite(amountValue)
    ? amountValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "N/A";

  const formattedDate = receipt?.createdAt
    ? new Date(receipt.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      })
    : "N/A";

  // ✅ Stripe identifiers (try multiple field names)
  const stripeCharge =
    receipt?.stripeChargeId ||
    receipt?.chargeId ||
    receipt?.stripe?.chargeId ||
    receipt?.payment?.stripeChargeId ||
    "";

  const stripePaymentIntent =
    receipt?.stripePaymentIntentId ||
    receipt?.paymentIntentId ||
    receipt?.stripe?.paymentIntentId ||
    receipt?.payment?.stripePaymentIntentId ||
    "";

  const stripePaymentMethod =
    receipt?.stripePaymentMethodId ||
    receipt?.paymentMethodId ||
    receipt?.stripe?.paymentMethodId ||
    receipt?.payment?.stripePaymentMethodId ||
    "";

  const paymentMethod = useMemo(() => resolvePaymentMethod(receipt), [receipt]);

  const fetchReceipt = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/receipts/${receiptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReceipt(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load receipt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptId, token]);

  // Auto-open rating ONLY for buyer
  useEffect(() => {
    if (!receipt) return;
    if (isBuyer && isCompleted && !isRated) setRatingOpen(true);
  }, [receipt, isBuyer, isCompleted, isRated]);

  const confirmDelivery = async () => {
    setCompleting(true);
    try {
      const res = await axios.patch(
        `${API_BASE}/api/receipts/${receiptId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data?.receipt || res.data;
      setReceipt(updated);

      const newStatus = String(updated?.status || "").toLowerCase();
      if (newStatus !== "completed") await fetchReceipt();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to mark receipt as completed.";
      alert(msg);
    } finally {
      setCompleting(false);
    }
  };

  const submitRating = async ({ value, reasons, comment }) => {
    setSubmittingRating(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/receipts/${receiptId}/rate`,
        { value, reasons, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data?.receipt || res.data;
      setReceipt(updated);
      setRatingOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Rating failed.";
      alert(msg);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return <div className="text-center text-white mt-20">Loading receipt...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-20">{error}</div>;
  }

  const productName =
    receipt?.requestId?.productName ||
    receipt?.requestId?.name ||
    receipt?.productName ||
    "";

  const buyerName = receipt?.buyerId?.fullName || "N/A";
  const sellerName = receipt?.sellerId?.fullName || "N/A";

  const receiptCode = receipt?.receiptId || "N/A";

  const chargeDisplay = stripeCharge && String(stripeCharge).trim() ? stripeCharge : "N/A";
  const intentDisplay = stripePaymentIntent && String(stripePaymentIntent).trim() ? stripePaymentIntent : "N/A";
  const pmIdDisplay = stripePaymentMethod && String(stripePaymentMethod).trim() ? stripePaymentMethod : "N/A";

  const pmLine = paymentMethod
    ? `${paymentMethod.brand ? String(paymentMethod.brand).toUpperCase() : "CARD"}${
        paymentMethod.last4 ? ` •••• ${paymentMethod.last4}` : ""
      }`
    : "Not available";

  const pmMeta = paymentMethod
    ? [
        paymentMethod.expMonth && paymentMethod.expYear
          ? `Exp ${String(paymentMethod.expMonth).padStart(2, "0")}/${String(paymentMethod.expYear).slice(-2)}`
          : null,
        paymentMethod.funding ? String(paymentMethod.funding).toUpperCase() : null,
        paymentMethod.country ? String(paymentMethod.country).toUpperCase() : null,
      ]
        .filter(Boolean)
        .join(" • ")
    : "";

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-b from-black via-[#050014] to-black text-white px-6 py-10">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-emerald-400 mb-6">
            Payment Receipt
          </h1>

          <div className="mt-1 text-right">
            {isRated ? (
              <div className="text-sm text-purple-200/80">
                Rated:{" "}
                <span className="font-bold text-white">
                  {Number(receipt.rating.value).toFixed(1)}
                </span>
                <span className="text-purple-200/70"> / 10</span>
              </div>
            ) : (
              <div className="text-sm text-purple-200/80">
                Rating: Not yet
              </div>
            )}

            {/* ✅ RATE BUTTON — BUYER ONLY */}
            {isBuyer && (
              <button
                onClick={() => {
                  if (!isCompleted)
                    return alert("Receipt must be completed before rating");
                  if (isRated)
                    return alert("This receipt is already rated");
                  setRatingOpen(true);
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-fuchsia-600/80 hover:bg-fuchsia-600 transition text-sm disabled:opacity-50"
                disabled={!isCompleted || isRated}
                title={
                  !isCompleted
                    ? "Complete it first"
                    : isRated
                    ? "Already rated"
                    : "Rate now"
                }
              >
                Rate
              </button>
            )}
          </div>
        </div>

        <div className="bg-white/10 rounded-xl px-4 py-3 mb-6">
          <div className="text-xs text-white/60 mb-1">Product</div>
          <div className="font-semibold">{productName || " "}</div>
        </div>

        {/* ✅ TOP SUMMARY STRIP */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-white/10 rounded-xl px-4 py-3">
            <div className="text-white/60">Receipt ID</div>
            <div className="font-semibold">{receiptCode}</div>
          </div>

          <div className="bg-white/10 rounded-xl px-4 py-3">
            <div className="text-white/60">Status</div>
            <div className="font-semibold">{String(receipt?.status || "N/A")}</div>
          </div>

          <div className="bg-white/10 rounded-xl px-4 py-3">
            <div className="text-white/60">Amount Paid</div>
            <div className="font-semibold text-emerald-300">
              {currencyCode} {amountDisplay}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl px-4 py-3">
            <div className="text-white/60">Payment Method</div>
            <div className="font-semibold">{pmLine}</div>
            {pmMeta ? (
              <div className="text-xs text-white/50 mt-1">{pmMeta}</div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 text-sm">
          <div>
            <div className="text-white/60">Buyer</div>
            <div className="font-semibold">{buyerName}</div>
          </div>

          <div>
            <div className="text-white/60">Seller</div>
            <div className="font-semibold">{sellerName}</div>
          </div>

          <div>
            <div className="text-white/60">Stripe PaymentIntent</div>
            <div className="font-semibold break-all">{intentDisplay}</div>
          </div>

          <div>
            <div className="text-white/60">Stripe Charge</div>
            <div className="font-semibold break-all">{chargeDisplay}</div>
          </div>

          <div>
            <div className="text-white/60">Stripe PaymentMethod</div>
            <div className="font-semibold break-all">{pmIdDisplay}</div>
          </div>

          <div>
            <div className="text-white/60">Date</div>
            <div className="font-semibold">{formattedDate}</div>
          </div>
        </div>

        <div className="mt-6 text-xs text-white/50">
          Keep your Receipt ID for support.
        </div>

        {/* COMPLETE BUTTON (only when paid) */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {isPaid && (
            <button
              onClick={confirmDelivery}
              disabled={completing}
              className="px-4 py-2 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 transition disabled:opacity-60"
            >
              {completing ? "Completing..." : "Confirm Delivery"}
            </button>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onSubmit={submitRating}
        loading={submittingRating}
      />
    </div>
  );
}
