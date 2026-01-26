import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function BuyerThread() {
  const { id } = useParams(); // Message ID
  const navigate = useNavigate();

  const [message, setMessage] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await fetch(`${API}/api/messages/${id}`);
        const data = await res.json();
        setMessage(data);
      } catch (error) {
        console.error("Error loading message:", error);
      }
    };

    fetchMessage();
  }, [id]);

  if (!message)
    return (
      <div className="text-white pt-32 text-center">Loading message…</div>
    );

  const sellerId = message.sellerId;
  const requestId = message.requestId;

  return (
    <div className="min-h-screen bg-[#050017] text-white pt-32 p-6">
      <h1 className="text-3xl mb-6 text-purple-300 font-bold">
        Message Details
      </h1>

      <div className="bg-[#0a0025] p-6 rounded-2xl border border-purple-700 shadow-xl mb-6">
        <p className="text-xl mb-2">
          <span className="text-purple-400 font-semibold">Product:</span>{" "}
          {message.productName || "Unknown"}
        </p>

        <p className="mb-2">
          <span className="text-purple-400 font-semibold">From:</span>{" "}
          {message.senderName || "Unknown"}
        </p>

        <p className="mb-2">
          <span className="text-purple-400 font-semibold">Message:</span>
          <br />
          {message.text}
        </p>

        <p className="text-sm text-gray-400">
          Request: {requestId}
        </p>
      </div>

      {/* BUTTON TO ANSWER BACK */}
      <button
        onClick={() => {
          if (!sellerId || !requestId) {
            console.error("Missing params:", { sellerId, requestId });
            alert("Error: Missing seller or request id");
            return;
          }

          navigate(`/ask/${sellerId}/${requestId}`);
        }}
        className="bg-pink-600 hover:bg-pink-700 py-3 px-6 rounded-xl text-white text-lg shadow-lg"
      >
        Answer Back
      </button>

      <button
        onClick={() => navigate("/messages")}
        className="ml-4 bg-gray-700 hover:bg-gray-800 py-3 px-6 rounded-xl"
      >
        Back
      </button>
    </div>
  );
}
