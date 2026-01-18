// src/pages/Messages.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft } from "lucide-react";

function Messages() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [threads, setThreads] = useState([]);
  const [allMessages, setAllMessages] = useState([]); // optional: used for "View thread"
  const [loading, setLoading] = useState(false);

  // UI state
  const [openThreadReqId, setOpenThreadReqId] = useState(null); // requestId opened
  const [replyToReqId, setReplyToReqId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const authHeaders = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  const getId = (val) => (val && typeof val === "object" ? val._id : val);

  const getUserName = (u) => {
    if (!u) return "Unknown";
    if (typeof u === "object") return u.fullName || u.email || "Unknown";
    return "Unknown";
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleString();
  };

  // ✅ FIX: fallback to sender/recipient if buyerId/sellerId are not populated
  const computeOtherPartyFromThread = (t) => {
    const buyerId = getId(t.buyerId);
    const sellerId = getId(t.sellerId);

    // Primary names (from buyerId/sellerId)
    let buyerName = getUserName(t.buyerId);
    let sellerName = getUserName(t.sellerId);

    // Fallback names (from sender/recipient)
    const senderName = getUserName(t.sender);
    const recipientName = getUserName(t.recipient);

    // If thread didn't populate buyerId/sellerId, this prevents "Unknown"
    if (!buyerName || buyerName === "Unknown") buyerName = senderName;
    if (!sellerName || sellerName === "Unknown") sellerName = recipientName;

    // If I'm buyer, I'm talking to seller; else I'm talking to buyer
    if (String(userId) === String(buyerId)) {
      return { otherId: sellerId, otherName: sellerName || "Seller" };
    }
    return { otherId: buyerId, otherName: buyerName || "Buyer" };
  };

  const fetchThreads = async () => {
    if (!userId || !token) return;

    setLoading(true);
    try {
      // ✅ Thread inbox endpoint (1 card per request)
      const res = await axios.get(
        `http://localhost:5000/api/messages/threads/${userId}`,
        authHeaders
      );

      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.lastDate || 0) - new Date(a.lastDate || 0)
      );

      setThreads(sorted);

      // Optional: mark all as read when entering inbox
      try {
        await axios.put(
          `http://localhost:5000/api/messages/mark-all-read/${userId}`,
          {},
          authHeaders
        );
      } catch (e) {
        console.warn("mark-all-read failed:", e?.response?.data || e.message);
      }
    } catch (err) {
      console.error("Error loading threads:", err?.response?.data || err.message);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMessagesForUser = async () => {
    if (!userId || !token) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/messages/user/${userId}`,
        authHeaders
      );
      const sorted = (res.data || []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setAllMessages(sorted);
    } catch (err) {
      console.error("Error loading messages:", err?.response?.data || err.message);
      setAllMessages([]);
    }
  };

  useEffect(() => {
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  const toggleThreadView = async (requestId) => {
    setOpenThreadReqId((prev) => (prev === requestId ? null : requestId));

    // Load the message history only when needed
    if (!allMessages.length) {
      await fetchAllMessagesForUser();
    }
  };

  const openReply = (requestId) => {
    setReplyToReqId((prev) => (prev === requestId ? null : requestId));
    setReplyText("");
  };

  const handleSendReply = async (t) => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    const requestId = t.requestId; // in threads this is the reqId string
    const buyerId = getId(t.buyerId);
    const sellerId = getId(t.sellerId);

    const { otherId } = computeOtherPartyFromThread(t);

    if (!requestId || !buyerId || !sellerId || !otherId) {
      console.error("Missing IDs for reply:", { requestId, buyerId, sellerId, otherId });
      return;
    }

    setSending(true);
    try {
      // ✅ uses your existing general creation endpoint
      await axios.post(
        "http://localhost:5000/api/messages",
        {
          requestId,
          buyerId,
          sellerId,
          sender: userId,
          recipient: otherId,
          text: trimmed,
          isSystem: false,
        },
        authHeaders
      );

      setReplyText("");
      setReplyToReqId(null);

      // Refresh threads + messages so UI updates immediately
      await fetchThreads();
      await fetchAllMessagesForUser();
    } catch (err) {
      console.error("Error sending reply:", err?.response?.data || err.message);
    } finally {
      setSending(false);
    }
  };

  const messagesForOpenThread = useMemo(() => {
    if (!openThreadReqId) return [];
    return allMessages.filter((m) => {
      const req = getId(m.requestId);
      return String(req) === String(openThreadReqId);
    });
  }, [allMessages, openThreadReqId]);

  if (!userId || !token) {
    return (
      <div className="min-h-screen bg-[#05001a] text-white pt-32 p-6">
        <div className="max-w-4xl mx-auto text-gray-300">
          Please login to view messages.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05001a] text-white pt-32 p-6 pb-40">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-purple-300">Messages</h1>
            <p className="text-sm text-gray-300 mt-1">
              Inbox by request (threads) — simple replies, no chat.
            </p>
          </div>

          {/* ✅ ACTIONS (Back icon + Refresh) */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* ✅ Back: icon only (no text) */}
            <button
              onClick={() => navigate("/dashboard")}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#0f0a22] hover:bg-[#1a1033]
                         border border-cyan-500/20 shadow-[0_0_20px_rgba(0,220,255,0.10)]
                         transition"
              aria-label="Back"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5 text-cyan-300" />
            </button>

            <button
              onClick={fetchThreads}
              className="px-5 py-2 rounded-xl bg-[#1a1033] hover:bg-[#25124a] border border-purple-700/40
                         shadow-[0_0_20px_rgba(139,92,246,0.12)] font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && <p className="text-gray-300">Loading…</p>}

        {!loading && threads.length === 0 && (
          <p className="text-gray-300">No conversations yet.</p>
        )}

        <div className="space-y-6">
          {threads.map((t) => {
            const { otherName } = computeOtherPartyFromThread(t);

            const unread = Number(t.unread || 0);
            const productName = t.productName || "Product Request";
            const lastMessage = t.lastMessage || "";
            const lastDate = t.lastDate ? formatDate(t.lastDate) : "";

            const isOpen = openThreadReqId === t.requestId;
            const isReplyOpen = replyToReqId === t.requestId;

            return (
              <div
                key={t.requestId}
                className="bg-[#0b0030] border border-purple-700 rounded-xl p-6 hover:bg-[#120046] transition"
              >
                {/* Header row */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-purple-300">
                      {productName}
                    </h2>
                    <div className="mt-1 text-sm text-purple-200">
                      <span className="font-semibold">With:</span>{" "}
                      <span className="text-gray-100">{otherName}</span>
                    </div>
                  </div>

                  {unread > 0 && (
                    <span className="px-4 py-1 bg-pink-500 text-white rounded-full text-sm font-semibold">
                      {unread} NEW
                    </span>
                  )}
                </div>

                {/* Last message */}
                <div className="mt-4">
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-400">Last:</span>{" "}
                    <span className="italic text-gray-100">
                      {lastMessage || "No messages yet."}
                    </span>
                  </p>
                  {lastDate && <p className="mt-2 text-xs text-gray-400">{lastDate}</p>}
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleThreadView(t.requestId)}
                    className="px-4 py-2 bg-[#1a1033] hover:bg-[#25124a] border border-purple-700/40
                               rounded-lg text-sm font-semibold"
                  >
                    {isOpen ? "Hide thread" : "View thread"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openReply(t.requestId)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold"
                  >
                    {isReplyOpen ? "Cancelar" : "Responder"}
                  </button>
                </div>

                {/* Thread history (optional, simple) */}
                {isOpen && (
                  <div className="mt-5 border-t border-purple-700/40 pt-4">
                    {!allMessages.length ? (
                      <p className="text-gray-300">Loading thread…</p>
                    ) : messagesForOpenThread.length === 0 ? (
                      <p className="text-gray-300">No messages in this thread.</p>
                    ) : (
                      <div className="space-y-3">
                        {messagesForOpenThread.map((m) => {
                          const senderName = getUserName(m.sender);
                          const date = formatDate(m.createdAt);
                          return (
                            <div
                              key={m._id}
                              className="bg-[#05001a] border border-purple-700/40 rounded-lg p-4"
                            >
                              <div className="text-xs text-gray-400 flex justify-between gap-3">
                                <span className="text-gray-200 font-semibold">
                                  {senderName}
                                </span>
                                <span>{date}</span>
                              </div>
                              <div className="mt-2 text-gray-100 whitespace-pre-wrap">
                                {m.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Inline reply */}
                {isReplyOpen && (
                  <div className="mt-5 border-t border-purple-700/40 pt-4">
                    <div className="text-sm text-gray-300 mb-2">
                      Reply about{" "}
                      <span className="text-purple-200 font-semibold">{productName}</span>
                    </div>

                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escribe tu respuesta…"
                      className="w-full min-h-[110px] p-3 rounded-lg bg-[#05001a] border border-purple-600 text-white
                                 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={sending || !replyText.trim()}
                        onClick={() => handleSendReply(t)}
                        className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed
                                   rounded-lg font-semibold"
                      >
                        {sending ? "Sending…" : "Send"}
                      </button>

                      <span className="text-xs text-gray-400">(Threads inbox — simple)</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Messages;
