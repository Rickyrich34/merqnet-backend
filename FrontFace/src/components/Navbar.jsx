// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import logopic2 from "../assets/logopic2.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const API = useMemo(() => {
    const raw = import.meta.env.VITE_API_URL || "";
    return typeof raw === "string" ? raw.replace(/\/$/, "") : "";
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const getToken = () =>
    localStorage.getItem("userToken") || localStorage.getItem("token") || "";

  const getUserId = () => localStorage.getItem("userId") || "";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const token = getToken();
    const userId = getUserId();

    setIsLoggedIn(!!token);

    if (!token || !userId || !API) return;

    fetch(`${API}/api/users/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        const email =
          data?.email || data?.user?.email || data?.profile?.email || "";
        if (email) {
          setUserEmail(email);
          localStorage.setItem("userEmail", email);
        }
      })
      .catch(() => {});
  }, [location.pathname, API]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setUserEmail("");
    setMobileOpen(false);
    navigate("/login");
  };

  const linkBase =
    "text-white font-semibold text-sm sm:text-base drop-shadow-[0_0_6px_rgba(255,255,255,0.85)] hover:opacity-90 transition";

  const mobileLink =
    "w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition text-white font-semibold";

  return (
    <nav
      id="merqnet-navbar"
      data-navbar="merqnet"
      className="fixed top-0 left-0 w-full z-50 bg-[#070615]/90 backdrop-blur-md"
    >
      <div className="flex justify-between items-center px-4 sm:px-10 py-3 sm:py-4">
        {/* Left: Logo + Title + Email */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={isLoggedIn ? "/dashboard" : "/"}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="relative shrink-0 flex items-center">
              <img
                src={logopic2}
                alt="MerqNet"
                className="
                  w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
                  object-contain
                  brightness-110 contrast-140 saturate-110
                  drop-shadow-[0_6px_18px_rgba(0,0,0,0.9)]
                "
              />
            </div>

            <span
              className="
                text-xl sm:text-2xl font-black tracking-tight
                bg-gradient-to-r from-yellow-200 via-amber-400 to-orange-500
                bg-clip-text text-transparent
                drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]
                whitespace-nowrap
              "
            >
              MerqNet
            </span>
          </Link>

          {isLoggedIn && (
            <span className="text-purple-200 text-xs sm:text-sm truncate max-w-[45vw] sm:max-w-none drop-shadow-[0_0_6px_rgba(200,100,255,0.8)]">
              {userEmail || localStorage.getItem("userEmail") || ""}
            </span>
          )}
        </div>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-4 sm:gap-8">
          {!isLoggedIn ? (
            <>
              {location.pathname !== "/" && (
                <Link to="/" className={linkBase}>
                  Home
                </Link>
              )}
              {location.pathname !== "/login" && (
                <Link to="/login" className={linkBase}>
                  Login
                </Link>
              )}
              {location.pathname !== "/signup" && (
                <Link to="/signup" className={linkBase}>
                  Signup
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/dashboard" className={linkBase}>
                Dashboard
              </Link>
              <Link to="/messages" className={linkBase}>
                Messages
              </Link>
              <Link to="/history" className={linkBase}>
                History
              </Link>
              <Link to="/profile" className={linkBase}>
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="text-red-300 font-semibold text-sm sm:text-base drop-shadow-[0_0_6px_rgba(255,120,120,0.9)] hover:opacity-90 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-xl p-2 border border-white/10 bg-white/5 hover:bg-white/10 transition"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? (
            <X className="text-white" size={22} />
          ) : (
            <Menu className="text-white" size={22} />
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden px-3 pb-4">
          <div className="rounded-2xl border border-white/10 bg-[#060417]/95 backdrop-blur-md shadow-[0_0_25px_rgba(160,90,255,0.25)] overflow-hidden">
            {!isLoggedIn ? (
              <div className="flex flex-col">
                {location.pathname !== "/" && (
                  <Link to="/" className={mobileLink}>
                    Home
                  </Link>
                )}
                {location.pathname !== "/login" && (
                  <Link to="/login" className={mobileLink}>
                    Login
                  </Link>
                )}
                {location.pathname !== "/signup" && (
                  <Link to="/signup" className={mobileLink}>
                    Signup
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <Link to="/dashboard" className={mobileLink}>
                  Dashboard
                </Link>
                <Link to="/messages" className={mobileLink}>
                  Messages
                </Link>
                <Link to="/history" className={mobileLink}>
                  History
                </Link>
                <Link to="/profile" className={mobileLink}>
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className={`${mobileLink} text-red-300`}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
