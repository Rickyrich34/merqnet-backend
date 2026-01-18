import { useEffect, useMemo, useState } from "react";

export default function RatingModal({ open, onClose, onSubmit, loading }) {
  const [value, setValue] = useState(8.0);
  const [reasons, setReasons] = useState([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) return;
    setValue(8.0);
    setReasons([]);
    setComment("");
  }, [open]);

  const tipText = useMemo(() => {
    if (value >= 9.0) return `Tip: 9.0+ is "excellent".`;
    if (value >= 8.0) return `Tip: 8.0+ is "solid".`;
    return `Tip: below 8.0 suggests issues.`;
  }, [value]);

  const toggleReason = (label) => {
    setReasons((prev) => {
      if (prev.includes(label)) return prev.filter((x) => x !== label);
      return [...prev, label];
    });
  };

  const reasonButtons = [
    "Delivery on time",
    "Good communication",
    "Accurate description",
    "Smooth payment",
    "Late delivery",
    "Price changed",
    "Not as described",
  ];

  const handleSubmit = async () => {
    if (loading) return;

    const numeric = Number(value);
    const safeValue = Number.isFinite(numeric) ? numeric : 8.0;

    await onSubmit({
      value: safeValue,
      reasons,
      comment,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => (loading ? null : onClose())}
      />

      {/* modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-b from-[#0b0620] to-[#050012] shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Rate this transaction</h2>
            <p className="mt-1 text-sm text-purple-200/70">
              Choose a number from 1.0 to 10.0 (decimals allowed).
            </p>
          </div>

          <button
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition"
            onClick={() => (loading ? null : onClose())}
          >
            Close
          </button>
        </div>

        <div className="p-5">
          {/* slider */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span>1.0</span>
              <span>10.0</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-3xl font-extrabold text-white">
                {Number(value).toFixed(1)}
              </span>
              <span className="text-white/70">/ 10</span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value))}
              className="w-full accent-fuchsia-500"
              disabled={loading}
            />

            <div className="mt-2 text-xs text-purple-200/70">{tipText}</div>
          </div>

          {/* reasons */}
          <div className="mt-5">
            <div className="text-sm font-semibold text-white mb-2">
              What influenced your rating? <span className="text-white/50">(optional)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {reasonButtons.map((label) => {
                const active = reasons.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleReason(label)}
                    disabled={loading}
                    className={[
                      "px-3 py-2 rounded-xl border text-sm transition",
                      active
                        ? "bg-fuchsia-600/30 border-fuchsia-400/40 text-white"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10",
                      loading ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* comment */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-white">
                Optional comment <span className="text-white/50">(max 200 chars)</span>
              </div>
              <div className="text-xs text-white/50">{comment.length}/200</div>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 200))}
              placeholder="Short and respectful (optional)"
              disabled={loading}
              className="w-full h-24 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
            />
          </div>

          {/* actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => (loading ? null : onClose())}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm disabled:opacity-60"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 transition text-sm font-semibold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Save Rating"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
