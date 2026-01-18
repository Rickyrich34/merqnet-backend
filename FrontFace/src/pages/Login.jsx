import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // IMPORTANT: Trim whitespace/newlines from Vercel env var and remove trailing slash
  const API_BASE = (() => {
    const raw = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return String(raw).trim().replace(/\/+$/, "");
  })();

  const parseLoginPayload = (data) => {
    const token =
      data?.token ||
      data?.accessToken ||
      data?.jwt ||
      data?.data?.token ||
      null;

    const userId =
      data?.userId ||
      data?.id ||
      data?._id ||
      data?.user?._id ||
      data?.user?.id ||
      data?.data?.userId ||
      data?.data?.user?._id ||
      null;

    return { token, userId };
  };

  const hardRedirect = (path) => {
    // Mobile Safari/Android sometimes behaves better with a hard redirect
    window.location.assign(path);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accepted) {
      setError("You must accept the terms to continue.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `${API_BASE}/api/users/login`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!isJson) {
        await res.text();
        throw new Error(
          `Login failed (${res.status}). Server returned non-JSON response.`
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Login failed");
      }

      const { token, userId } = parseLoginPayload(data);

      if (!token || !userId) {
        throw new Error(
          "Login succeeded but backend did not return token/userId."
        );
      }

      // ✅ Store in BOTH keys so nothing breaks anywhere (especially mobile guards)
      localStorage.setItem("token", token);
      localStorage.setItem("userToken", token);

      localStorage.setItem("userId", userId);
      localStorage.setItem("userID", userId);

      // ✅ Navigate (soft), then fallback (hard) if mobile acts weird
      navigate("/dashboard");
      setTimeout(() => {
        if (window.location.pathname !== "/dashboard") {
          hardRedirect("/dashboard");
        }
      }, 200);
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        flex flex-col
        bg-gradient-to-b from-[#05050c] to-[#0a0a1a]
        text-white
        px-4
        [min-height:100svh]
        pt-[calc(5rem+env(safe-area-inset-top))]
        pb-[calc(7.5rem+env(safe-area-inset-bottom))]
      "
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[380px] bg-[#0c0c1c] p-8 rounded-2xl shadow-xl border border-purple-500/20"
        >
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1 text-sm">Email</label>
            <input
              type="email"
              className="w-full p-2 rounded bg-[#11112a] border border-purple-500/20 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm">Password</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-[#11112a] border border-purple-500/20 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-start gap-2 mb-4 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>
              By logging in, you accept our{" "}
              <Link
                to="/terms"
                className="text-purple-400 hover:underline underline-offset-2"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-purple-400 hover:underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 transition p-2 rounded font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

          <div className="mt-4 text-center text-sm text-white/70">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
            >
              Sign up
            </Link>
          </div>

          <button
            type="button"
            onClick={() => navigate("/about")}
            className="mt-4 w-full text-sm text-cyan-300/80 hover:text-cyan-200 transition text-center"
          >
            How it works?
          </button>
        </form>
      </div>

      <div className="mt-auto text-center text-xs text-gray-500">
        © 2026 MerqNet. All Rights Reserved.
      </div>
    </div>
  );
}
