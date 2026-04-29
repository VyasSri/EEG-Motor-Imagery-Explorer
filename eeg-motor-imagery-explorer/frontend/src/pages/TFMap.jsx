import React, { useState, useEffect } from "react";
import Spectrogram from "../components/Spectrogram.jsx";
import ClassLabel from "../components/ClassLabel.jsx";

const MOTOR_CHANNELS = [
  { idx: 7,  name: "C3"  },
  { idx: 9,  name: "Cz"  },
  { idx: 11, name: "C4"  },
  { idx: 0,  name: "Fz"  },
  { idx: 15, name: "CPz" },
];

export default function TFMap({ subject, session, api }) {
  const [trials, setTrials]             = useState([]);
  const [trialA, setTrialA]             = useState(0);
  const [trialB, setTrialB]             = useState(1);
  const [channelIdx, setChannelIdx]     = useState(7);
  const [spectA, setSpectA]             = useState(null);
  const [spectB, setSpectB]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [compareMode, setCompareMode]   = useState(false);

  useEffect(() => {
    if (!subject) return;
    fetch(`${api}/trials/${subject}/${session}`)
      .then((r) => r.json())
      .then((d) => { setTrials(d.trials || []); setSpectA(null); setSpectB(null); })
      .catch(() => {});
  }, [subject, session, api]);

  const fetchSpectrogram = (idx) =>
    fetch(`${api}/spectrogram/${subject}/${session}/${idx}/${channelIdx}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });

  const loadSpectrograms = () => {
    if (!subject || trials.length === 0) return;
    setLoading(true);
    setError(null);
    const fetches = [fetchSpectrogram(trialA)];
    if (compareMode) fetches.push(fetchSpectrogram(trialB));
    Promise.all(fetches)
      .then(([a, b]) => { setSpectA(a); setSpectB(b ?? null); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => {
    if (trials.length > 0) loadSpectrograms();
  }, [trialA, trialB, channelIdx, compareMode, trials.length]);

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Time-Frequency Map</h2>
        <p className="text-sm text-gray-500 mt-1">
          Mu (8–12 Hz) and beta (13–30 Hz) power dynamics during motor imagery.
        </p>
      </div>

      {/* Controls */}
      <div className="card flex flex-wrap gap-5 items-end">
        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-1.5">Channel</label>
          <select
            className="select-input"
            value={channelIdx}
            onChange={(e) => setChannelIdx(Number(e.target.value))}
          >
            {MOTOR_CHANNELS.map(({ idx, name }) => (
              <option key={idx} value={idx}>{name}</option>
            ))}
            {[...Array(22)].map((_, i) => {
              if (MOTOR_CHANNELS.find((c) => c.idx === i)) return null;
              return <option key={i} value={i}>CH{i}</option>;
            })}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-1.5">
            {compareMode ? "Trial A" : "Trial"}
          </label>
          <select
            className="select-input"
            value={trialA}
            onChange={(e) => setTrialA(Number(e.target.value))}
          >
            {trials.map((t) => (
              <option key={t.idx} value={t.idx}>
                #{String(t.idx).padStart(3,"0")} — {t.label_name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none pb-0.5">
          <div
            className="w-9 h-5 rounded-full relative transition-all duration-200 cursor-pointer"
            style={{
              background: compareMode
                ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                : "rgba(255,255,255,0.1)",
            }}
            onClick={() => setCompareMode((v) => !v)}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow"
              style={{ left: compareMode ? "calc(100% - 18px)" : "2px" }}
            />
          </div>
          <span className="text-sm text-gray-300">Compare</span>
        </label>

        {compareMode && (
          <div className="fade-in">
            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium block mb-1.5">Trial B</label>
            <select
              className="select-input"
              value={trialB}
              onChange={(e) => setTrialB(Number(e.target.value))}
            >
              {trials.map((t) => (
                <option key={t.idx} value={t.idx}>
                  #{String(t.idx).padStart(3,"0")} — {t.label_name}
                </option>
              ))}
            </select>
          </div>
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

      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-600 text-sm gap-2.5">
          <svg className="animate-spin h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Computing spectrogram…
        </div>
      )}

      {!loading && (
        <div className={`grid gap-4 ${compareMode && spectB ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {spectA && (
            <div className="card space-y-3 fade-in">
              <div className="flex items-center gap-2.5">
                {compareMode && <span className="text-xs font-semibold text-gray-400">A</span>}
                <ClassLabel name={spectA.label_name} />
                <span className="text-[11px] text-gray-600 font-mono">
                  {spectA.channel_name} · ch{spectA.channel_idx}
                </span>
              </div>
              <Spectrogram data={spectA} />
            </div>
          )}

          {compareMode && spectB && (
            <div className="card space-y-3 fade-in">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-gray-400">B</span>
                <ClassLabel name={spectB.label_name} />
                <span className="text-[11px] text-gray-600 font-mono">
                  {spectB.channel_name} · ch{spectB.channel_idx}
                </span>
              </div>
              <Spectrogram data={spectB} />
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div
        className="card text-sm text-gray-400 space-y-3"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Reading the map</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
          <p><span className="text-blue-400 font-medium">Blue (ERD)</span> — power decrease vs baseline. Classic during active motor imagery in mu/beta bands.</p>
          <p><span className="text-red-400 font-medium">Red (ERS)</span> — power increase. Seen after movement (beta rebound) or in non-task frequencies.</p>
          <p><span className="text-yellow-400 font-medium">Yellow box</span> — mu band (8–12 Hz). Primary ERD band for hand imagery.</p>
          <p><span className="text-purple-400 font-medium">Purple box</span> — beta band (13–30 Hz). Secondary ERD; also shows post-movement rebound.</p>
        </div>
      </div>
    </div>
  );
}
