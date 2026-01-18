import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const navigate = useNavigate();

  // IMPORTANT: Trim whitespace/newlines from Vercel env var and remove trailing slash
  const API_BASE = useMemo(() => {
    const raw = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return String(raw).trim().replace(/\/+$/, "");
  }, []);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptsInternationalTrade: false,
    shippingAddresses: [
      {
        streetAddress: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        isDefault: true,
      },
    ],
  });

  const [error, setError] = useState("");

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

  const addAddress = () => {
    setFormData((prev) => {
      if (prev.shippingAddresses.length >= 3) return prev;
      return {
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
      };
    });
  };

  const setDefaultAddress = (index) => {
    setFormData((prev) => {
      const updated = prev.shippingAddresses.map((addr, i) => ({
        ...addr,
        isDefault: i === index,
      }));
      return { ...prev, shippingAddresses: updated };
    });
  };

  const normalizePayload = (payload) => {
    // Ensure exactly one default address (if user added more)
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
    if (loading) return;

    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const url = `${API_BASE}/api/users/register`;
      await axios.post(url, normalizePayload(formData), {
        headers: { "Content-Type": "application/json" },
      });

      // Success state -> show "Continue to Payment Methods"
      setSuccess(true);

      // Auto-forward to payment methods (doesn't break anything if user wants to click manually)
      setTimeout(() => {
        navigate("/payment-methods");
      }, 600);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error creating user account.";
      setError(msg);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const goToPaymentMethods = () => {
    navigate("/payment-methods");
  };

  return (
    <div
      className="
        flex flex-col
        bg-gradient-to-b from-[#070714] to-[#0b0b22]
        text-white
        px-4
        [min-height:100svh]
        pt-[calc(5rem+env(safe-area-inset-top))]
        pb-[calc(7.5rem+env(safe-area-inset-bottom))]
      "
    >
      {/* Center area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-[540px]">
          {/* Top links row */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-cyan-300/90 hover:text-cyan-200 underline underline-offset-4"
            >
              ← Back to login
            </button>

            <Link
              to="/about"
              className="text-sm text-purple-300/90 hover:text-purple-200 underline underline-offset-4"
            >
              How it works?
            </Link>
          </div>

          <div className="bg-[#0c0c1c] p-8 rounded-2xl shadow-xl border border-purple-500/20">
            <h2 className="text-2xl font-bold text-center mb-2">
              Create account
            </h2>
            <p className="text-center text-sm text-white/70 mb-6">
              Card required to use MerqNet — you’ll continue to Payment Methods
              right after signup.
            </p>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-5 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 p-3 rounded mb-5 text-sm">
                Account created. Continue to Payment Methods to add your card.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full name */}
              <div>
                <label className="block mb-1 text-sm text-white/80">
                  Full name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={success}
                  className="w-full p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-1 text-sm text-white/80">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={success}
                  className="w-full p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                  autoComplete="email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-1 text-sm text-white/80">
                  Phone (include country code)
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+1 787 555 1234"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={success}
                  className="w-full p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                  autoComplete="tel"
                />
              </div>

              {/* Password / Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm text-white/80">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={success}
                    className="w-full p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm text-white/80">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={success}
                    className="w-full p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* International trade */}
              <div className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  name="acceptsInternationalTrade"
                  checked={formData.acceptsInternationalTrade}
                  onChange={handleChange}
                  disabled={success}
                  className="accent-purple-500 disabled:opacity-60"
                />
                <span>I’m open to international trade</span>
              </div>

              {/* Addresses */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-lg">
                    Shipping addresses
                  </h3>

                  {!success && formData.shippingAddresses.length < 3 && (
                    <button
                      type="button"
                      onClick={addAddress}
                      className="text-sm text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                    >
                      + Add address
                    </button>
                  )}
                </div>

                {formData.shippingAddresses.map((addr, index) => (
                  <div
                    key={index}
                    className="border border-purple-500/20 p-4 rounded-2xl bg-[#101028]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white/90">
                        Address {index + 1}
                      </p>

                      <label className="flex items-center gap-2 text-xs text-white/70">
                        <input
                          type="radio"
                          name="defaultAddress"
                          checked={addr.isDefault}
                          onChange={() => setDefaultAddress(index)}
                          disabled={success}
                          className="accent-purple-500 disabled:opacity-60"
                        />
                        Default
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="text"
                        name="streetAddress"
                        placeholder="Street address"
                        value={addr.streetAddress}
                        onChange={(e) => handleAddressChange(index, e)}
                        disabled={success}
                        className="p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="city"
                          placeholder="City / Town"
                          value={addr.city}
                          onChange={(e) => handleAddressChange(index, e)}
                          disabled={success}
                          className="p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                        />

                        <input
                          type="text"
                          name="state"
                          placeholder="State / Province"
                          value={addr.state}
                          onChange={(e) => handleAddressChange(index, e)}
                          disabled={success}
                          className="p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="country"
                          placeholder="Country"
                          value={addr.country}
                          onChange={(e) => handleAddressChange(index, e)}
                          disabled={success}
                          className="p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                        />

                        <input
                          type="text"
                          name="postalCode"
                          placeholder="Postal code"
                          value={addr.postalCode}
                          onChange={(e) => handleAddressChange(index, e)}
                          disabled={success}
                          className="p-3 rounded-xl bg-[#11112a] border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Primary CTA */}
              {!success ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 transition p-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create account"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToPaymentMethods}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 transition p-3 rounded-xl font-bold shadow-lg"
                >
                  Continue to Payment Methods
                </button>
              )}

              {/* Login link */}
              <div className="text-center text-sm text-white/70">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                >
                  Log in
                </Link>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            © 2026 MerqNet. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
