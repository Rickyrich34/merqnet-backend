import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import Galactic1 from "../assets/Galactic1.png";

export default function Privacy() {
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
            <h1 className="text-3xl font-semibold text-cyan-300">
              MerqNet Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Effective date: {new Date().toLocaleDateString("en-US")} • This
              explains how MerqNet handles data.
            </p>

            <div className="mt-8 space-y-7 text-sm leading-6 text-white/85">
              <section>
                <h2 className="text-base font-semibold text-white">
                  1) Overview
                </h2>
                <p className="mt-2 text-white/75">
                  This Privacy Policy describes what information MerqNet
                  (“MerqNet”, “we”, “us”) collects, how we use it, and the
                  choices you have. By using MerqNet, you agree to this Policy.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">
                  2) Information We Collect
                </h2>
                <ul className="mt-2 list-disc pl-5 text-white/75 space-y-1">
                  <li>
                    <span className="text-white/85 font-semibold">
                      Account info:
                    </span>{" "}
                    name, email, phone (if provided), profile details.
                  </li>
                  <li>
                    <span className="text-white/85 font-semibold">
                      Transaction info:
                    </span>{" "}
                    requests, bids, receipts, ratings, and related messages.
                  </li>
                  <li>
                    <span className="text-white/85 font-semibold">
                      Payment info:
                    </span>{" "}
                    processed by third-party providers (e.g., Stripe). MerqNet
                    does not store full card numbers.
                  </li>
                  <li>
                    <span className="text-white/85 font-semibold">
                      Usage data:
                    </span>{" "}
                    device/browser info, log data, app interactions, and
                    diagnostic events.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">
                  3) How We Use Information
                </h2>
                <ul className="mt-2 list-disc pl-5 text-white/75 space-y-1">
                  <li>
                    To provide and improve the Platform (login, requests, offers,
                    payments, receipts, messaging).
                  </li>
                  <li>
                    To help users complete transactions and maintain records.
                  </li>
                  <li>To prevent fraud, abuse, and security issues.</li>
                  <li>To provide customer support and resolve disputes.</li>
                  <li>To comply with legal obligations.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">
                  4) Sharing of Information
                </h2>
                <p className="mt-2 text-white/75">
                  We share information only as needed to run the Platform:
                </p>
                <ul className="mt-2 list-disc pl-5 text-white/75 space-y-1">
                  <li>
                    <span className="text-white/85 font-semibold">
                      Between buyers and sellers:
                    </span>{" "}
                    info necessary to complete a transaction (e.g., order details,
                    delivery expectations, and messaging).
                  </li>
                  <li>
                    <span className="text-white/85 font-semibold">
                      Service providers:
                    </span>{" "}
                    payment processors, hosting, analytics, and support tools,
                    under confidentiality and security obligations.
                  </li>
                  <li>
                    <span className="text-white/85 font-semibold">
                      Legal / compliance:
                    </span>{" "}
                    when required by law or to protect rights, safety, and
                    security.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">
                  5) Payments (Stripe and Similar Providers)
                </h2>
                <p className="mt-2 text-white/75">
                  Payments may be processed by third parties such as Stripe. Your
                  payment details are handled under the payment provider’s
                  security and privacy policies. MerqNet may store limited
                  payment metadata (e.g., card brand and last 4 digits) for
                  display, but not full card numbers.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">
                  6) Data Retention
                </h2>
                <p className="mt-2 text-white/75">
                  We retain information as long as necessary to provide the
                  Platform, comply with legal obligations, resolve disputes, and
                  enforce agreements. Receipts and transaction history may be
                  kept for recordkeeping and security.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">7) Security</h2>
                <p className="mt-2 text-white/75">
                  We use reasonable administrative, technical, and physical
                  measures to protect data. No method of transmission or storage
                  is 100% secure, so we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">
                  8) Your Choices
                </h2>
                <ul className="mt-2 list-disc pl-5 text-white/75 space-y-1">
                  <li>
                    You can update profile details in Settings/Profile pages (if
                    enabled).
                  </li>
                  <li>You can choose what you share in messages.</li>
                  <li>
                    You can request support for account questions via the Help
                    section.
                  </li>
                </ul>
              </section>

              {/* ✅ REPLACED SECTION */}
              <section>
                <h2 className="text-base font-semibold text-white">
                  9) Age Requirement (18+)
                </h2>
                <p className="mt-2 text-white/75">
                  MerqNet is intended for users who are at least{" "}
                  <span className="text-white/85 font-semibold">18 years old</span>.
                  We do not knowingly collect personal information from anyone
                  under 18. If you believe a minor has provided personal data,
                  please contact support so we can remove it.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">
                  10) Changes to This Policy
                </h2>
                <p className="mt-2 text-white/75">
                  We may update this Privacy Policy from time to time. Continued
                  use of MerqNet after changes means you accept the updated
                  Policy.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white">11) Contact</h2>
                <p className="mt-2 text-white/75">
                  For privacy questions, use the Help page or contact the
                  support channel listed in the app.
                </p>
              </section>

              <div className="mt-8 rounded-xl border border-white/15 bg-black/35 p-4 text-xs text-white/70">
                <p>
                  <span className="text-white/85 font-semibold">Note:</span>{" "}
                  This policy is a practical app-level privacy statement. For
                  formal compliance (GDPR/CCPA, etc.), have a lawyer review and
                  tailor it to your jurisdiction and data flows.
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 border-t border-white/10 bg-black/20 flex items-center justify-between">
            <p className="text-xs text-white/55">© {new Date().getFullYear()} MerqNet</p>
            <button
              onClick={() => navigate("/login")}
              className="text-xs rounded-xl border border-cyan-300/30 bg-cyan-500/10 hover:bg-cyan-500/15 transition px-4 py-2 text-cyan-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
