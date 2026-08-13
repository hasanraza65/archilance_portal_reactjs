import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * First-run picker: classic or new.
 *
 * The two "screenshots" are live vector mock-ups rather than image files —
 * they can't go stale when either UI changes, they're a few KB, and they
 * animate on hover so the difference reads instantly.
 *
 * Duplicated byte-for-byte in both builds — keep them identical.
 */

const ease = [0.16, 1, 0.3, 1];

/* --- classic preview: dense, blue, sidebar + table ------------------ */
const ClassicPreview = ({ active }) => (
  <div className="absolute inset-0 bg-[#f1f5f9] overflow-hidden">
    <div className="absolute inset-y-0 left-0 w-[26%] bg-[#1e293b]">
      <div className="p-2 space-y-1.5">
        <div className="h-2.5 w-[70%] rounded bg-white/25" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-1.5 rounded bg-white/12" style={{ width: `${52 + (i % 3) * 16}%` }} />
        ))}
      </div>
    </div>
    <div className="absolute left-[26%] right-0 top-0 h-[13%] bg-white border-b border-slate-200 flex items-center px-2 gap-1.5">
      <div className="h-1.5 w-10 rounded bg-slate-300" />
      <div className="ml-auto w-3 h-3 rounded-full bg-[#4f6ef7]" />
    </div>
    <div className="absolute left-[26%] right-0 top-[13%] bottom-0 p-2">
      <div className="bg-white rounded border border-slate-200 h-full p-1.5">
        <div className="h-2 rounded bg-slate-200 mb-1.5" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            animate={active ? { opacity: [0.45, 0.85, 0.45] } : { opacity: 0.6 }}
            transition={{ duration: 2.4, delay: i * 0.12, repeat: Infinity }}
            className="flex items-center gap-1 py-[3px] border-b border-slate-100"
          >
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <div className="h-1 rounded bg-slate-200 flex-1" />
            <div className="h-1 w-4 rounded bg-slate-200" />
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

/* --- new preview: airy, purple, cards + pills ----------------------- */
const NewPreview = ({ active }) => (
  <div className="absolute inset-0 bg-[#0f0f17] overflow-hidden">
    <div className="absolute inset-y-0 left-0 w-[22%] bg-[#16161f] p-2 space-y-1.5">
      <div className="h-2.5 w-[65%] rounded-full bg-[#6d5ef8]" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-1.5 rounded-full bg-white/10" style={{ width: `${58 + (i % 2) * 18}%` }} />
      ))}
    </div>
    <div className="absolute left-[22%] right-0 inset-y-0 p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-12 rounded-full bg-white/20" />
        <div className="ml-auto h-3 w-8 rounded-full bg-[#6d5ef8]" />
      </div>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={active ? { y: [0, -2.5, 0] } : { y: 0 }}
          transition={{ duration: 2.6, delay: i * 0.22, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-lg bg-white/[0.07] border border-white/10 p-1.5"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: ["#10b981", "#f59e0b", "#6d5ef8"][i] }} />
            <div className="h-1.5 rounded-full bg-white/20 flex-1" />
            <div className="h-2 w-5 rounded-full" style={{ background: ["#10b98133", "#f59e0b33", "#6d5ef833"][i] }} />
          </div>
          <div className="h-1 rounded-full bg-white/10 mt-1.5" style={{ width: `${78 - i * 14}%` }} />
        </motion.div>
      ))}
    </div>
    {active && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="absolute right-1.5 bottom-1.5 w-5 h-5 rounded-full bg-[#6d5ef8] shadow-lg"
      />
    )}
  </div>
);

const Card = ({ id, title, tag, tagTone, points, selected, onSelect, children }) => (
  <motion.button
    type="button"
    onClick={() => onSelect(id)}
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2, ease }}
    aria-pressed={selected}
    className="group text-left rounded-2xl border-2 overflow-hidden transition-colors w-full"
    style={{
      borderColor: selected ? "#6d5ef8" : "rgba(255,255,255,0.14)",
      background: selected ? "rgba(109,94,248,0.10)" : "rgba(255,255,255,0.04)",
      boxShadow: selected ? "0 18px 50px rgba(109,94,248,0.28)" : "none",
    }}
  >
    <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10">
      {children}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#6d5ef8] flex items-center justify-center shadow-lg"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </div>

    <div className="p-4">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <h3 className="text-white font-bold text-base">{title}</h3>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
          style={{ background: `${tagTone}26`, color: tagTone }}
        >
          {tag}
        </span>
      </div>
      <ul className="space-y-1">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-white/60 text-[13px]">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-white/35 flex-none" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  </motion.button>
);

const VersionChooser = ({ open, onPick, onPreviewTour }) => {
  const [selected, setSelected] = useState("v2");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] overflow-y-auto"
      style={{ background: "radial-gradient(120% 100% at 50% 0%, #1b1740 0%, #0b0a1a 62%, #06060f 100%)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your experience"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/4 w-[40rem] h-[40rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #6d5ef844, transparent 68%)" }}
        animate={{ x: [0, 50, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="text-center mb-8 sm:mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            A new Archilance is ready
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight">Pick how you'd like to work</h1>
          <p className="text-white/55 mt-3 max-w-xl mx-auto text-sm sm:text-base">
            We've rebuilt the portal from the ground up. Try it now, or stay on the classic version —
            you can switch back and forth any time from the header.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08, ease }}>
            <Card
              id="classic"
              title="Classic"
              tag="Familiar"
              tagTone="#94a3b8"
              selected={selected === "classic"}
              onSelect={setSelected}
              points={["Exactly what you use today", "Nothing moves or changes", "Every feature you already know"]}
            >
              <ClassicPreview active={selected === "classic"} />
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.16, ease }}>
            <Card
              id="v2"
              title="New experience"
              tag="Recommended"
              tagTone="#6d5ef8"
              selected={selected === "v2"}
              onSelect={setSelected}
              points={["Faster, with instant updates", "Built for phones as well as desktop", "Briefs, checklists, client chat & assistant"]}
            >
              <NewPreview active={selected === "v2"} />
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.26, ease }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
        >
          <button
            onClick={() => onPick(selected)}
            className="w-full sm:w-auto px-7 h-12 rounded-xl text-[15px] font-bold text-white shadow-lg transition-transform active:scale-95"
            style={{ background: "#6d5ef8", boxShadow: "0 10px 36px rgba(109,94,248,0.45)" }}
          >
            {selected === "v2" ? "Start with the new experience" : "Continue with Classic"}
          </button>
          <button
            onClick={onPreviewTour}
            className="w-full sm:w-auto px-5 h-12 rounded-xl text-sm font-semibold text-white/75 hover:text-white hover:bg-white/10 transition-colors"
          >
            See what's new first
          </button>
        </motion.div>

        <p className="text-center text-white/30 text-xs mt-5">
          You can change this whenever you like — look for the version switch in the header.
        </p>
      </div>
    </div>
  );
};

export default VersionChooser;
