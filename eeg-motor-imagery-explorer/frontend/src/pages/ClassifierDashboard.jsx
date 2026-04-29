import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import ConfusionMatrix from "../components/ConfusionMatrix.jsx";
import ClassLabel from "../components/ClassLabel.jsx";

const CLASS_COLORS = {
  "Left Hand":  "#3b82f6",
  "Right Hand": "#ef4444",
  "Feet":       "#22c55e",
  "Tongue":     "#a855f7",
};

function KappaGauge({ kappa }) {
  const clamp = Math.max(0, Math.min(1, kappa));
  const color  = clamp < 0.4 ? "#f87171" : clamp < 0.6 ? "#fbbf24" : "#4ade80";
  const glow   = clamp < 0.4 ? "rgba(248,113,113,0.25)" : clamp < 0.6 ? "rgba(251,191,36,0.25)" : "rgba(74,222,128,0.25)";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold border-2"
        style={{ borderColor: color, color, boxShadow: `0 0 20px ${glow}` }}
      >
        {kappa.toFixed(2)}
      </div>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider">Cohen's κ</p>
      <p className="text-xs font-medium" style={{ color }}>
        {kappa < 0.2 ? "Poor" : kappa < 0.4 ? "Fair" : kappa < 0.6 ? "Moderate" : kappa < 0.8 ? "Good" : "Excellent"}
      </p>
    </div>
  );
}

function ProbabilityBar({ label, prob, isTrue, isPred }) {
  const color = CLASS_COLORS[label] ?? "#6366f1";
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="w-24 shrink-0 flex items-center gap-1.5">
        <span className="text-gray-400">{label.split(" ")[0]}</span>
        {isTrue && <span className="text-yellow-400 text-[10px] font-bold" title="True class">TRUE</span>}
        {isPred && <span className="text-indigo-400 text-[10px] font-bold" title="Predicted">PRED</span>}
      </div>
      <div className="flex-1 bg-gray-800/60 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(prob * 100).toFixed(1)}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
      <span className="text-gray-500 w-10 text-right tabular-nums">{(prob * 100).toFixed(1)}%</span>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div
      className="stat-card"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))" }}
    >
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-1.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}

const customTooltipStyle = {
  background: "rgba(15,18,28,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  backdropFilter: "blur(8px)",
};

export default function ClassifierDashboard({ subject, api }) {
  const [result, setResult]           = useState(null);
  const [trialResult, setTrialResult] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [error, setError]             = useState(null);

  const runClassifier = () => {
    if (!subject) return;
    setLoading(true);
    setError(null);
    setResult(null);
    fetch(`${api}/classify/${subject}`, { method: "POST" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setResult(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  const classifyRandom = () => {
    if (!subject) return;
    setTrialLoading(true);
    setTrialResult(null);
    fetch(`${api}/classify/random/${subject}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setTrialResult(d); setTrialLoading(false); })
      .catch((e) => { setError(e.message); setTrialLoading(false); });
  };

  const barData = result
    ? Object.entries(result.per_class_acc).map(([name, acc]) => ({
        name,
        accuracy: parseFloat((acc * 100).toFixed(1)),
      }))
    : [];

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Classifier</h2>
        <p className="text-sm text-gray-500 mt-1">
          CSP + LDA trained on 75% of the training session, evaluated on held-out 25%.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <button className="btn-primary" onClick={runClassifier} disabled={loading || !subject}>
          {loading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Running CSP+LDA…
            </>
          ) : "Run Full Evaluation"}
        </button>

        <button className="btn-secondary" onClick={classifyRandom} disabled={trialLoading || !subject}>
          {trialLoading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Classifying…
            </>
          ) : "Classify Random Trial"}
        </button>

        {result && (
          <span className="text-xs text-gray-600">
            <span className="font-mono text-gray-400">{result.subject}</span>
            {" · "}{result.n_train} train · {result.n_eval} test
          </span>
        )}
      </div>

      {error && (
        <div
          className="rounded-xl p-3 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
        >
          {error}
        </div>
      )}

      {/* Single trial result */}
      {trialResult && (
        <div
          className="card slide-up"
          style={
            trialResult.correct
              ? { background: "rgba(34,197,94,0.05)", borderColor: "rgba(34,197,94,0.2)" }
              : { background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }
          }
        >
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{ color: trialResult.correct ? "#4ade80" : "#f87171" }}
              >
                {trialResult.correct ? "Correct" : "Incorrect"}
              </span>
              <span className="text-xs text-gray-600 font-mono">Trial #{trialResult.idx}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="card-flat">
              <p className="text-[11px] text-gray-600 mb-2 uppercase tracking-wider">True Label</p>
              <ClassLabel name={trialResult.true_label} size="lg" />
            </div>
            <div className="card-flat">
              <p className="text-[11px] text-gray-600 mb-2 uppercase tracking-wider">Predicted</p>
              <ClassLabel name={trialResult.predicted_label} size="lg" />
            </div>
          </div>

          <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-3">Class Probabilities</p>
          <div className="space-y-2.5">
            {Object.entries(trialResult.probabilities).map(([label, prob]) => (
              <ProbabilityBar
                key={label}
                label={label}
                prob={prob}
                isTrue={label === trialResult.true_label}
                isPred={label === trialResult.predicted_label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full evaluation results */}
      {result && (
        <div className="space-y-5 slide-up">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Accuracy"     value={`${(result.accuracy * 100).toFixed(1)}%`} color="#818cf8" />
            <div className="stat-card flex items-center justify-center">
              <KappaGauge kappa={result.kappa} />
            </div>
            <StatCard label="Train trials" value={result.n_train} color="#60a5fa" />
            <StatCard label="Test trials"  value={result.n_eval}  color="#c084fc" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Confusion matrix */}
            <div className="card">
              <p className="section-title">Confusion Matrix</p>
              <ConfusionMatrix matrix={result.confusion_matrix} classNames={result.class_names} />
            </div>

            {/* Bar chart */}
            <div className="card">
              <p className="section-title">Per-Class Accuracy</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ left: -15 }}>
                  <XAxis
                    dataKey="name"
                    tickFormatter={(v) => v.split(" ")[0]}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#4b5563", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    labelStyle={{ color: "#e5e7eb", fontSize: 12 }}
                    formatter={(v) => [`${v}%`, "Accuracy"]}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 2, 2]}>
                    {barData.map((d) => (
                      <Cell key={d.name} fill={CLASS_COLORS[d.name] ?? "#6366f1"} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-gray-700 mt-3">
                Chance level = 25% · κ ≈ 0. CSP+LDA typically achieves 60–80% on this dataset.
              </p>
            </div>
          </div>

        </div>
      )}

      {!result && !loading && (
        <div className="card flex flex-col items-center justify-center h-48 text-gray-600 text-sm gap-3">
          <span>Click "Run Full Evaluation" to train the CSP+LDA pipeline.</span>
        </div>
      )}
    </div>
  );
}
