// src/pages/SellerAnswer.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function SellerAnswer() {
  const { messageId } = useParams();   // ← Recibes SOLO un ID real
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await axios.get(
          `${API}/api/messages/${messageId}`
        );
        setOriginal(res.data);
      } catch (err) {
        console.error("Error loading message:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, [messageId]);

  const sendReply = async () => {
    if (!reply.trim()) return;

    try {
      // EL VENDEDOR RESPONDE → CREA NUEVO MENSAJE
      await axios.post(`${API}/api/messages`, {
        requestId: original.requestId,
        buyerId: original.buyerId,
        sellerId: original.sellerId,
        sender: original.sellerId, // ← quien responde
        recipient: original.buyerId, // ← comprador recibirá
        text: reply,
        isSystem: false,
      });

      alert("Reply sent!");
      navigate("/messages");
    } catch (err) {
      console.error("Error sending reply:", err);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white mt-20">Loading...</div>
    );
  }

  if (!original) {
    return (
      <div className="text-red-400 text-center mt-20 text-xl">
        Original message not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-24 px-6 bg-[#030014] text-white">

      {/* TITLE */}
      <h1 className="text-3xl sm:text-4xl font-bold text-purple-300 mb-10 drop-shadow-[0_0_12px_rgba(160,50,255,0.8)]">
        Reply to Buyer
      </h1>

      {/* CARD */}
      <div className="w-full max-w-2xl bg-[#0A001F]/80 p-6 sm:p-8 rounded-2xl border border-purple-600/40 shadow-[0_0_30px_rgba(140,50,255,0.6)]">

        {/* INFO */}
        <div className="bg-[#140028]/60 border border-purple-600/40 rounded-xl p-4 mb-6 text-sm text-purple-200">
          <p>
            <strong className="text-purple-300">Request ID:</strong> {original.requestId}
          </p>
          <p>
            <strong className="text-purple-300">Buyer:</strong> {original.buyerId}
          </p>
        </div>

        {/* ORIGINAL MESSAGE */}
        <div className="mb-6 bg-[#1a0033]/50 p-4 rounded-xl border border-purple-700/40">
          <p className="text-gray-300 text-sm mb-1">Buyer Message:</p>
          <p className="text-white font-semibold">{original.text}</p>
        </div>

        {/* REPLY */}
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write your response..."
          className="w-full h-32 p-3 rounded-xl bg-[#0f0020] text-white border border-purple-700/50 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />

        {/* SEND */}
        <button
          onClick={sendReply}
          className="mt-5 w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold shadow-[0_0_20px_rgba(170,60,255,0.8)]"
        >
          Send Reply
        </button>

        {/* BACK */}
        <button
          onClick={() => navigate("/messages")}
          className="mt-3 w-full py-2 bg-gray-700 hover:bg-gray-800 rounded-xl"
        >
          Back to Messages
        </button>

      </div>
    </div>
  );
}
