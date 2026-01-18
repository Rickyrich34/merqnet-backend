// src/pages/MainDashboard.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Tag,
  History as HistoryIcon,
  MessageSquare,
  Star,
  MapPin,
} from "lucide-react";
import dog from "../assets/logopic2.png";

const API = "http://localhost:5000";

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

      // ✅ FIX: support multiple backend shapes
      // common patterns: { user: {...} } OR { profile: {...} } OR direct user object
      const u =
        payload?.user ||
        payload?.profile ||
        payload?.data ||
        payload;

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

  // ---------- CLEAR MESSAGES ----------
  const clearMessageUnread = useCallback(async () => {
    try {
      if (!userId || !token) return;

      await fetch(`${API}/api/messages/mark-read/user/${userId}`, {
        method: "PUT",
        headers: { ...authHeaders },
      }).catch(() => {});
      await fetch(`${API}/api/messages/markRead/user/${userId}`, {
        method: "PUT",
        headers: { ...authHeaders },
      }).catch(() => {});
      await fetch(`${API}/api/messages/mark-all-read/${userId}`, {
        method: "PUT",
        headers: { ...authHeaders },
      }).catch(() => {});

      setBuyerUnread(0);
      setSellerUnread(0);
    } catch (_) {}
  }, [userId, token, authHeaders]);

  // ---------- CLEAR RECEIPT "NEW" ----------
  const clearReceiptNew = useCallback(async () => {
    try {
      if (!token) return;

      await fetch(`${API}/api/receipts/mark-viewed/buyer`, {
        method: "PUT",
        headers: { ...authHeaders },
      }).catch(() => {});
      await fetch(`${API}/api/receipts/mark-viewed/seller`, {
        method: "PUT",
        headers: { ...authHeaders },
      }).catch(() => {});
      await fetch(`${API}/api/receipts/markViewed/buyer`, {
        method: "PUT",
        headers: { ...authHeaders },
      }).catch(() => {});
      await fetch(`${API}/api/receipts/markViewed/seller`, {
        method: "PUT",
        headers: { ...authHeaders },
      }).catch(() => {});

      setBuyerReceiptsUnviewed((prev) => prev.map((r) => ({ ...r, viewedByBuyer: true })));
      setSellerReceiptsUnviewed((prev) => prev.map((r) => ({ ...r, viewedBySeller: true })));

      fetchBuyerReceiptsUnviewed();
      fetchSellerReceiptsUnviewed();
      fetchBuyerReceiptsHistory();
      fetchSellerReceiptsHistory();
    } catch (_) {}
  }, [
    token,
    authHeaders,
    fetchBuyerReceiptsUnviewed,
    fetchSellerReceiptsUnviewed,
    fetchBuyerReceiptsHistory,
    fetchSellerReceiptsHistory,
  ]);

  // ---------- INIT / REFRESH ----------
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

  // ---------- DERIVED COUNTS (UNVIEWED) ----------
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
      (a, b) =>
        new Date(pickReceiptDate(b)).getTime() - new Date(pickReceiptDate(a)).getTime()
    );
    return arr;
  }, [buyerReceiptsHistory, pickReceiptDate]);

  const sortedSellerHistory = useMemo(() => {
    const src = Array.isArray(sellerReceiptsHistory) ? sellerReceiptsHistory : [];
    const arr = [...src];
    arr.sort(
      (a, b) =>
        new Date(pickReceiptDate(b)).getTime() - new Date(pickReceiptDate(a)).getTime()
    );
    return arr;
  }, [sellerReceiptsHistory, pickReceiptDate]);

  const lastBuy = sortedBuyerHistory[0] || null;
  const lastSell = sortedSellerHistory[0] || null;

  // ---------- ADDRESS (SAFE) ----------
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

  // ---------- RATING (FROM HISTORY) ----------
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

  // ---------- LAST BUY/SELL TEXT ----------
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
  }, [
    lastBuy,
    formatMoney,
    formatDate,
    resolveReceiptPrice,
    resolveReceiptProductName,
    pickReceiptDate,
  ]);

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
  }, [
    lastSell,
    formatMoney,
    formatDate,
    resolveReceiptPrice,
    resolveReceiptProductName,
    pickReceiptDate,
  ]);

  // ---------- UI ----------
  const Badge = ({ count }) => {
    if (!count || count <= 0) return null;
    return (
      <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center shadow-[0_0_18px_rgba(255,0,200,0.75)] border border-pink-300">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const ActionButton = ({ label, icon: Icon, onClick, badgeCount, tintClass }) => {
    return (
      <button
        onClick={onClick}
        className={`relative w-full sm:w-[210px] px-7 py-4 rounded-full font-semibold text-white flex items-center justify-center gap-2
          bg-gradient-to-r ${tintClass}
          shadow-[0_0_22px_rgba(180,60,255,0.35)]
          hover:brightness-110 active:scale-[0.99] transition`}
      >
        <Icon size={18} />
        {label}
        <Badge count={badgeCount} />
      </button>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-24 pb-64 px-4 bg-[#030014] text-white">
      <h1 className="text-4xl sm:text-5xl font-bold text-purple-300 mb-10 drop-shadow-[0_0_25px_rgba(180,60,255,0.7)]">
        MerqNet Main Dashboard
      </h1>

      <div className="relative w-full max-w-3xl p-8 rounded-2xl bg-[#0A001F]/80 border border-purple-600/60 shadow-[0_0_35px_rgba(160,50,255,0.7)] overflow-hidden">
        <img
          src={dog}
          alt="dog"
          className="hidden md:block absolute inset-0 m-auto w-28 opacity-60 pointer-events-none drop-shadow-[0_0_30px_rgba(255,0,255,0.85)]"
        />

        <h2 className="text-2xl font-bold text-purple-200 text-center mb-8">
          Activity Overview
        </h2>

        <div className="grid grid-cols-2 gap-6 w-full mb-10">
          <div className="pl-2">
            <h3 className="text-lg font-semibold text-blue-300">Buyer Receipts</h3>
            <p className="text-gray-400">
              {buyerNewCount > 0 ? `${buyerNewCount} new receipts` : "No new receipts"}
            </p>

            <h3 className="text-lg mt-4 font-semibold text-purple-300">Buyer Messages</h3>
            <p className="text-gray-400">
              {buyerUnread > 0 ? `${buyerUnread} unread` : "0 unread"}
            </p>
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <ActionButton
            label="Buyer"
            icon={ShoppingCart}
            onClick={() => navigate("/buyerdashboard")}
            badgeCount={0}
            tintClass="from-blue-500 to-blue-700"
          />

          <ActionButton
            label="Seller"
            icon={Tag}
            onClick={() => navigate("/sellerdashboard")}
            badgeCount={0}
            tintClass="from-pink-500 to-pink-700"
          />

          <ActionButton
            label="Messages"
            icon={MessageSquare}
            onClick={async () => {
              await clearMessageUnread();
              navigate("/messages");
            }}
            badgeCount={buyerUnread + sellerUnread}
            tintClass="from-purple-500 to-purple-700"
          />

          <ActionButton
            label="History"
            icon={HistoryIcon}
            onClick={async () => {
              await clearReceiptNew();
              navigate("/history");
            }}
            badgeCount={buyerNewCount + sellerNewCount}
            tintClass="from-orange-400 to-amber-600"
          />
        </div>
      </div>

      {/* User Snapshot */}
      <div className="relative w-full max-w-3xl mt-10 p-8 rounded-2xl bg-[#07001f]/80 border border-cyan-500/30 shadow-[0_0_40px_rgba(0,220,255,0.25)] overflow-hidden">
        <h2 className="text-2xl font-bold text-cyan-200 text-center mb-7 drop-shadow-[0_0_14px_rgba(0,220,255,0.35)]">
          User Snapshot
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-xl p-6 border border-purple-500/30 bg-black/25 shadow-[0_0_18px_rgba(180,60,255,0.18)]">
            <div className="flex items-center gap-2 text-purple-200 mb-3">
              <Star size={18} />
              <span className="font-semibold">Your Seller Rating</span>
            </div>

            <div className="text-4xl font-extrabold text-purple-100 drop-shadow-[0_0_12px_rgba(200,120,255,0.35)]">
              {rating.toFixed(1)} / 10
            </div>

            <div className="text-xs text-gray-400 mt-2">
              Based on {ratedSalesCount} rated sale{ratedSalesCount === 1 ? "" : "s"}
            </div>

            <div className="text-xs text-gray-400 mt-2">
              Build it. Keep it high. It favors decision making.
            </div>
          </div>

          <div className="rounded-xl p-6 border border-cyan-500/25 bg-black/25 shadow-[0_0_18px_rgba(0,220,255,0.18)]">
            <div className="flex items-center gap-2 text-cyan-200 mb-3">
              <MapPin size={18} />
              <span className="font-semibold">Shipping Address</span>
            </div>
            <div className="text-lg font-semibold text-white">{addressLine}</div>
            <div className="text-xs text-gray-400 mt-2">
              {address?.streetAddress ? address.streetAddress : "—"}
            </div>
          </div>

          <div
            className={`rounded-xl p-6 border border-green-500/25 bg-black/25 shadow-[0_0_18px_rgba(0,255,120,0.14)] ${
              lastBuyText?.receiptLink ? "cursor-pointer hover:brightness-110 transition" : ""
            }`}
            onClick={() => {
              if (lastBuyText?.receiptLink) navigate(lastBuyText.receiptLink);
            }}
          >
            <div className="text-green-300 font-semibold mb-3">Last Buy</div>
            {lastBuyText ? (
              <>
                <div className="text-white font-bold text-lg">{lastBuyText.title}</div>
                <div className="text-gray-300 text-sm mt-1">{lastBuyText.meta}</div>
              </>
            ) : (
              <div className="text-gray-200 font-semibold">You haven’t purchased anything yet.</div>
            )}
          </div>

          <div
            className={`rounded-xl p-6 border border-pink-500/25 bg-black/25 shadow-[0_0_18px_rgba(255,0,200,0.14)] ${
              lastSellText?.receiptLink ? "cursor-pointer hover:brightness-110 transition" : ""
            }`}
            onClick={() => {
              if (lastSellText?.receiptLink) navigate(lastSellText.receiptLink);
            }}
          >
            <div className="text-pink-300 font-semibold mb-3">Last Sell</div>
            {lastSellText ? (
              <>
                <div className="text-white font-bold text-lg">{lastSellText.title}</div>
                <div className="text-gray-300 text-sm mt-1">{lastSellText.meta}</div>
              </>
            ) : (
              <div className="text-gray-200 font-semibold">You haven’t sold anything yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
