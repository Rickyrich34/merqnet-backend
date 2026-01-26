import React from "react";
import { useNavigate } from "react-router-dom";
import { Swords, Trophy } from "lucide-react";
import logopic2 from "../assets/logopic2.png";

const Home = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("userToken");
    navigate(token ? "/dashboard" : "/login");
  };

  return (
    <div className="min-h-[100dvh] bg-[#05040b] text-white overflow-hidden pt-24 pb-[14rem] sm:pb-24">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#05040b]" />
        <div
          className="absolute inset-0 opacity-95"
          style={{
            background:
              "radial-gradient(900px 700px at 50% 32%, rgba(255,140,0,0.10), transparent 60%), radial-gradient(900px 700px at 50% 55%, rgba(255,0,200,0.08), transparent 62%), radial-gradient(900px 700px at 50% 62%, rgba(0,200,255,0.08), transparent 64%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
        <div className="absolute inset-0 opacity-[0.12] mix-blend-soft-light bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_3px,transparent_7px)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:6px_6px]" />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-120%); opacity: 0; }
          20% { opacity: 1; }
          50% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes floaty {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulseGlow {
          0% { filter: drop-shadow(0 0 14px rgba(34,211,238,0.20)); }
          50% { filter: drop-shadow(0 0 22px rgba(34,211,238,0.38)); }
          100% { filter: drop-shadow(0 0 14px rgba(34,211,238,0.20)); }
        }
      `}</style>

      <main className="max-w-4xl mx-auto px-4">
        <section className="pt-6 pb-10">
          <div className="w-full text-center flex flex-col items-center">
            {/* TITLE */}
            <h1
              className="
                text-5xl sm:text-7xl font-black tracking-tight
                bg-gradient-to-r from-yellow-200 via-amber-400 to-orange-500
                bg-clip-text text-transparent
                drop-shadow-[0_6px_30px_rgba(0,0,0,0.65)]
              "
            >
              MerqNet
            </h1>

            {/* Tagline */}
            <div className="mt-4 flex justify-center w-full">
              <div className="relative inline-flex items-center justify-center px-5 py-2 rounded-full border border-white/12 bg-white/[0.04] backdrop-blur shadow-[0_18px_55px_rgba(0,0,0,0.65)] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 w-1/2 opacity-60"
                  style={{
                    animation: "shimmer 2.8s ease-in-out infinite",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(34,211,238,0.14), transparent)",
                  }}
                />
                <span className="relative text-[11px] sm:text-sm font-black tracking-[0.22em] uppercase text-white/95">
                  <span className="text-cyan-200">The buyer</span> is in control.
                </span>
              </div>
            </div>

            {/* Dog */}
            <div className="mt-2 flex justify-center w-full">
              <div className="relative w-[280px] sm:w-[430px] max-w-full">
                {/* CONTROL YOUR GAME — anchored to the dog container (no layout shift) */}
                <div className="absolute top-[18%] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <span
                    className="
                      text-cyan-200/70
                      text-sm sm:text-base
                      font-extrabold
                      tracking-[0.45em]
                      uppercase
                      select-none
                      whitespace-nowrap
                    "
                    style={{ textShadow: "0 0 20px rgba(34,211,238,0.45)" }}
                  >
                    CONTROL&nbsp;YOUR&nbsp;GAME
                  </span>
                </div>

                <div
                  className="absolute -inset-16 rounded-full blur-3xl opacity-35"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(255,180,60,0.18), rgba(255,0,200,0.10), rgba(0,200,255,0.10), transparent 70%)",
                  }}
                />
                <img
                  src={logopic2}
                  alt="MerqNet"
                  className="relative w-full h-auto select-none"
                  draggable="false"
                  style={{ animation: "floaty 4.2s ease-in-out infinite" }}
                />
              </div>
            </div>

            {/* CTA */}
            <div className="-mt-8 sm:mt-4 flex justify-center w-full">
              <button
                onClick={handleEnter}
                className="relative w-[260px] rounded-xl px-10 py-3 font-extrabold tracking-[0.20em] uppercase border border-cyan-200/55 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.22)] hover:border-cyan-200/75 hover:bg-cyan-400/15 transition"
                style={{ animation: "pulseGlow 2.6s ease-in-out infinite" }}
              >
                ENTER
              </button>
            </div>

            {/* Mission */}
            <div className="mt-6 flex justify-center w-full">
              <div className="relative inline-flex items-center justify-center px-5 py-2 rounded-full border border-white/12 bg-white/[0.04] backdrop-blur shadow-[0_18px_55px_rgba(0,0,0,0.65)] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 w-1/2 opacity-60"
                  style={{
                    animation: "shimmer 2.8s ease-in-out infinite",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(34,211,238,0.14), transparent)",
                  }}
                />
                <span className="relative inline-flex items-center gap-2 whitespace-nowrap text-[11px] sm:text-sm font-black tracking-[0.22em] uppercase text-white/95">
                  <Swords className="w-4 h-4 text-fuchsia-200" />
                  <span className="text-cyan-200">Vendors compete</span>
                  <span className="text-white/35">—</span>
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span className="text-amber-300">You win</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
