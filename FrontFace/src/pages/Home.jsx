import React from "react";
import { useNavigate } from "react-router-dom";
import logopic2 from "../assets/logopic2.png";

const Home = () => {
  const navigate = useNavigate();

  // ONE CTA ONLY: ENTER
  // If logged in -> dashboard, else -> login
  const handleEnter = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("userToken");
    navigate(token ? "/dashboard" : "/login");
  };

  return (
    <div
      className="
        text-white overflow-hidden
        [min-height:100svh]
        bg-[#05040b]
        pt-[calc(5.5rem+env(safe-area-inset-top))]
        pb-[calc(7.5rem+env(safe-area-inset-bottom))]
      "
    >
      {/* Minimal background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#05040b]" />
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(900px 700px at 45% 18%, rgba(255,80,200,0.10), transparent 60%), radial-gradient(900px 700px at 55% 60%, rgba(0,180,255,0.10), transparent 62%), radial-gradient(900px 700px at 55% 42%, rgba(255,170,0,0.07), transparent 60%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/70" />
      </div>

      <main className="max-w-xl mx-auto px-4">
        {/* Use flex + 100svh so ENTER is visible without scroll on mobile */}
        <section className="min-h-[calc(100svh-13rem)] flex items-center justify-center">
          <div className="w-full text-center">
            {/* MERQNET title */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-orange-400">
                MERQ
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500">
                NET
              </span>
            </h1>

            <p className="mt-2 text-sm sm:text-base text-white/75">
              The buyer is in control.
            </p>

            {/* BIG dog/logo - scale down on mobile so the CTA stays visible */}
            <div className="mt-4 flex justify-center">
              <div className="relative w-[280px] sm:w-[430px] max-w-full">
                <div className="absolute -inset-10 rounded-full blur-3xl opacity-55 bg-gradient-to-r from-fuchsia-500/25 via-orange-400/20 to-cyan-400/20" />
                <img
                  src={logopic2}
                  alt="MerqNet neon dog"
                  className="relative w-full h-auto select-none"
                  draggable="false"
                />
              </div>
            </div>

            {/* 3-step line */}
            <p className="mt-3 text-sm sm:text-base font-semibold text-white/85">
              Request <span className="text-white/40">—</span> Vendors compete{" "}
              <span className="text-white/40">—</span> You save
            </p>

            {/* Single CTA */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleEnter}
                className="relative w-[260px] rounded-xl px-10 py-3 font-extrabold tracking-wide
                           border border-cyan-200/55 bg-cyan-400/10
                           shadow-[0_0_30px_rgba(34,211,238,0.22)]
                           hover:border-cyan-200/75 hover:bg-cyan-400/15 hover:shadow-[0_0_38px_rgba(34,211,238,0.28)]
                           transition"
              >
                ENTER
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
