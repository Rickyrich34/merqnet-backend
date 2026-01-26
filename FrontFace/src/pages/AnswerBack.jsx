import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function AnswerBack() {
  const navigate = useNavigate();
  const { requestId, buyerId } = useParams();
  const sellerId = localStorage.getItem("userId");

  const [text, setText] = useState("");

  const handleSend = async () => {
    if (!text.trim()) return;

    const messageData = {
      requestId,
      senderId: sellerId,
      recipientId: buyerId,
      text,
      isSystem: false,
    };

    try {
      const res = await fetch(`${API}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      if (res.ok) {
        navigate("/messages");
      } else {
        console.error("Failed to send message.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#080019] pt-32 px-4 text-white">
      <h1
        className="text-center text-5xl font-bold text-purple-400 mb-12 tracking-wide 
                     drop-shadow-[0_0_15px_rgba(168,85,247,0.7)]"
      >
        Reply to Buyer
      </h1>

      <div
        className="max-w-3xl mx-auto bg-[#021024] p-10 rounded-2xl border border-purple-700/40 
                      shadow-lg shadow-purple-900/40"
      >
        <p className="text-lg text-gray-300 mb-6 text-center">
          You are replying to the buyer for this request:
        </p>

        <p className="text-center text-purple-300 text-md mb-10">
          Request ID: <span className="text-pink-400">{requestId}</span>
        </p>

        <textarea
          className="w-full h-40 p-4 rounded-xl bg-[#0a0f26] border border-purple-600 
                     text-white focus:outline-none focus:ring-2 focus:ring-purple-500
                     shadow-inner shadow-black/40"
          placeholder="Write your reply..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex justify-between mt-8">
          <button
            onClick={() => navigate("/messages")}
            className="px-6 py-2 rounded-full bg-gray-600/60 hover:bg-gray-500 
                       transition-all font-semibold shadow-md"
          >
            Cancel
          </button>

          <button
            onClick={handleSend}
            className="px-8 py-2 rounded-full font-semibold 
                       bg-gradient-to-r from-purple-500 to-pink-500 
                       hover:opacity-90 transition-all shadow-lg shadow-pink-600/40"
          >
            Send Reply
          </button>
        </div>
      </div>
    </div>
  );
}
