import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function AskTheSeller() {
  const { otherUserId, requestId } = useParams();

  const [seller, setSeller] = useState(null);
  const [message, setMessage] = useState("");

  const buyerId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // 🚀 FIX: Validación absoluta para evitar mensajes a uno mismo
  const isSelf = buyerId === otherUserId;

  useEffect(() => {
    const loadSeller = async () => {
      try {
        const res = await axios.get(
          `${API}/api/users/profile/${otherUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSeller(res.data);
      } catch (error) {
        console.error("Error loading seller info:", error);
      }
    };

    if (otherUserId) loadSeller();
  }, [otherUserId, token]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    if (isSelf) {
      alert("❌ You cannot send a message to yourself. Something is wrong.");
      return;
    }

    try {
      await axios.post(
        `${API}/api/messages/ask`,
        {
          requestId,
          buyerId,
          sellerId: otherUserId,
          text: message,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("");
      alert("Message Sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message. Check console.");
    }
  };

  return (
    <div className="min-h-screen bg-[#05001a] text-white pt-32 p-6">
      <h1 className="text-4xl text-purple-300 font-bold mb-6">Conversation</h1>

      {seller && (
        <p className="text-lg mb-6">
          Talking to:{" "}
          <span className="text-pink-300">{seller.fullName}</span>
        </p>
      )}

      {isSelf && (
        <p className="text-red-400 font-bold mb-4">
          ⚠ ERROR: You are trying to message yourself.  
          Check AcceptBid → AskSeller for wrong IDs.
        </p>
      )}

      <textarea
        className="w-full p-4 bg-[#0b0030] border border-purple-600 rounded-xl text-lg"
        rows="6"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message..."
      />

      <button
        onClick={sendMessage}
        className="mt-4 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 
                   rounded-xl text-white font-bold shadow-xl hover:opacity-90 transition"
      >
        Send
      </button>
    </div>
  );
}

export default AskTheSeller;
