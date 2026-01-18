import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Gavel,
  Globe,
  ShieldCheck,
  MessageCircle,
  BadgeCheck,
  ArrowRight,
  ShoppingBag,
  Store,
} from "lucide-react";

import logopic2 from "../assets/logopic2.png";

function getToken() {
  return localStorage.getItem("userToken") || localStorage.getItem("token") || "";
}

const About = () => {
  const navigate = useNavigate();

  const hasSession = useMemo(() => Boolean(getToken()), []);
  const primaryCta = hasSession
    ? { label: "Create a Request", to: "/createrequest" }
    : { label: "Login to Get Started", to: "/login" };

  return (
    <div className="min-h-screen flex flex-col bg-[#050017] text-white pt-24 px-5 pb-16">
      {/* LOGO */}
      <div className="flex flex-col items-center mb-8">
        <img
          src={logopic2}
          alt="MerqNet Logo"
          className="w-32 sm:w-40 drop-shadow-[0_0_15px_rgba(255,100,255,0.6)] select-none pointer-events-none"
        />

        <div className="mt-4 inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-purple-600/30 bg-[#0B001F]/75 text-white/75">
          <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
          Reverse-auction marketplace • Buyer controls the deal
        </div>
      </div>

      {/* MAIN CARD */}
      <div
        className="
          bg-[#0B001F]/90
          border border-purple-600/35
          shadow-2xl
          rounded-3xl
          p-6 sm:p-10
          max-w-3xl
          w-full
          mx-auto
        "
      >
        {/* HERO */}
        <h1 className="text-3xl sm:text-4xl font-bold text-purple-200 text-center mb-4">
          About MerqNet
        </h1>

        <p className="text-gray-300 leading-relaxed text-base sm:text-lg">
          MerqNet is a reverse-auction marketplace where <span className="text-white font-semibold">buyers control the negotiation</span>,
          and sellers compete to offer the best deals. No middlemen. No inflated prices. Just direct connection.
        </p>

        {/* DIVIDER */}
        <div className="my-8 h-px bg-white/10" />

        {/* HOW IT WORKS */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-200 mb-4 text-center">
            How it works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-white/90 font-semibold">
                <ShoppingBag className="w-4 h-4 text-cyan-200" />
                1) Buyer posts a request
              </div>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                You describe what you need (category, quantity, specs). Sellers see it and compete.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-white/90 font-semibold">
                <Gavel className="w-4 h-4 text-amber-200" />
                2) Sellers submit offers
              </div>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                Sellers propose pricing and delivery time. You can review and compare offers.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-white/90 font-semibold">
                <BadgeCheck className="w-4 h-4 text-purple-200" />
                3) Buyer chooses the winner
              </div>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                You decide what matters most—price, location, reputation, speed—your call.
              </p>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="my-8 h-px bg-white/10" />

        {/* WHY DIFFERENT */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-purple-200 mb-4 text-center">
            Why MerqNet is different
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 font-semibold text-white/90">
                <Globe className="w-4 h-4 text-cyan-200" />
                Global seller reach
              </div>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                Get access to more options and better competition, not just whoever is nearby.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 font-semibold text-white/90">
                <ShieldCheck className="w-4 h-4 text-amber-200" />
                Transparent negotiation
              </div>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                Offers are clear, comparable, and structured—no mystery pricing games.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 font-semibold text-white/90">
                <MessageCircle className="w-4 h-4 text-purple-200" />
                Buyer-controlled communication
              </div>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                Buyers decide when to engage with sellers. Clean, private conversations.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 font-semibold text-white/90">
                <Sparkles className="w-4 h-4 text-cyan-200" />
                Faster decision-making
              </div>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                Post a request once, get competing offers—choose the winner without chasing quotes.
              </p>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="my-8 h-px bg-white/10" />

        {/* BUYERS vs SELLERS */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-200 mb-4 text-center">
            Built for both sides
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <ShoppingBag className="w-4 h-4 text-cyan-200" />
                For Buyers
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>• Control the negotiation and pick the winner.</li>
                <li>• Compare offers quickly, clearly, and fairly.</li>
                <li>• Decide based on more than price (reputation, delivery, locality).</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Store className="w-4 h-4 text-amber-200" />
                For Sellers
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>• Get visibility in active buyer demand—real opportunities.</li>
                <li>• Compete on value: price, speed, trust, and service.</li>
                <li>• Build reputation and win better deals over time.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="my-8 h-px bg-white/10" />

        {/* TRUST + TESTIMONIALS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-lg font-semibold text-purple-200">Trust & Safety</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              <li>• Ratings + reputation for accountability.</li>
              <li>• Secure payments and clear records.</li>
              <li>• Private messaging per request.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-lg font-semibold text-amber-200">What people say</h3>
            <div className="mt-3 space-y-3 text-sm text-gray-300">
              <p className="italic">“I posted once and got multiple offers in minutes.”</p>
              <p className="italic">“Feels like a professional negotiation, not a guessing game.”</p>
              <p className="italic">“As a seller, I finally see real demand instead of cold marketing.”</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(primaryCta.to)}
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center gap-2
              rounded-2xl
              bg-cyan-400 hover:bg-cyan-300
              text-black font-semibold
              px-6 py-3
              shadow-[0_0_22px_rgba(34,211,238,0.25)]
              transition
            "
          >
            {primaryCta.label}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center gap-2
              rounded-2xl
              border border-white/15
              bg-black/25 hover:bg-black/35
              text-white/85
              px-6 py-3
              transition
            "
          >
            Go to Dashboard
          </button>
        </div>

        <p className="mt-8 text-purple-300 text-center font-semibold text-base sm:text-lg">
          Welcome to the next generation of global trading.
        </p>
      </div>

      <footer className="text-center mt-10 text-gray-500 text-xs">
        © 2025 MerqNet. All Rights Reserved.
      </footer>
    </div>
  );
};

export default About;
