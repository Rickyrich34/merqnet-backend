import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top spacer for Navbar */}
      <div className="pt-24 pb-20 px-4">
        {/* Hero */}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6">
            {/* Neon icon (simple + clean, no external libs) */}
            <div className="relative mt-2">
              <div className="absolute inset-0 blur-3xl opacity-40 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 rounded-full" />
              <div className="relative h-24 w-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_60px_rgba(0,0,0,0.6)]">
                <span className="text-5xl">🐶</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.6)]" />
              Reverse-auction marketplace • Buyer controls the deal
            </div>

            <div className="w-full rounded-3xl bg-gradient-to-b from-purple-950/40 to-black/40 border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_90px_rgba(0,0,0,0.75)] p-8 md:p-10">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                About <span className="text-cyan-300">MerqNet</span>
              </h1>

              <p className="mt-4 text-white/80 leading-relaxed max-w-3xl mx-auto">
                MerqNet is a reverse-auction marketplace where buyers control the
                negotiation, and sellers compete to offer the best deals. No
                middlemen. No inflated prices. Just direct connection.
              </p>

              <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* How it works */}
              <h2 className="mt-10 text-xl md:text-2xl font-extrabold text-cyan-200">
                How it works
              </h2>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="flex items-center gap-2 text-white/90 font-bold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      🧾
                    </span>
                    1) Buyer posts a request
                  </div>
                  <p className="mt-3 text-sm text-white/75 leading-relaxed">
                    You describe what you need (category, quantity, specs).
                    Sellers see it and compete.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="flex items-center gap-2 text-white/90 font-bold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      🏷️
                    </span>
                    2) Sellers submit offers
                  </div>
                  <p className="mt-3 text-sm text-white/75 leading-relaxed">
                    Sellers propose pricing and delivery. You can review and
                    compare offers.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="flex items-center gap-2 text-white/90 font-bold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      🏆
                    </span>
                    3) Buyer chooses the winner
                  </div>
                  <p className="mt-3 text-sm text-white/75 leading-relaxed">
                    You decide what matters most—price, location, reputation,
                    speed—your call.
                  </p>
                </div>
              </div>

              {/* Why different */}
              <h2 className="mt-12 text-xl md:text-2xl font-extrabold text-fuchsia-200">
                Why MerqNet is different
              </h2>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      🌎
                    </span>
                    Global seller reach
                  </div>
                  <p className="mt-3 text-sm text-white/75 leading-relaxed">
                    Get access to more options and better competition, not just
                    whoever is nearby.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      🔎
                    </span>
                    Transparent negotiation
                  </div>
                  <p className="mt-3 text-sm text-white/75 leading-relaxed">
                    Offers are clear, comparable, and structured—no mystery
                    pricing games.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      💬
                    </span>
                    Buyer-controlled communication
                  </div>
                  <p className="mt-3 text-sm text-white/75 leading-relaxed">
                    Buyers decide when to engage with sellers. Clean, private
                    conversations per request.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      ⚡
                    </span>
                    Faster decision-making
                  </div>
                  <p className="mt-3 text-sm text-white/75 leading-relaxed">
                    Post a request once, get competing offers—choose the winner
                    without chasing quotes.
                  </p>
                </div>
              </div>

              {/* Built for both sides */}
              <h2 className="mt-12 text-xl md:text-2xl font-extrabold text-cyan-200">
                Built for both sides
              </h2>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <h3 className="font-extrabold">For Buyers</h3>
                  <ul className="mt-3 text-sm text-white/75 space-y-2 list-disc list-inside">
                    <li>Control the negotiation and pick the winner.</li>
                    <li>Compare offers quickly, clearly, and fairly.</li>
                    <li>
                      Decide based on more than price (reputation, delivery,
                      locality).
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <h3 className="font-extrabold">For Sellers</h3>
                  <ul className="mt-3 text-sm text-white/75 space-y-2 list-disc list-inside">
                    <li>Get visibility in active buyer demand—real opportunities.</li>
                    <li>Compete on value: price, speed, trust, and service.</li>
                    <li>Build reputation and win better deals over time.</li>
                  </ul>
                </div>
              </div>

              {/* Trust + Testimonials + Fee */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <h3 className="font-extrabold">Trust &amp; Safety</h3>
                  <ul className="mt-3 text-sm text-white/75 space-y-2 list-disc list-inside">
                    <li>Ratings + reputation for accountability.</li>
                    <li>Secure payments and clear records.</li>
                    <li>Private messaging per request.</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <h3 className="font-extrabold text-yellow-200">
                    What people say
                  </h3>
                  <div className="mt-3 text-sm text-white/75 space-y-3">
                    <p className="italic">
                      “I posted once and got multiple offers in minutes.”
                    </p>
                    <p className="italic">
                      “Feels like a professional negotiation, not a guessing game.”
                    </p>
                    <p className="italic">
                      “As a seller, I finally see real demand instead of cold marketing.”
                    </p>
                  </div>
                </div>
              </div>

              {/* Fee section (6%) */}
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-900/20 via-purple-900/20 to-fuchsia-900/20 border border-white/10 p-5">
                <h3 className="font-extrabold text-cyan-200">
                  Service fee (6%)
                </h3>
                <p className="mt-2 text-sm text-white/80 leading-relaxed">
                  MerqNet charges a <span className="font-bold">6% service fee</span>{" "}
                  on successful transactions processed through{" "}
                  <span className="font-bold">Stripe</span>. This helps cover
                  payment processing and infrastructure costs, including{" "}
                  <span className="font-bold">MongoDB</span>, hosting, security,
                  and any other tools/services we use to keep the platform
                  running smoothly.
                </p>
                <p className="mt-2 text-xs text-white/60">
                  Note: Fees may be shown at checkout; additional taxes may apply
                  depending on your location.
                </p>
              </div>

              {/* CTA */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/create-request")}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold
                             bg-gradient-to-r from-cyan-600 to-teal-500
                             hover:from-cyan-500 hover:to-teal-400 transition
                             shadow-[0_10px_30px_rgba(34,211,238,0.25)]
                             focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                >
                  Create a Request →
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold
                             bg-white/5 hover:bg-white/10 border border-white/10 transition
                             shadow-[0_0_0_1px_rgba(255,255,255,0.06)]
                             focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                >
                  Go to Dashboard
                </button>
              </div>

              <p className="mt-8 text-center text-sm text-white/60">
                Welcome to the next generation of global trading.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
