import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Tag,
  Package,
  Ruler,
  FileText,
  DollarSign,
  Truck,
  Upload,
  X,
  MapPin,
  Briefcase,
  PencilLine,
  CheckCircle2,
} from "lucide-react";

import Galactic1 from "../assets/Galactic1.png";

// ✅ Keep your env fallback (works on Railway + local) — matches SellerDashboard approach
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// --- helpers ---
function getToken() {
  return localStorage.getItem("userToken") || localStorage.getItem("token") || "";
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatShipping(addr) {
  if (!addr) return null;

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

// ✅ critical: sanitize price so "$7,000.00" -> 7000, and "" -> NaN
function toMoneyNumber(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return NaN;
  const cleaned = s.replace(/[^\d.-]/g, ""); // remove $ , spaces, etc
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

// ✅ fetch with timeout using AbortController (prevents “stuck loading”)
async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export default function SubmitBid() {
  // Works for BOTH routes: /submitbid/:requestId and /submit-bid/:requestId
  const { requestId } = useParams();
  const navigate = useNavigate();

  const sellerId = localStorage.getItem("userId") || "";

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pricing
  const [unitPrice, setUnitPrice] = useState("");
  const [totalPrice, setTotalPrice] = useState("");

  // Delivery + images (UI keeps them; backend currently only requires prices)
  const [deliveryTime, setDeliveryTime] = useState("");
  const [photos, setPhotos] = useState([]); // File[]
  const photoPreviews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);

  // Existing bid (if any)
  const [myBid, setMyBid] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(true);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoPreviews]);

  useEffect(() => {
    fetchRequestAndMyBid();
    // eslint-disable-next-line
  }, [requestId]);

  const fetchRequestAndMyBid = async () => {
    try {
      setLoading(true);

      if (!API_BASE_URL) {
        setRequest(null);
        return;
      }

      // 1) Load request
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/requests/${requestId}`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        setRequest(null);
        return;
      }

      const reqData = await res.json();
      setRequest(reqData);

      // 2) Load bids for request -> find my bid
      try {
        const bidRes = await fetchWithTimeout(`${API_BASE_URL}/api/bids/request/${requestId}`, {
          headers: authHeaders(),
        });

        if (bidRes.ok) {
          const bids = await bidRes.json();

          const mine =
            Array.isArray(bids) &&
            bids.find((b) => String(b?.sellerId?._id || b?.sellerId) === String(sellerId));

          if (mine) {
            setMyBid(mine);

            // Prefill pricing
            setUnitPrice(String(mine.unitPrice ?? ""));
            setTotalPrice(String(mine.totalPrice ?? ""));

            // Preserve delivery + images (if present)
            setDeliveryTime(String(mine.deliveryTime ?? "Negotiated in chat"));
            const imgs = Array.isArray(mine.images) ? mine.images : [];
            setExistingImages(imgs);

            setShowAdvanced(false);
          } else {
            setMyBid(null);
            setExistingImages([]);
            setShowAdvanced(true);
            setDeliveryTime("Negotiated in chat");
          }
        } else {
          setMyBid(null);
          setExistingImages([]);
          setShowAdvanced(true);
          setDeliveryTime("Negotiated in chat");
        }
      } catch {
        setMyBid(null);
        setExistingImages([]);
        setShowAdvanced(true);
        setDeliveryTime("Negotiated in chat");
      }
    } catch {
      setRequest(null);
      setMyBid(null);
      setExistingImages([]);
      setShowAdvanced(true);
      setDeliveryTime("Negotiated in chat");
    } finally {
      setLoading(false);
    }
  };

  const onPickPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const next = [...photos, ...files].slice(0, 2);
    setPhotos(next);
    e.target.value = "";
  };

  const removePhotoAt = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearExistingImages = () => {
    setExistingImages([]);
  };

  const submitBid = async () => {
    if (!API_BASE_URL) {
      alert("Missing API base URL. Check VITE_API_URL / VITE_API_BASE_URL.");
      return;
    }

    // ✅ parse + validate numbers safely
    const u = toMoneyNumber(unitPrice);
    const t = toMoneyNumber(totalPrice);

    if (!Number.isFinite(u) || !Number.isFinite(t) || u <= 0 || t <= 0) {
      alert("Enter valid Unit Price and Total Lot Price (numbers only).");
      return;
    }

    // Delivery is NOT required by your backend createBid (it sets it itself),
    // but keep UI consistent and prevent empty string.
    const deliverySafe = String(deliveryTime || "Negotiated in chat");

    try {
      setSubmitting(true);

      const isUpdate = !!myBid;

      // Images:
      // - if user picked new photos, send them
      // - else preserve existing images (if any)
      let imagesToSend = [];
      if (photos.length) {
        imagesToSend = await Promise.all(photos.map(fileToBase64));
      } else if (isUpdate && existingImages.length) {
        imagesToSend = existingImages;
      } else {
        imagesToSend = [];
      }

      // ✅ IMPORTANT: backend expects EXACT names: unitPrice + totalPrice
      const payload = {
        // sellerId in body is optional (backend uses token), but leaving it is fine
        sellerId,
        unitPrice: u,
        totalPrice: t,
        deliveryTime: deliverySafe,
        images: imagesToSend,
      };

      const res = await fetchWithTimeout(
        `${API_BASE_URL}/api/bids/request/${requestId}`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        },
        12000
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Show real backend message (most likely "Missing fields")
        alert(data?.message || `Bid submit failed (${res.status})`);
        return;
      }

      alert(isUpdate ? "Offer updated successfully!" : "Offer submitted successfully!");
      navigate("/seller-dashboard");
    } catch (err) {
      // AbortController timeout or network issue
      alert("Server timeout submitting bid. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        Request not found.
      </div>
    );
  }

  const shipText = formatShipping(request?.shippingAddress);

  // Styles
  const fieldCard = "rounded-2xl border border-white/12 bg-[#0a0128]/55 p-4";
  const inputBase =
    "w-full rounded-xl bg-black/55 border border-white/25 px-3 py-2.5 text-sm text-white/90 outline-none " +
    "focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/25 " +
    "placeholder:text-white/35";

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
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-5 pt-40 pb-28">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/seller-dashboard")}
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

          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Briefcase className="w-4 h-4 text-amber-200" />
                <span>MerqNet</span>
              </div>
              <div className="text-lg font-semibold text-white/95">Submit Offer</div>
              <div className="text-xs text-white/60">
                You are submitting an offer for a buyer request.
              </div>
            </div>
          </div>

          <div className="w-10" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request card */}
          <div className="lg:col-span-2 rounded-3xl border border-white/15 bg-[#0B001F]/80 p-6 shadow-[0_0_26px_rgba(2,6,23,0.55)]">
            <div className="text-xs text-white/70 flex items-center gap-2">
              <Tag className="w-4 h-4 text-cyan-200" />
              <span>{request?.category || "Category"}</span>
            </div>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              {request?.productName || "Request"}
            </h2>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={fieldCard}>
                <div className="text-xs text-white/70 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-200" />
                  <span>Quantity</span>
                </div>
                <div className="mt-2 text-white/90 font-semibold">
                  {request?.quantity ?? "N/A"}
                </div>
              </div>

              <div className={fieldCard}>
                <div className="text-xs text-white/70 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-amber-200" />
                  <span>Size / Weight</span>
                </div>
                <div className="mt-2 text-white/90 font-semibold">
                  {request?.sizeWeight ?? "N/A"}
                </div>
              </div>

              <div className={fieldCard}>
                <div className="text-xs text-white/70 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-200" />
                  <span>Ships to</span>
                </div>
                <div className="mt-2 text-white/90 font-semibold">
                  {shipText || "Not provided"}
                </div>
              </div>

              <div className={fieldCard}>
                <div className="text-xs text-white/70 flex items-center gap-2">
                  <PencilLine className="w-4 h-4 text-amber-200" />
                  <span>Condition</span>
                </div>
                <div className="mt-2 text-white/90 font-semibold">
                  {request?.condition ?? "N/A"}
                </div>
              </div>

              <div className={`${fieldCard} sm:col-span-2`}>
                <div className="text-xs text-white/70 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-200" />
                  <span>Description</span>
                </div>
                <div className="mt-2 text-white/85">
                  {request?.description ?? "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Offer form */}
          <div className="rounded-3xl border border-white/15 bg-[#0B001F]/80 p-6 shadow-[0_0_26px_rgba(2,6,23,0.55)]">
            <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-200" />
              Your Offer
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-white/70 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-200" />
                  Unit Price
                </label>
                <input
                  className={inputBase}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="e.g. 75.00"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-200" />
                  Total Lot Price
                </label>
                <input
                  className={inputBase}
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  placeholder="e.g. 7000.00"
                  inputMode="decimal"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs text-cyan-200 hover:text-cyan-100 underline"
              >
                {showAdvanced ? "Hide" : "Show"} advanced (delivery & photos)
              </button>

              {showAdvanced && (
                <>
                  <div>
                    <label className="text-xs text-white/70 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-200" />
                      Delivery Time (days)
                    </label>
                    <input
                      className={inputBase}
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      placeholder='e.g. "5 days"'
                    />
                  </div>

                  <div className="rounded-2xl border border-white/12 bg-[#0a0128]/45 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/70 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-amber-200" />
                        Photos (optional)
                      </div>

                      {existingImages.length > 0 && (
                        <button
                          type="button"
                          onClick={clearExistingImages}
                          className="text-xs text-red-200 hover:text-red-100 underline"
                        >
                          Clear existing photos
                        </button>
                      )}
                    </div>

                    <div className="mt-3">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={onPickPhotos}
                        className="block w-full text-xs text-white/70"
                      />
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {photoPreviews.map((src, idx) => (
                          <div key={src} className="relative rounded-xl overflow-hidden border border-white/15">
                            <img src={src} alt="preview" className="w-full h-28 object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhotoAt(idx)}
                              className="absolute top-2 right-2 bg-black/70 border border-white/20 rounded-lg p-1 hover:bg-black"
                            >
                              <X className="w-4 h-4 text-white/80" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={submitBid}
                disabled={submitting}
                className="
                  mt-2 w-full
                  bg-amber-400 hover:bg-amber-300
                  disabled:bg-amber-400/40 disabled:text-black/60
                  text-black font-semibold
                  py-3 rounded-xl
                  shadow-[0_0_22px_rgba(245,158,11,0.22)]
                  transition
                "
              >
                {submitting ? "Submitting..." : "Submit Offer"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-[11px] text-white/55">
          Request ID: <span className="text-white/80">{requestId}</span>
        </div>
      </div>
    </div>
  );
}
