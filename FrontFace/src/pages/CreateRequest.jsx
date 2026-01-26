// CreateRequest.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import logopic2 from "../assets/logopic2.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Canonical categories
const CATEGORY_OPTIONS = [
  { value: "", label: "Select a category..." },
  { value: "Food", label: "Food & Beverage Supplies" },
  { value: "Music", label: "Music & Instruments" },
  { value: "Construction", label: "Construction Materials" },
  { value: "Electronics", label: "Electronics & Tech" },
  { value: "Office", label: "Office & Stationery" },
  { value: "Industrial", label: "Industrial / Manufacturing" },
  { value: "Home", label: "Home & Household" },
  { value: "Automotive", label: "Automotive Supplies" },
  { value: "Health", label: "Health & Wellness" },
  { value: "Other", label: "Other" },
];

function normalizeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x.trim();
  if (typeof x === "object" && x._id) return String(x._id).trim();
  return String(x).trim();
}

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("userToken") || "";
}

function pickDefaultAddress(user) {
  const arr = user?.shippingAddresses;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr.find((a) => a?.isDefault) || arr[0] || null;
}

function formatShipping(addr) {
  if (!addr || typeof addr !== "object") return null;

  const street = addr.street || addr.streetAddress || "";
  const city = addr.city || "";
  const state = addr.state || "";
  const country = addr.country || "";
  const postalCode = addr.postalCode || addr.zip || "";

  const hasAny = [street, city, state, country, postalCode].some((v) =>
    String(v || "").trim().length > 0
  );
  if (!hasAny) return null;

  const line1 = [city, state].filter(Boolean).join(", ");
  const line2 = [country, postalCode].filter(Boolean).join(" ");
  const compact = [line1, line2].filter(Boolean).join(" • ");
  const full = [street, compact].filter(Boolean).join(" — ");

  return full || compact || null;
}

async function fetchUserProfile(userId, token) {
  const urls = [
    `${API_BASE_URL}/api/users/profile/${userId}`,
    `${API_BASE_URL}/api/user/profile/${userId}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next
    }
  }

  return null;
}

export default function CreateRequest() {
  const navigate = useNavigate();
  const userId = normalizeId(localStorage.getItem("userId"));
  const token = getToken();

  const [form, setForm] = useState({
    productName: "",
    category: "",
    quantity: "",
    condition: "New",
    sizeWeight: "",
    description: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [defaultAddr, setDefaultAddr] = useState(null);

  useEffect(() => {
    if (!userId || !token) navigate("/login");
  }, [userId, token, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const profile = await fetchUserProfile(userId, token);
        const addr = pickDefaultAddress(profile);
        setDefaultAddr(addr || null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (userId && token) loadProfile();
  }, [userId, token]);

  const defaultShipText = useMemo(() => formatShipping(defaultAddr), [defaultAddr]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedCategory = String(form.category || "").trim();

    // ✅ Force default address to exist
    if (!defaultAddr || !defaultShipText) {
      alert("No default shipping address found. Please add one in Settings.");
      navigate("/settings");
      return;
    }

    const payload = {
      productName: form.productName,
      category: cleanedCategory,
      quantity: Number(form.quantity),
      condition: form.condition,
      sizeWeight: form.sizeWeight,
      description: form.description,
      searchName: form.productName,

      // ✅ Use default address from profile (NOT empty form fields)
      shippingAddress: {
        street: defaultAddr.street || defaultAddr.streetAddress || "",
        city: defaultAddr.city || "",
        state: defaultAddr.state || "",
        country: defaultAddr.country || "",
        postalCode: defaultAddr.postalCode || defaultAddr.zip || "",
      },

      clientID: userId,
    };

    const res = await fetch(`${API_BASE_URL}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // ✅ FIX: your actual route is /buyer-dashboard (with dash)
    if (res.ok) navigate("/buyer-dashboard");
    else {
      const data = await res.json().catch(() => ({}));
      alert(data?.message || `Error creating request (${res.status})`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050017] text-white pt-24 px-5 pb-20 relative">
      {/* Logo */}
      <div className="flex justify-center mb-8 mt-6">
        <img
          src={logopic2}
          alt="MerqNet Logo"
          className="w-32 drop-shadow-[0_0_20px_rgba(255,100,255,0.7)]"
        />
      </div>

      <div
        className="
          max-w-xl mx-auto
          bg-[#0B001F]/90
          border border-cyan-500/30
          shadow-[0_0_35px_rgba(34,211,238,0.4)]
          rounded-3xl
          p-6 sm:p-10
          relative
        "
      >
        {/* Back arrow attached to the card */}
        <button
          onClick={() => navigate("/buyer-dashboard")}
          className="
            absolute -top-12 left-1
            rounded-xl
            border border-white/15
            bg-[#0b0a1c]/70
            hover:bg-[#0b0a1c]/85
            transition
            p-2
            backdrop-blur-md
            text-white/80 hover:text-white
            shadow-[0_0_18px_rgba(34,211,238,0.12)]
          "
          aria-label="Back"
          title="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h1 className="text-3xl font-bold text-cyan-300 text-center mb-8">
          Create Request
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-1 text-cyan-200">
              Product Name *
            </label>
            <input
              type="text"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              required
              className="w-full bg-[#0a0128] px-3 py-3 rounded-xl border border-cyan-700 focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-200">
              Category *
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full bg-[#0a0128] px-3 py-3 rounded-xl border border-cyan-700 focus:ring-2 focus:ring-cyan-400"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-200">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={form.quantity}
              onChange={handleChange}
              required
              className="w-full bg-[#0a0128] px-3 py-3 rounded-xl border border-cyan-700 focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-200">
              Condition *
            </label>
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className="w-full bg-[#0a0128] px-3 py-3 rounded-xl border border-cyan-700"
            >
              <option value="New">New</option>
              <option value="Used">Used</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-200">
              Size / Weight
            </label>
            <input
              type="text"
              name="sizeWeight"
              value={form.sizeWeight}
              onChange={handleChange}
              className="w-full bg-[#0a0128] px-3 py-3 rounded-xl border border-cyan-700"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-200">
              Description
            </label>
            <textarea
              name="description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              className="w-full bg-[#0a0128] px-3 py-3 rounded-xl border border-cyan-700 resize-none"
            />
          </div>

          {/* ✅ Display the real default address */}
          <div className="bg-[#06001a] border border-cyan-700/40 rounded-xl p-4 text-sm text-cyan-200">
            {profileLoading ? (
              <div>Loading default shipping address...</div>
            ) : defaultShipText ? (
              <>
                <div className="text-cyan-200">Default shipping address:</div>
                <div className="mt-1 text-white/90 text-sm">
                  {defaultShipText}
                </div>
                <div className="mt-2">
                  <span
                    className="text-cyan-400 cursor-pointer underline"
                    onClick={() => navigate("/settings")}
                  >
                    Change in Settings
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-amber-200">
                  No default shipping address found.
                </div>
                <div className="mt-2">
                  <span
                    className="text-cyan-400 cursor-pointer underline"
                    onClick={() => navigate("/settings")}
                  >
                    Add / Set default in Settings
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-xl mt-6 shadow-[0_0_25px_rgba(34,211,238,0.5)]"
          >
            Create Request
          </button>
        </form>
      </div>
    </div>
  );
}
