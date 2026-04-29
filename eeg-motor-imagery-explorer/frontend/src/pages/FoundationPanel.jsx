import React from "react";

const PIPELINE_STEPS = [
  {
    title: "Raw EEG",
    desc: "Multichannel brainwave recording. Highly variable across subjects and sessions.",
    accent: "#3b82f6",
  },
  {
    title: "Tokenization",
    desc: "Split into fixed-length patches per channel (~200 ms). Each patch is a token.",
    accent: "#6366f1",
  },
  {
    title: "Transformer",
    desc: "Multi-head self-attention across channel and time dimensions. Learns spatial + temporal dependencies.",
    accent: "#a855f7",
  },
  {
    title: "Task Head",
    desc: "Lightweight MLP fine-tuned per task. Encoder stays frozen — only head is adapted per subject.",
    accent: "#10b981",
  },
];

const WHY_BULLETS = [
  {
    title: "Subject variability is the hard problem",
    body: "Each person's EEG looks different. CSP+LDA must be retrained from scratch for every user (~288 trials). A foundation model pre-trained on thousands of subjects can generalise with far fewer trials.",
  },
  {
    title: "Cross-subject generalisation",
    body: "Pre-training on large EEG corpora learns subject-invariant representations. Fine-tuning with 20–50 trials from a new user then achieves competitive accuracy.",
  },
  {
    title: "Transfer across tasks",
    body: "The same encoder adapts to motor imagery, P300, SSVEP, or seizure detection — like how BERT adapts to sentiment, QA, or translation.",
  },
  {
    title: "Why this matters for assistive devices",
    body: "A BCI requiring 30+ minutes of calibration per session isn't practical. Foundation models could cut calibration to seconds — critical for locked-in patients.",
  },
];

const PAPERS = [
  {
    title: "EEGFormer",
    desc: "Transformer pre-trained on EEG for multiple downstream BCI tasks.",
    url: "https://arxiv.org/abs/2212.01229",
    badge: "2022",
  },
  {
    title: "LaBraM",
    desc: "Large Brain Model — large-scale pre-training on >2500 hours of EEG.",
    url: "https://arxiv.org/abs/2405.18765",
    badge: "2024",
  },
  {
    title: "EEGNet",
    desc: "Compact CNN baseline for EEG. ~2,500 params, solid cross-subject accuracy.",
    url: "https://arxiv.org/abs/1611.08024",
    badge: "2018",
  },
];

const COMPARE_ROWS = [
  ["Training data needed",   "~288 trials per subject",    "Fine-tune with 20–50 trials"],
  ["Cross-subject transfer", "None — retrain from scratch","Yes — shared encoder"],
  ["Cross-task transfer",    "None",                       "Yes — swap task head"],
  ["Interpretability",       "CSP filters visualisable",   "Attention maps (partial)"],
  ["Accuracy (BCI IV 2a)",   "~70–80%",                    "~80–90% (SOTA)"],
  ["Calibration time",       "10–30 min / session",        "Seconds to minutes"],
];

export default function FoundationPanel() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Foundation Model</h2>
        <p className="text-sm text-gray-500 mt-1">
          Why CSP+LDA is just the start — and where the field is heading.
        </p>
      </div>

      {/* Pipeline */}
      <div className="card space-y-5">
        <p className="section-title">Foundation Model Pipeline</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {PIPELINE_STEPS.map((step, i) => (
            <React.Fragment key={step.title}>
              <div
                className="rounded-2xl p-4 space-y-2 relative"
                style={{
                  background: `linear-gradient(135deg, ${step.accent}0f, ${step.accent}06)`,
                  border: `1px solid ${step.accent}33`,
                }}
              >
                <p className="font-semibold text-sm text-gray-100">{step.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div
                    className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full border border-gray-700 bg-[#080b12] text-gray-600 flex items-center justify-center text-[10px]"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    →
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div className="card">
        <p className="section-title">CSP+LDA vs Foundation Model</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-gray-500 font-medium pb-3 w-1/3">Aspect</th>
                <th className="text-left text-gray-500 font-medium pb-3 w-1/3">CSP + LDA</th>
                <th className="text-left font-medium pb-3 w-1/3" style={{ color: "#818cf8" }}>Foundation Model</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(([aspect, csp, fm], i) => (
                <tr
                  key={aspect}
                  className="border-b border-white/[0.03]"
                  style={i % 2 === 0 ? { background: "rgba(255,255,255,0.01)" } : {}}
                >
                  <td className="py-2.5 text-gray-300 font-medium pr-4">{aspect}</td>
                  <td className="py-2.5 text-gray-500 pr-4">{csp}</td>
                  <td className="py-2.5" style={{ color: "#a5b4fc" }}>{fm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Why it matters */}
      <div className="card space-y-4">
        <p className="section-title">Why Subject-Invariant Pre-Training Matters</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WHY_BULLETS.map(({ title, body }) => (
            <div
              key={title}
              className="rounded-xl p-4 space-y-1.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="text-sm font-semibold text-gray-200">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Papers */}
      <div className="card space-y-2">
        <p className="section-title">Key Papers</p>
        {PAPERS.map(({ title, desc, url, badge }) => (
          <a
            key={title}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 group"
            style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "1px solid rgba(99,102,241,0.3)";
              e.currentTarget.style.background = "rgba(99,102,241,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.05)";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
          >
            <span className="text-[10px] bg-gray-800 text-gray-400 rounded-lg px-1.5 py-1 font-mono shrink-0 mt-0.5">
              {badge}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 group-hover:text-indigo-300 transition-colors">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
            <svg className="shrink-0 w-3.5 h-3.5 text-gray-700 group-hover:text-indigo-400 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>

      {/* Quote */}
      <div
        className="card"
        style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}
      >
        <blockquote className="text-gray-300 text-sm italic leading-relaxed">
          "The question we ask is not how to improve decoding of user's intention, but how to facilitate
          user's acquisition of BCI skills."
        </blockquote>
        <p className="text-xs text-gray-600 mt-3">— Dr. José del R. Millán, CNBI Lab, UT Austin</p>
      </div>
    </div>
  );
}
