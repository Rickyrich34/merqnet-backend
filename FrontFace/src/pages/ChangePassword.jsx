import React, { useState } from "react";
import logopic2 from "../assets/logopic2.png";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");

      const res = await fetch(`http://localhost:5000/api/users/change-password/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Error updating password.");
        return;
      }

      setMessage("Password updated successfully!");
    } catch (error) {
      console.error(error);
      setMessage("Server error.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050017] text-white pt-24 px-5 pb-16">

      {/* LOGO */}
      <div className="flex justify-center mb-8">
        <img
          src={logopic2}
          alt="MerqNet Logo"
          className="w-32 sm:w-40 drop-shadow-[0_0_15px_rgba(255,100,255,0.6)]"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="
          bg-[#0B001F]/90 
          border border-purple-600/40 
          shadow-2xl 
          rounded-3xl 
          p-6 sm:p-10 
          max-w-md 
          w-full 
          mx-auto
        "
      >
        <h1 className="text-3xl font-bold text-purple-200 text-center mb-8">
          Change Password
        </h1>

        {message && (
          <p className="text-center bg-purple-600/40 p-2 rounded mb-4 text-sm">
            {message}
          </p>
        )}

        {/* CURRENT */}
        <label className="text-sm text-gray-300">Current Password</label>
        <input
          type="password"
          className="
            w-full bg-[#140530] border border-purple-500/40 
            p-3 rounded-lg mb-4 focus:ring-2 focus:ring-purple-400
          "
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        {/* NEW */}
        <label className="text-sm text-gray-300">New Password</label>
        <input
          type="password"
          className="
            w-full bg-[#140530] border border-purple-500/40 
            p-3 rounded-lg mb-4 focus:ring-2 focus:ring-purple-400
          "
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        {/* CONFIRM */}
        <label className="text-sm text-gray-300">Confirm New Password</label>
        <input
          type="password"
          className="
            w-full bg-[#140530] border border-purple-500/40 
            p-3 rounded-lg mb-6 focus:ring-2 focus:ring-purple-400
          "
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button
          type="submit"
          className="
            w-full bg-purple-600 hover:bg-purple-700 
            p-3 rounded-xl font-semibold shadow 
            border border-purple-400/40
          "
        >
          Update Password
        </button>
      </form>

      <footer className="text-center mt-10 text-gray-500 text-xs">
        © 2025 MerqNet. All Rights Reserved.
      </footer>
    </div>
  );
};

export default ChangePassword;
