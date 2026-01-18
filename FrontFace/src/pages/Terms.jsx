import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import Galactic1 from "../assets/Galactic1.png";

export default function Terms() {
  const navigate = useNavigate();

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
        <div className="absolute inset-0 bg-black/55" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 600px at 20% 10%, rgba(255,140,0,0.12), transparent 55%), radial-gradient(900px 650px at 80% 25%, rgba(0,255,255,0.10), transparent 60%), radial-gradient(900px 700px at 50% 85%, rgba(255,0,255,0.08), transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto pt-32 px-6 pb-20">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/15 bg-[#0b0a1c]/70 hover:bg-[#0b0a1c]/85 transition backdrop-blur-md text-white/80 hover:text-white"
          aria-label="Back"
          title="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="mt-6 rounded-2xl border border-white/15 bg-[#0b0a1c]/80 backdrop-blur-md shadow-[0_18px_70px_rgba(0,0,0,0.65)] overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-semibold text-emerald-300">MerqNet Terms of Service</h1>
            <p className="mt-2 text-sm text-white/70">
              Effective date: {new Date().toLocaleDateString("en-US")} • Please read carefully.
            </p>

            <div className="mt-8 space-y-7 text-sm leading-6 text-white/85">
              <section>
                <h2 className="text-base font-semibold text-white">1) Agreement to Terms</h2>
                <p className="mt-2 text-white/75">
                  By accessing or using MerqNet (the “Platform”), you agree to these Terms of Service (“Terms”).
                  If you do not agree, do not use the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">2) What MerqNet Is</h2>
                <p className="mt-2 text-white/75">
                  MerqNet is a marketplace platform that helps buyers create requests and helps sellers submit offers (“bids”).
                  MerqNet is not the seller, not the buyer, and does not take ownership of items. MerqNet facilitates communication,
                  offer selection, and payment flow.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">3) Eligibility & Accounts</h2>
                <ul className="mt-2 list-disc pl-5 text-white/75 space-y-1">
                  <li>You must provide accurate registration information and keep it updated.</li>
                  <li>You are responsible for safeguarding your login credentials.</li>
                  <li>You are responsible for activity that occurs under your account.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">4) Buyer Commitments (Paying)</h2>
                <p className="mt-2 text-white/75">
                  When a buyer clicks <span className="text-white font-semibold">Pay</span> (or completes payment),
                  the buyer is committing to purchase under the terms shown at checkout (price, quantity, delivery time, and any
                  stated conditions). The buyer is responsible for:
                </p>
                <ul className="mt-2 list-disc pl-5 text-white/75 space-y-1">
                  <li>Reviewing offer details before accepting and paying.</li>
                  <li>Providing accurate shipping and contact information.</li>
                  <li>Paying the full amount shown at checkout (including any applicable taxes/fees, if displayed).</li>
                  <li>Communicating promptly with the seller if issues arise.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">5) Seller Commitments (Shipping / Delivery)</h2>
                <p className="mt-2 text-white/75">
                  When a seller submits an offer and it is accepted and paid, the seller is committing to fulfill that order
                  under the agreed terms. The seller is responsible for:
                </p>
                <ul className="mt-2 list-disc pl-5 text-white/75 space-y-1">
                  <li>Shipping/delivering within the stated timeframe (or better).</li>
                  <li>Providing items that match the description and condition selected.</li>
                  <li>Communicating clearly with the buyer about fulfillment status.</li>
                  <li>Following applicable laws and not listing prohibited items.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">6) Offers, Acceptance, and Order Status</h2>
                <ul className="mt-2 list-disc pl-5 text-white/75 space-y-1">
                  <li>Only sellers place bids/offers. Buyers select which offer to accept.</li>
                  <li>Once payment is completed, the request should be treated as purchased and moved to history/receipt tracking.</li>
                  <li>Receipts serve as proof of purchase and are used for ratings and support.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">7) Payments</h2>
                <p className="mt-2 text-white/75">
                  Payments may be processed by third-party payment processors (e.g., Stripe). MerqNet does not store full card details.
                  You authorize MerqNet and its payment processor to process payments you approve.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">8) Disputes, Issues, and Support</h2>
                <p className="mt-2 text-white/75">
                  If a problem occurs (non-delivery, incorrect items, or other issues), the buyer and seller should first attempt to resolve
                  the issue through the Platform’s messaging system. MerqNet may provide support tools, but MerqNet is not a court and does not guarantee outcomes.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">9) Ratings and Feedback</h2>
                <p className="mt-2 text-white/75">
                  Ratings are meant to reflect the real experience. You agree not to post fraudulent, abusive, or manipulated ratings.
                  MerqNet may remove ratings that violate these Terms or applicable policies.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">10) Prohibited Use</h2>
                <ul className="mt-2 list-disc pl-5 text-white/75 space-y-1">
                  <li>Illegal items, stolen goods, or items that violate applicable laws.</li>
                  <li>Harassment, threats, hate, or abusive conduct.</li>
                  <li>Fraud, chargeback abuse, or deceptive practices.</li>
                  <li>Attempting to bypass platform flows that exist for safety and recordkeeping.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">11) Limitation of Liability</h2>
                <p className="mt-2 text-white/75">
                  To the maximum extent permitted by law, MerqNet is not liable for indirect, incidental, special, consequential, or punitive damages,
                  or any loss of profits, data, or goodwill, arising from your use of the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">12) Termination</h2>
                <p className="mt-2 text-white/75">
                  MerqNet may suspend or terminate accounts that violate these Terms, applicable policies, or laws, or that pose risk to the Platform or users.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">13) Changes to Terms</h2>
                <p className="mt-2 text-white/75">
                  MerqNet may update these Terms from time to time. Continued use after changes means you accept the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">14) Contact</h2>
                <p className="mt-2 text-white/75">
                  For support, use the Help page or contact the MerqNet support channel listed in the app.
                </p>
              </section>

              <div className="mt-8 rounded-xl border border-white/15 bg-black/35 p-4 text-xs text-white/70">
                <p>
                  <span className="text-white/85 font-semibold">Important:</span> This document is a general Terms of Service template for MerqNet’s flow.
                  If you want it “real legal”, have a lawyer review and adapt it for your jurisdiction and business structure.
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 border-t border-white/10 bg-black/20 flex items-center justify-between">
            <p className="text-xs text-white/55">© {new Date().getFullYear()} MerqNet</p>
            <button
              onClick={() => navigate("/signup")}
              className="text-xs rounded-xl border border-emerald-300/30 bg-emerald-500/15 hover:bg-emerald-500/20 transition px-4 py-2 text-emerald-200"
            >
              Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
