import React, { useState, useEffect, useCallback } from "react";
import ChannelPlot from "../components/ChannelPlot.jsx";
import ClassLabel from "../components/ClassLabel.jsx";

const CLASS_COLORS = {
  "Left Hand":  "#3b82f6",
  "Right Hand": "#ef4444",
  "Feet":       "#22c55e",
  "Tongue":     "#a855f7",
};

const CH_NAMES = [
  "Fz","FC3","FC1","FCz","FC2","FC4",
  "C5","C3","C1","Cz","C2","C4","C6",
  "CP3","CP1","CPz","CP2","CP4",
  "P1","Pz","P2","POz",
];

const CH_GROUPS = {
  "Motor (C3/Cz/C4)": [7, 9, 11],
  "All": null,
  "Frontal": [0, 1, 2, 3, 4, 5],
  "Central": [6, 7, 8, 9, 10, 11, 12],
  "Parietal": [13, 14, 15, 16, 17, 18, 19, 20, 21],
};

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

export default function DataExplorer({ subject, session, api }) {
  const [trials, setTrials]         = useState([]);
  const [trialIdx, setTrialIdx]     = useState(0);
  const [trialData, setTrialData]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [chGroup, setChGroup]       = useState("Motor (C3/Cz/C4)");
  const [filterLabel, setFilterLabel] = useState("All");

  useEffect(() => {
    if (!subject) return;
    setTrials([]);
    setTrialData(null);
    setError(null);
    fetch(`${api}/trials/${subject}/${session}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.detail || "Failed to load trial list");
        setTrials(d.trials || []);
        setTrialIdx(0);
      })
      .catch((e) => setError(e.message));
  }, [subject, session, api]);

  const loadTrial = useCallback((idx) => {
    if (!subject || idx < 0) return;
    setLoading(true);
    setError(null);
    fetch(`${api}/trial/${subject}/${session}/${idx}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setTrialData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [subject, session, api]);

  useEffect(() => {
    if (trials.length > 0) loadTrial(trialIdx);
  }, [trialIdx, trials.length]);

  const filteredTrials = filterLabel === "All"
    ? trials
    : trials.filter((t) => t.label_name === filterLabel);

  const selectedChannels = CH_GROUPS[chGroup] ?? CH_NAMES.map((_, i) => i);
  const color = trialData ? (CLASS_COLORS[trialData.label_name] ?? "#6366f1") : "#6366f1";

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Data Explorer</h2>
        <p className="text-sm text-gray-500 mt-1">
          Browse individual 4-second EEG epochs from the BCI IV 2a dataset.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Trial browser */}
        <div className="card lg:col-span-1 space-y-3 flex flex-col">
          <p className="section-title mb-2">Trials</p>

          <div>
            <label className="text-[11px] text-gray-500 block mb-1.5 font-medium uppercase tracking-wider">Filter</label>
            <select
              className="select-input w-full text-xs"
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
            >
              <option value="All">All classes</option>
              {["Left Hand", "Right Hand", "Feet", "Tongue"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 space-y-0.5 max-h-[380px] overflow-y-auto pr-0.5 -mx-1 px-1">
            {filteredTrials.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-8">No trials</p>
            )}
            {filteredTrials.map((t) => {
              const isActive = trialIdx === t.idx;
              return (
                <button
                  key={t.idx}
                  onClick={() => setTrialIdx(t.idx)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all duration-150"
                  style={
                    isActive
                      ? {
                          background: "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.1))",
                          boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.3)",
                          color: "#c7d2fe",
                        }
                      : { color: "#9ca3af" }
                  }
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = ""; }}
                >
                  <span className="font-mono text-[11px] opacity-60">#{t.idx.toString().padStart(3, "0")}</span>
                  <ClassLabel name={t.label_name} />
                  {t.has_artifact && <span className="text-yellow-500/70 text-[10px]">!</span>}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              className="btn-secondary flex-1 text-xs py-1.5 justify-center"
              disabled={trialIdx <= 0}
              onClick={() => setTrialIdx((i) => Math.max(0, i - 1))}
            >← Prev</button>
            <button
              className="btn-secondary flex-1 text-xs py-1.5 justify-center"
              disabled={trialIdx >= trials.length - 1}
              onClick={() => setTrialIdx((i) => Math.min(trials.length - 1, i + 1))}
            >Next →</button>
          </div>
        </div>

        {/* Waveform viewer */}
        <div className="card lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs text-gray-600">
                #{trialIdx.toString().padStart(3, "0")}
              </span>
              {trialData && <ClassLabel name={trialData.label_name} size="lg" />}
              {trialData?.has_artifact && (
                <span
                  className="text-[11px] rounded-lg px-2 py-0.5"
                  style={{
                    color: "#fbbf24",
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.2)",
                  }}
                >
                  Artifact
                </span>
              )}
              {loading && <Spinner />}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Channels</label>
              <select
                className="select-input text-xs"
                value={chGroup}
                onChange={(e) => setChGroup(e.target.value)}
              >
                {Object.keys(CH_GROUPS).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl p-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          {!loading && trialData?.eeg && (
            <div className="fade-in">
              <ChannelPlot
                eeg={trialData.eeg}
                color={color}
                selectedChannels={selectedChannels}
              />
            </div>
          )}

          {!loading && !trialData && !error && (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              Select a trial to view
            </div>
          )}

          <p className="text-[11px] text-gray-700">
            Epoch: 0.5 – 4.0 s after cue onset · 250 Hz · {selectedChannels.length} channels shown
          </p>
        </div>
      </div>
    </div>
  );
}
