import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Tag, Star, MapPin } from "lucide-react";
import dog from "../assets/logopic2.png";

const API = (import.meta?.env?.VITE_API_URL || "").replace(/\/$/, "");
console.log("API BASE =", import.meta.env.VITE_API_URL);

const MainDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("userToken") || localStorage.getItem("token");

  // 🔔 UNVIEWED (for badges / Activity Overview)
  const [buyerReceiptsUnviewed, setBuyerReceiptsUnviewed] = useState([]);
  const [sellerReceiptsUnviewed, setSellerReceiptsUnviewed] = useState([]);

  // 📜 HISTORY (for Last Buy / Last Sell / Rating)
  const [buyerReceiptsHistory, setBuyerReceiptsHistory] = useState([]);
  const [sellerReceiptsHistory, setSellerReceiptsHistory] = useState([]);

  const [buyerUnread, setBuyerUnread] = useState(0);
  const [sellerUnread, setSellerUnread] = useState(0);

  const [user, setUser] = useState(null);

  // ---------- HELPERS ----------
  const getId = useCallback((val) => {
    if (val && typeof val === "object") return val._id;
    return val;
  }, []);

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const safeToNumber = useCallback((n) => {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  }, []);

  const formatMoney = useCallback(
    (n) => {
      const num = safeToNumber(n);
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    [safeToNumber]
  );

  const formatDate = useCallback((d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleString();
  }, []);

  const resolveReceiptProductName = useCallback((r) => {
    if (!r) return "";
    if (r.productName) return r.productName;

    if (r.requestId && typeof r.requestId === "object") {
      if (r.requestId.productName) return r.requestId.productName;
    }

    if (r.request && typeof r.request === "object") {
      if (r.request.productName) return r.request.productName;
    }

    return "";
  }, []);

  const resolveReceiptPrice = useCallback(
    (r) => {
      if (!r) return 0;
      const amt = safeToNumber(r.amount);
      if (amt > 0) return amt;

      const v =
        r.finalPrice ?? r.wholeLotPrice ?? r.totalPrice ?? r.unitPrice ?? r.price;

      return safeToNumber(v);
    },
    [safeToNumber]
  );

  const normalizeReceiptsPayload = useCallback((data) => {
    const receipts = Array.isArray(data) ? data : data?.receipts;
    return Array.isArray(receipts) ? receipts : [];
  }, []);

  // ---------- FETCH USER ----------
  const fetchUser = useCallback(async () => {
    try {
      if (!userId || !token) return;

      const res = await fetch(`${API}/api/users/profile/${userId}`, {
        headers: { ...authHeaders },
      });

      if (!res.ok) return;

      const payload = await res.json();

      const u = payload?.user || payload?.profile || payload?.data || payload;

      setUser(u && typeof u === "object" ? u : null);
    } catch (_) {}
  }, [userId, token, authHeaders]);

  // ---------- FETCH RECEIPTS (UNVIEWED ONLY) ----------
  const fetchBuyerReceiptsUnviewed = useCallback(async () => {
    try {
      if (!token) return;

      const res = await fetch(`${API}/api/receipts/buyer?unviewed=true`, {
        headers: { ...authHeaders },
      });

      if (!res.ok) return;
      const data = await res.json();
      setBuyerReceiptsUnviewed(normalizeReceiptsPayload(data));
    } catch (_) {}
  }, [token, authHeaders, normalizeReceiptsPayload]);

  const fetchSellerReceiptsUnviewed = useCallback(async () => {
    try {
      if (!token) return;

      const res = await fetch(`${API}/api/receipts/seller?unviewed=true`, {
        headers: { ...authHeaders },
      });

      if (!res.ok) return;
      const data = await res.json();
      setSellerReceiptsUnviewed(normalizeReceiptsPayload(data));
    } catch (_) {}
  }, [token, authHeaders, normalizeReceiptsPayload]);

  // ---------- FETCH RECEIPTS (FULL HISTORY for Last Buy/Sell + Rating) ----------
  const fetchBuyerReceiptsHistory = useCallback(async () => {
    try {
      if (!token) return;

      const res = await fetch(`${API}/api/receipts/buyer`, {
        headers: { ...authHeaders },
      });

      if (!res.ok) return;
      const data = await res.json();
      setBuyerReceiptsHistory(normalizeReceiptsPayload(data));
    } catch (_) {}
  }, [token, authHeaders, normalizeReceiptsPayload]);

  const fetchSellerReceiptsHistory = useCallback(async () => {
    try {
      if (!token) return;

      const res = await fetch(`${API}/api/receipts/seller`, {
        headers: { ...authHeaders },
      });

      if (!res.ok) return;
      const data = await res.json();
      setSellerReceiptsHistory(normalizeReceiptsPayload(data));
    } catch (_) {}
  }, [token, authHeaders, normalizeReceiptsPayload]);

  // ---------- FETCH MESSAGES (counts only) ----------
  const fetchMessagesCounts = useCallback(async () => {
    try {
      if (!userId || !token) return;

      const res = await fetch(`${API}/api/messages/user/${userId}`, {
        headers: { ...authHeaders },
      });

      if (!res.ok) return;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      const receivedUnread = arr.filter(
        (m) => String(getId(m.recipient)) === String(userId) && m.read === false
      );

      setBuyerUnread(
        receivedUnread.filter((m) => String(getId(m.buyerId)) === String(userId)).length
      );

      setSellerUnread(
        receivedUnread.filter((m) => String(getId(m.sellerId)) === String(userId)).length
      );
    } catch (_) {}
  }, [userId, token, authHeaders, getId]);

  useEffect(() => {
    if (!userId) return;

    fetchUser();
    fetchBuyerReceiptsUnviewed();
    fetchSellerReceiptsUnviewed();
    fetchBuyerReceiptsHistory();
    fetchSellerReceiptsHistory();
    fetchMessagesCounts();
  }, [
    userId,
    location.pathname,
    fetchUser,
    fetchBuyerReceiptsUnviewed,
    fetchSellerReceiptsUnviewed,
    fetchBuyerReceiptsHistory,
    fetchSellerReceiptsHistory,
    fetchMessagesCounts,
  ]);

  const buyerNewReceipts = useMemo(
    () => buyerReceiptsUnviewed.filter((r) => r && r.viewedByBuyer === false),
    [buyerReceiptsUnviewed]
  );

  const sellerNewReceipts = useMemo(
    () => sellerReceiptsUnviewed.filter((r) => r && r.viewedBySeller === false),
    [sellerReceiptsUnviewed]
  );

  const buyerNewCount = buyerNewReceipts.length;
  const sellerNewCount = sellerNewReceipts.length;

  const pickReceiptDate = useCallback((r) => r?.createdAt || r?.date || r?.updatedAt || 0, []);

  const sortedBuyerHistory = useMemo(() => {
    const src = Array.isArray(buyerReceiptsHistory) ? buyerReceiptsHistory : [];
    const arr = [...src];
    arr.sort(
      (a, b) => new Date(pickReceiptDate(b)).getTime() - new Date(pickReceiptDate(a)).getTime()
    );
    return arr;
  }, [buyerReceiptsHistory, pickReceiptDate]);

  const sortedSellerHistory = useMemo(() => {
    const src = Array.isArray(sellerReceiptsHistory) ? sellerReceiptsHistory : [];
    const arr = [...src];
    arr.sort(
      (a, b) => new Date(pickReceiptDate(b)).getTime() - new Date(pickReceiptDate(a)).getTime()
    );
    return arr;
  }, [sellerReceiptsHistory, pickReceiptDate]);

  const lastBuy = sortedBuyerHistory[0] || null;
  const lastSell = sortedSellerHistory[0] || null;

  const address = useMemo(() => {
    const list = Array.isArray(user?.shippingAddresses) ? user.shippingAddresses : [];
    return list.find((a) => a?.isDefault) || list[0] || null;
  }, [user]);

  const addressLine = useMemo(() => {
    if (!address) return "No address set";
    const city = address.city || "";
    const state = address.state || "";
    const country = address.country || "";
    const postal = address.postalCode || "";
    const parts = [city, state, country, postal].filter(Boolean);
    return parts.length ? parts.join(" - ") : "Address saved";
  }, [address]);

  const rating = useMemo(() => {
    const src = Array.isArray(sellerReceiptsHistory) ? sellerReceiptsHistory : [];
    const rated = src
      .filter((r) => r && r.rating && r.rating.value != null)
      .map((r) => safeToNumber(r.rating.value))
      .filter((n) => n >= 1 && n <= 10);

    if (rated.length === 0) return 0;
    const avg = rated.reduce((sum, n) => sum + n, 0) / rated.length;
    return safeToNumber(avg);
  }, [sellerReceiptsHistory, safeToNumber]);

  const ratedSalesCount = useMemo(() => {
    const src = Array.isArray(sellerReceiptsHistory) ? sellerReceiptsHistory : [];
    return src
      .filter((r) => r && r.rating && r.rating.value != null)
      .map((r) => safeToNumber(r.rating.value))
      .filter((n) => n >= 1 && n <= 10).length;
  }, [sellerReceiptsHistory, safeToNumber]);

  const lastBuyText = useMemo(() => {
    if (!lastBuy) return null;
    const name = resolveReceiptProductName(lastBuy) || "Purchase";
    const price = resolveReceiptPrice(lastBuy);
    const when = pickReceiptDate(lastBuy);

    return {
      title: name,
      meta: `$${formatMoney(price)} • ${formatDate(when)}`,
      receiptLink:
        lastBuy.receiptId
          ? `/receipt/${lastBuy.receiptId}`
          : lastBuy._id
          ? `/receipt/${lastBuy._id}`
          : null,
    };
  }, [lastBuy, formatMoney, formatDate, resolveReceiptPrice, resolveReceiptProductName, pickReceiptDate]);

  const lastSellText = useMemo(() => {
    if (!lastSell) return null;
    const name = resolveReceiptProductName(lastSell) || "Sale";
    const price = resolveReceiptPrice(lastSell);
    const when = pickReceiptDate(lastSell);

    return {
      title: name,
      meta: `$${formatMoney(price)} • ${formatDate(when)}`,
      receiptLink:
        lastSell.receiptId
          ? `/receipt/${lastSell.receiptId}`
          : lastSell._id
          ? `/receipt/${lastSell._id}`
          : null,
    };
  }, [lastSell, formatMoney, formatDate, resolveReceiptPrice, resolveReceiptProductName, pickReceiptDate]);

  const Badge = ({ count }) => {
    if (!count || count <= 0) return null;
    return (
      <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center shadow-[0_0_18px_rgba(255,0,200,0.75)] border border-pink-300">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  // 🔧 ONLY THIS COMPONENT WAS MODIFIED (arcade joystick style)
  const ActionButton = ({ label, icon: Icon, onClick, badgeCount, tintClass }) => {
    return (
      <div className="relative">
        {/* base */}
        <div className="absolute inset-x-3 top-5 h-full rounded-full bg-black/60 blur-sm" />

        <button
          onClick={onClick}
          className={`relative z-10 w-full sm:w-[220px] px-7 py-4 rounded-full font-semibold text-white flex items-center justify-center gap-2
            bg-gradient-to-b ${tintClass}
            border border-white/20
            shadow-[0_8px_0_rgba(0,0,0,0.55),0_0_28px_rgba(180,60,255,0.45)]
            hover:brightness-110 hover:shadow-[0_8px_0_rgba(0,0,0,0.55),0_0_36px_rgba(160,90,255,0.65)]
            active:translate-y-[6px] active:shadow-[0_2px_0_rgba(0,0,0,0.65)] transition`}
        >
          <Icon size={18} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
          {label}
          <Badge count={badgeCount} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-36 pb-64 px-4 bg-[#030014] text-white">
      {/* 🔥 NEW NEON TITLE (only change) */}
      <h1 className="text-center mb-10 leading-tight">
        <span
          className="block text-[2.2rem] sm:text-[2.6rem] font-extrabold tracking-tight
          bg-gradient-to-r from-fuchsia-300 via-violet-200 to-indigo-200
          bg-clip-text text-transparent
          drop-shadow-[0_0_14px_rgba(199,76,255,0.75)]"
        >
          MerqNet
        </span>

        <span
          className="block mt-1 text-[1.4rem] sm:text-[1.7rem] font-semibold tracking-wide
          text-violet-200
          drop-shadow-[0_0_12px_rgba(160,90,255,0.65)]"
        >
          Dashboard
        </span>
      </h1>

      <div className="relative w-full max-w-3xl p-8 rounded-2xl bg-[#0A001F]/80 border border-purple-600/60 shadow-[0_0_35px_rgba(160,50,255,0.7)] overflow-hidden">
        <img
          src={dog}
          alt="dog"
          className="hidden md:block absolute inset-0 m-auto w-28 opacity-60 pointer-events-none drop-shadow-[0_0_30px_rgba(255,0,255,0.85)]"
        />

        <h2 className="text-2xl font-bold text-purple-200 text-center mb-8">Activity Overview</h2>

        <div className="grid grid-cols-2 gap-6 w-full mb-10">
          <div className="pl-2">
            <h3 className="text-lg font-semibold text-blue-300">Buyer Receipts</h3>
            <p className="text-gray-400">
              {buyerNewCount > 0 ? `${buyerNewCount} new receipts` : "No new receipts"}
            </p>

            <h3 className="text-lg mt-4 font-semibold text-purple-300">Buyer Messages</h3>
            <p className="text-gray-400">{buyerUnread > 0 ? `${buyerUnread} unread` : "0 unread"}</p>
          </div>

          <div className="pr-2 text-right">
            <h3 className="text-lg font-semibold text-pink-300">Seller Receipts</h3>
            <p className="text-gray-400">
              {sellerNewCount > 0 ? `${sellerNewCount} new receipts` : "No new receipts"}
            </p>

            <h3 className="text-lg mt-4 font-semibold text-yellow-300">Seller Messages</h3>
            <p className="text-gray-400">
              {sellerUnread > 0 ? `${sellerUnread} unread` : "0 unread"}
            </p>
          </div>
        </div>

        {/* ✅ ONLY Buyer + Seller buttons now */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <ActionButton
            label="Buyer"
            icon={ShoppingCart}
            onClick={() => navigate("/buyer-dashboard")}
            badgeCount={0}
            tintClass="from-cyan-500 via-blue-600 to-indigo-700"
          />

          <ActionButton
            label="Seller"
            icon={Tag}
            onClick={() => navigate("/seller-dashboard")}
            badgeCount={0}
            tintClass="from-fuchsia-500 via-pink-600 to-rose-700"
          />
        </div>
      </div>

      <div className="mt-10 w-full max-w-3xl rounded-2xl bg-[#050022]/80 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.2)] p-8">
        <h2 className="text-2xl font-bold text-cyan-200 text-center mb-8">User Snapshot</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/10 bg-[#0A001F]/60 p-6 shadow-[0_0_25px_rgba(170,70,255,0.15)]">
            <div className="flex items-center gap-2 text-purple-200 font-semibold">
              <Star size={16} />
              <span>Your Seller Rating</span>
            </div>

            <div className="mt-3 text-4xl font-extrabold text-white">
              {rating.toFixed(1)} <span className="text-gray-300 text-2xl">/ 10</span>
            </div>

            <div className="text-sm text-gray-400 mt-2">Based on {ratedSalesCount} rated sales</div>

            <div className="text-xs text-gray-500 mt-2">
              Build it. Keep it high. It favors decision making.
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0A001F]/60 p-6 shadow-[0_0_25px_rgba(0,255,255,0.12)]">
            <div className="flex items-center gap-2 text-cyan-200 font-semibold">
              <MapPin size={16} />
              <span>Shipping Address</span>
            </div>

            <div className="mt-3 text-white font-semibold">{user?.name ? `${user.name}` : "—"}</div>
            <div className="text-sm text-gray-300 mt-1">{addressLine}</div>

            <div className="text-xs text-gray-500 mt-2">
              {address?.streetAddress ? address.streetAddress : "—"}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0A001F]/60 p-6 shadow-[0_0_25px_rgba(0,255,120,0.10)]">
            <div className="text-green-200 font-semibold">Last Buy</div>

            {lastBuyText ? (
              <>
                <div className="mt-3 text-white font-semibold">{lastBuyText.title}</div>
                <div className="text-sm text-gray-400 mt-1">{lastBuyText.meta}</div>

                {lastBuyText.receiptLink ? (
                  <button
                    className="mt-4 text-sm text-green-300 hover:text-green-200 underline"
                    onClick={() => navigate(lastBuyText.receiptLink)}
                  >
                    View receipt
                  </button>
                ) : null}
              </>
            ) : (
              <div className="mt-3 text-sm text-gray-300">You haven't purchased anything yet.</div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0A001F]/60 p-6 shadow-[0_0_25px_rgba(255,120,0,0.10)]">
            <div className="text-pink-200 font-semibold">Last Sell</div>

            {lastSellText ? (
              <>
                <div className="mt-3 text-white font-semibold">{lastSellText.title}</div>
                <div className="text-sm text-gray-400 mt-1">{lastSellText.meta}</div>

                {lastSellText.receiptLink ? (
                  <button
                    className="mt-4 text-sm text-pink-300 hover:text-pink-200 underline"
                    onClick={() => navigate(lastSellText.receiptLink)}
                  >
                    View receipt
                  </button>
                ) : null}
              </>
            ) : (
              <div className="mt-3 text-sm text-gray-300">You haven't sold anything yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
