import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import RatingModal from "../components/RatingModal";

const API_BASE = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem("userToken") || localStorage.getItem("token") || "";
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

function formatMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "N/A";
  return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function resolveAmount(receipt) {
  if (!receipt) return null;

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

function merqnetBreakdownFromTotal(total) {
  const t = toNumber(total);
  if (t == null) return null;

  const subtotalRaw = t / 1.06;
  const subtotal = Number(subtotalRaw.toFixed(2));
  const fee = Number((t - subtotal).toFixed(2));
  const totalCharged = Number(t.toFixed(2));

  return { subtotal, fee, totalCharged };
}

function resolvePaymentMethod(receipt) {
  if (!receipt) return null;

  const pmObj = receipt.paymentMethod || receipt.payment_method || receipt.payment?.paymentMethod;
  const stripeLikeCard =
    receipt.payment_method_details?.card ||
    receipt.paymentMethodDetails?.card ||
    receipt.payment?.payment_method_details?.card;

  const brand =
    pmObj?.brand || receipt.cardBrand || receipt.brand || stripeLikeCard?.brand || null;

  const last4 =
    pmObj?.last4 || receipt.cardLast4 || receipt.last4 || stripeLikeCard?.last4 || null;

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

  const funding = pmObj?.funding || stripeLikeCard?.funding || null;
  const country = pmObj?.country || stripeLikeCard?.country || null;

  if (!brand && !last4 && !expMonth && !expYear && !funding && !country) return null;

  return { brand, last4, expMonth, expYear, funding, country };
}

export default function ReceiptView() {
  const { receiptId } = useParams();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ratingOpen, setRatingOpen] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [completing, setCompleting] = useState(false);

  const token = useMemo(() => getToken(), []);
  const userId = useMemo(() => getUserId(), []);

  const statusLower = String(receipt?.status || "").toLowerCase();
  const isCompleted = statusLower === "completed";
  const isPaid = statusLower === "paid";
  const isRated = Boolean(receipt?.rating?.value);

  const isBuyer = useMemo(() => {
    if (!receipt || !userId) return false;
    const buyerId = pickId(receipt.buyerId);
    return String(buyerId) === String(userId);
  }, [receipt, userId]);

  const amountValue = useMemo(() => resolveAmount(receipt), [receipt]);
  const currencyCode = String(receipt?.currency || receipt?.payment?.currency || "usd").toUpperCase();

  const amountDisplay = Number.isFinite(amountValue)
    ? amountValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "N/A";

  const breakdown = useMemo(() => merqnetBreakdownFromTotal(amountValue), [amountValue]);

  const formattedDate = receipt?.createdAt
    ? new Date(receipt.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      })
    : "N/A";

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
  }, [receiptId, token]);

  useEffect(() => {
    if (!receipt) return;
    if (isBuyer && isCompleted && !isRated) setRatingOpen(true);
  }, [receipt, isBuyer, isCompleted, isRated]);

  if (loading) return <div className="text-center text-white mt-20">Loading receipt...</div>;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  const productName =
    receipt?.requestId?.productName ||
    receipt?.requestId?.name ||
    receipt?.productName ||
    "";

  const buyerName = receipt?.buyerId?.fullName || "N/A";
  const sellerName = receipt?.sellerId?.fullName || "N/A";

  const receiptCode = receipt?.receiptId || "N/A";

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-b from-black via-[#050014] to-black text-white px-4 md:px-6 py-10">
      <button
        onClick={() => navigate("/buyer-dashboard")}
        className="fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 text-white text-xl hover:bg-black/80 transition"
      >
        ←
      </button>

      <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-emerald-400 mb-6">Payment Receipt</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-white/10 rounded-xl px-4 py-3">Receipt: {receiptCode}</div>
          <div className="bg-white/10 rounded-xl px-4 py-3">Status: {receipt.status}</div>
          <div className="bg-white/10 rounded-xl px-4 py-3">
            Amount: {currencyCode} {amountDisplay}
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3">Product: {productName}</div>
        </div>

        {breakdown && (
          <div className="bg-white/10 rounded-xl px-4 py-3 mb-6 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(breakdown.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>MerqNet Fee (6%)</span>
              <span>{formatMoney(breakdown.fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-300">
              <span>Total</span>
              <span>{formatMoney(breakdown.totalCharged)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>Buyer: {buyerName}</div>
          <div>Seller: {sellerName}</div>
        </div>
      </div>

      <RatingModal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onSubmit={() => {}}
        loading={submittingRating}
      />
    </div>
  );
}
