import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ================================
   Robust API resolver (production safe)
================================== */
const ENV_API =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
  "";

const API =
  ENV_API && ENV_API.startsWith("http")
    ? ENV_API.replace(/\/$/, "")
    : "https://merqnet-backend-production.up.railway.app";

export default function EditProfile() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("userToken") || localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    acceptsInternationalTrade: false,
    shippingAddresses: [],
  });

  useEffect(() => {
    if (!token || !userId) {
      setLoading(false);
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API}/api/users/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = res.data;

        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          acceptsInternationalTrade: !!user.acceptsInternationalTrade,
          shippingAddresses: user.shippingAddresses || [],
        });
      } catch (err) {
        console.error("EditProfile load error:", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, userId, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddressChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.shippingAddresses];
      updated[index] = { ...updated[index], [name]: value };
      return { ...prev, shippingAddresses: updated };
    });
  };

  const setDefaultAddress = (index) => {
    setFormData((prev) => ({
      ...prev,
      shippingAddresses: prev.shippingAddresses.map((a, i) => ({
        ...a,
        isDefault: i === index,
      })),
    }));
  };

  const addAddress = () => {
    if (formData.shippingAddresses.length >= 3) return;

    setFormData((prev) => ({
      ...prev,
      shippingAddresses: [
        ...prev.shippingAddresses,
        {
          streetAddress: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
          isDefault: false,
        },
      ],
    }));
  };

  const normalizePayload = (payload) => {
    const hasDefault = payload.shippingAddresses.some((a) => a.isDefault);
    return {
      ...payload,
      shippingAddresses: payload.shippingAddresses.map((a, idx) => ({
        ...a,
        isDefault: hasDefault ? a.isDefault : idx === 0,
      })),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.put(
        `${API}/api/users/profile/${userId}`,
        normalizePayload(formData),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      navigate("/profile");
    } catch (err) {
      console.error("EditProfile save error:", err);
      setError(err?.response?.data?.message || "Failed to update profile.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading profile…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
        <p>{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition"
        >
          Back
        </button>
      </div>
    );
  }

  const baseBtn =
    "relative inline-flex items-center justify-center select-none rounded-xl font-extrabold tracking-wide transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-cyan-400/60";

  const btnPrimary =
    baseBtn +
    " w-full py-3 text-white bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-indigo-500 shadow-[0_10px_30px_rgba(168,85,247,0.25)]";

  const btnCyan =
    baseBtn +
    " w-full py-3 text-white bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 shadow-[0_10px_30px_rgba(34,211,238,0.25)]";

  const btnGhost =
    baseBtn +
    " w-full py-3 text-white/90 bg-white/5 hover:bg-white/10 border border-white/10";

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 text-white bg-black flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-black/70 p-8 rounded-2xl shadow-xl space-y-6"
      >
        {/* Back arrow icon only */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          aria-label="Back"
          className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full
                     bg-white/5 border border-white/10 text-white
                     hover:bg-white/10 hover:border-white/20 transition
                     shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_25px_rgba(0,0,0,0.55)]
                     active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
        >
          <span className="text-xl leading-none">‹</span>
        </button>

        <h1 className="text-3xl font-black mb-2">Edit Profile</h1>

        <input
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Full name"
          className="w-full p-3 rounded-lg bg-[#111] border border-white/10"
        />

        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-3 rounded-lg bg-[#111] border border-white/10"
        />

        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full p-3 rounded-lg bg-[#111] border border-white/10"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="acceptsInternationalTrade"
            checked={formData.acceptsInternationalTrade}
            onChange={handleChange}
            className="accent-cyan-400"
          />
          Accept international trade
        </label>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Shipping addresses</h2>
            {formData.shippingAddresses.length < 3 && (
              <button
                type="button"
                onClick={addAddress}
                className="text-cyan-300 hover:text-cyan-200 text-sm font-bold"
              >
                + Add
              </button>
            )}
          </div>

          {formData.shippingAddresses.map((addr, i) => (
            <div
              key={i}
              className="rounded-xl p-4 space-y-2 bg-white/[0.03] border border-white/10"
            >
              <div className="flex justify-between items-center">
                <strong>Address {i + 1}</strong>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={!!addr.isDefault}
                    onChange={() => setDefaultAddress(i)}
                    className="accent-cyan-400"
                  />
                  Default
                </label>
              </div>

              {["streetAddress", "city", "state", "country", "postalCode"].map(
                (field) => (
                  <input
                    key={field}
                    name={field}
                    value={addr[field] || ""}
                    onChange={(e) => handleAddressChange(i, e)}
                    placeholder={field}
                    className="w-full p-2.5 rounded-lg bg-[#111] border border-white/10"
                  />
                )
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate("/paymentmethods")}
          className={btnCyan}
        >
          Manage Payment Methods
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button type="submit" className={btnPrimary}>
            Save changes
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className={btnGhost}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
