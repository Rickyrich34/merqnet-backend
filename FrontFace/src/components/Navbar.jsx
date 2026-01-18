// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import logopic2 from "../assets/logopic2.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    setIsLoggedIn(!!token);

    if (token && userId) {
      fetch(`http://localhost:5000/api/users/profile/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.email) setUserEmail(data.email);
        })
        .catch(() => {});
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const linkColor =
    "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.85)] font-semibold text-sm sm:text-base";

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#070615]/90 backdrop-blur-md border-b border-white/10">
      <div className="flex justify-between items-center px-4 sm:px-10 py-4 sm:py-5">
        {/* EMAIL */}
        {isLoggedIn && (
          <span className="text-purple-200 text-xs sm:text-sm drop-shadow-[0_0_6px_rgba(200,100,255,0.8)] truncate max-w-[55%] sm:max-w-none">
            {userEmail}
          </span>
        )}

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4 sm:gap-8">
          {!isLoggedIn && (
            <>
              {location.pathname !== "/" && (
                <Link to="/" className={linkColor}>
                  Home
                </Link>
              )}

              {location.pathname !== "/" && location.pathname !== "/login" && (
                <Link to="/login" className={linkColor}>
                  Iniciar sesión
                </Link>
              )}
            </>
          )}

          {isLoggedIn && (
            <>
              {/* 🐶 PERRO GRANDE Y PEGADO A DASHBOARD */}
              <img
                src={logopic2}
                alt="MerqNet"
                className="
                  w-14 h-14
                  object-contain
                  -mr-9
                  brightness-150
                  contrast-150
                  saturate-200
                  drop-shadow-[0_0_16px_#ff00ff]
                  drop-shadow-[0_0_36px_#00ffff]
                  drop-shadow-[0_0_70px_#ff00ff]
                "
              />

              <Link to="/dashboard" className={linkColor}>
                Dashboard
              </Link>

              <Link to="/profile" className={linkColor}>
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="text-red-300 drop-shadow-[0_0_6px_rgba(255,120,120,0.9)] font-semibold text-sm sm:text-base"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
