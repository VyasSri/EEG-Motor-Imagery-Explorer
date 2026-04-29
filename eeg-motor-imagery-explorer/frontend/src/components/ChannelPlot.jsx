/**
 * ChannelPlot — renders stacked EEG waveforms for selected channels.
 * Uses SVG lines (no Recharts) for performance with 875-sample traces.
 */

import React, { useMemo } from "react";

const FS = 250;
const EPOCH_OFFSET = 0.5; // cue onset offset in seconds

function normalise(arr) {
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  const range = mx - mn || 1;
  return arr.map((v) => (v - mn) / range);
}

function EEGTrace({ data, color, label, y0, rowHeight, width }) {
  const norm = useMemo(() => normalise(data), [data]);
  const pad = 6;
  const usable = rowHeight - pad * 2;
  const xStep = (width - 60) / (norm.length - 1);

  const pts = norm
    .map((v, i) => {
      const x = 60 + i * xStep;
      const y = y0 + pad + (1 - v) * usable;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <g>
      {/* channel label */}
      <text
        x={4}
        y={y0 + rowHeight / 2 + 4}
        fontSize={9}
        fill="#9ca3af"
        fontFamily="monospace"
      >
        {label}
      </text>
      {/* divider */}
      <line x1={0} y1={y0} x2={width} y2={y0} stroke="#1f2937" strokeWidth={0.5} />
      {/* waveform */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1} />
    </g>
  );
}

const CH_NAMES = [
  "Fz","FC3","FC1","FCz","FC2","FC4",
  "C5","C3","C1","Cz","C2","C4","C6",
  "CP3","CP1","CPz","CP2","CP4",
  "P1","Pz","P2","POz",
];

export default function ChannelPlot({ eeg, color = "#6366f1", selectedChannels }) {
  if (!eeg || eeg.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        No EEG data
      </div>
    );
  }

  const channels = selectedChannels ?? eeg.map((_, i) => i);
  const rowHeight = 36;
  const width = 900;
  const height = channels.length * rowHeight;
  const nSamples = eeg[0].length;

  // Time axis ticks every 0.5s
  const ticks = [];
  for (let t = 0; t <= (nSamples / FS); t += 0.5) {
    const x = 60 + (t * FS) / (nSamples - 1) * (width - 60);
    ticks.push({ x, label: `${(t + EPOCH_OFFSET).toFixed(1)}s` });
  }

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height + 20}
        style={{ display: "block", minWidth: width }}
      >
        {/* Time axis */}
        {ticks.map(({ x, label }) => (
          <g key={label}>
            <line
              x1={x} y1={0} x2={x} y2={height}
              stroke="#374151" strokeWidth={0.5} strokeDasharray="2,3"
            />
            <text x={x} y={height + 14} fontSize={8} fill="#6b7280" textAnchor="middle">
              {label}
            </text>
          </g>
        ))}

        {channels.map((chIdx, row) => (
          <EEGTrace
            key={chIdx}
            data={eeg[chIdx]}
            color={color}
            label={CH_NAMES[chIdx] ?? `CH${chIdx}`}
            y0={row * rowHeight}
            rowHeight={rowHeight}
            width={width}
          />
        ))}
      </svg>
    </div>
  );
}
