import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const token =
    localStorage.getItem("userToken") || localStorage.getItem("token");

  return (
    <footer
      className="
        w-full
        fixed
        bottom-0
        left-0
        z-[9999]
        bg-black/40
        backdrop-blur-md
        text-white
        py-3
        border-t border-white/10
        shadow-[0_-10px_30px_rgba(0,0,0,0.35)]
      "
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-lg font-semibold tracking-wide">MerqNet</h1>

        {/* Links */}
        <div className="flex items-center space-x-6 text-sm">
          {!token && (
            <Link
              to="/login"
              className="hover:text-gray-300 transition duration-200"
            >
              Login
            </Link>
          )}

          <Link
            to="/about"
            className="hover:text-gray-300 transition duration-200"
          >
            About
          </Link>

          <Link
            to="/help"
            className="hover:text-gray-300 transition duration-200"
          >
            Help
          </Link>
        </div>

        {/* Social Icons */}
        <div className="flex items-center space-x-4 opacity-90">
          {/* Facebook */}
          <a
            href="https://www.facebook.com/merqnet"
            target="_blank"
            rel="noreferrer"
            className="hover:opacity-70 transition"
            aria-label="MerqNet on Facebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M22 12.073C22 6.505 17.523 2 12 2S2 6.505 2 12.073c0 4.99 3.657 9.128 8.438 9.878v-6.987H7.898v-2.89h2.54V9.845c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.47h-1.26c-1.243 0-1.63.774-1.63 1.563v1.875h2.773l-.443 2.89h-2.33V21.95C18.343 21.2 22 17.063 22 12.073z"/>
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/merqnet/"
            target="_blank"
            rel="noreferrer"
            className="hover:opacity-70 transition"
            aria-label="MerqNet on Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="0 0 24 24">
              <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 
              0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2a3 3 0 
              0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 
              0 1 3-3h10zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 
              2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.5-.25a1.25 1.25 
              0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z"/>
            </svg>
          </a>

          {/* X (Twitter) - (you left it blank, ok) */}
        </div>
      </div>

      <p className="text-center text-purple-300 opacity-70 text-sm mt-4">
        © 2026 MerqNet. All Rights Reserved.
      </p>
    </footer>
  );
};

export default Footer;
