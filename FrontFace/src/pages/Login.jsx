import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    acceptTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ IMPORTANT:
  // - In DEV: allow localhost fallback for local backend dev.
  // - In PROD: DO NOT fallback. Force VITE_API_URL to be set in Vercel.
  const API_BASE = useMemo(() => {
    const fromEnv = import.meta.env.VITE_API_URL;

    if (fromEnv && typeof fromEnv === "string") return fromEnv.replace(/\/$/, "");

    if (import.meta.env.DEV) return "http://localhost:5000";

    return ""; // production must not guess
  }, []);

  const API_LOGIN_URL = useMemo(() => {
    if (!API_BASE) return "";
    return `${API_BASE}/api/users/login`;
  }, [API_BASE]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    if (!API_BASE || !API_LOGIN_URL) {
      return "Missing VITE_API_URL in production. Set it in Vercel → Project → Settings → Environment Variables.";
    }
    if (!formData.email.trim()) return "Email is required.";
    if (!formData.password) return "Password is required.";
    if (!formData.acceptTerms) return "You must accept the Terms to continue.";
    return "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setLoading(true);

      // ✅ IMPORTANT: Prove which URL production is actually calling
      console.log("LOGIN URL =>", API_LOGIN_URL);

      const res = await axios.post(
        API_LOGIN_URL,
        {
          email: formData.email.trim(),
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: false,
          timeout: 15000, // ✅ prevents “forever logging in”
        }
      );

      // Adjust these keys only if your backend uses different names
      const token =
        res?.data?.token ||
        res?.data?.userToken ||
        res?.data?.accessToken ||
        "";

      const userId =
        res?.data?.userId ||
        res?.data?.user?._id ||
        res?.data?._id ||
        "";

      if (!token) {
        throw new Error("Login succeeded but token was not returned by backend.");
      }

      // ✅ Keep consistent with your existing app usage
      localStorage.setItem("userToken", token);
      if (userId) localStorage.setItem("userId", userId);

      // ✅ Send user to dashboard after login
      navigate("/dashboard");
    } catch (err) {
      const isTimeout = err?.code === "ECONNABORTED";

      const msg = isTimeout
        ? "Login request timed out (15s). Backend may be sleeping, unreachable, or blocked by CORS."
        : err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Login failed.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-fuchsia-600/30" />
        <div className="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full blur-3xl bg-cyan-500/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      </div>

      <div className="relative z-10 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-2xl p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight">
              MerqNet <span className="text-cyan-300">Login</span>
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Enter your credentials to access your dashboard.
            </p>

            {/* Helpful prod hint */}
            {!import.meta.env.DEV && !API_BASE && (
              <div className="mt-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-xs text-yellow-100">
                <b>Config needed:</b> Set <code className="px-1">VITE_API_URL</code> in Vercel or login will try to hit localhost.
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 accent-cyan-400"
              />
              <p className="text-sm text-white/75 leading-snug">
                I agree to the{" "}
                <Link to="/terms" className="text-cyan-300 hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-cyan-300 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 font-bold text-black shadow-lg shadow-fuchsia-500/20 hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="flex items-center justify-between text-sm text-white/70">
              <Link to="/signup" className="text-cyan-300 hover:underline">
                Don’t have an account? Sign up
              </Link>

              <Link to="/help" className="text-white/70 hover:text-white">
                Need help?
              </Link>
            </div>

            {/* Debug line (optional) */}
            <div className="pt-2 text-[11px] text-white/35">
              API: {API_BASE ? API_BASE : "(missing in production)"}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
