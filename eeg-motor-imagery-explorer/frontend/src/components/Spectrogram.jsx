/**
 * Spectrogram — canvas-based heatmap rendering.
 * Blue  = ERD (power decrease, negative dB)
 * Red   = ERS (power increase, positive dB)
 * White = baseline
 */

import React, { useEffect, useRef } from "react";

function dbToColor(db, minDb = -10, maxDb = 10) {
  const t = (db - minDb) / (maxDb - minDb); // 0 (min) → 1 (max)
  // Blue → white → red
  if (t < 0.5) {
    const u = t * 2; // 0→1
    const r = Math.round(u * 255);
    const g = Math.round(u * 255);
    const b = 255;
    return [r, g, b];
  } else {
    const u = (t - 0.5) * 2; // 0→1
    const r = 255;
    const g = Math.round((1 - u) * 255);
    const b = Math.round((1 - u) * 255);
    return [r, g, b];
  }
}

export default function Spectrogram({ data, title }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const { freqs, times, power_db, mu_band, beta_band } = data;
    if (!freqs || !times || !power_db) return;

    const nFreqs = freqs.length;
    const nTimes = times.length;
    const CELL_W = 6;
    const CELL_H = 4;
    const LEFT_PAD  = 48;
    const BOTTOM_PAD = 24;
    const TOP_PAD    = 8;
    const canvasW = LEFT_PAD + nTimes * CELL_W;
    const canvasH = TOP_PAD  + nFreqs * CELL_H + BOTTOM_PAD;

    const canvas = canvasRef.current;
    canvas.width  = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw heatmap (freqs are low-to-high, we render low at bottom)
    const imageData = ctx.createImageData(nTimes * CELL_W, nFreqs * CELL_H);
    const pixels = imageData.data;

    for (let fi = 0; fi < nFreqs; fi++) {
      const freqRow = nFreqs - 1 - fi; // flip so low freq at bottom
      for (let ti = 0; ti < nTimes; ti++) {
        const db = power_db[fi][ti];
        const [r, g, b] = dbToColor(db);
        for (let dy = 0; dy < CELL_H; dy++) {
          for (let dx = 0; dx < CELL_W; dx++) {
            const pixY = freqRow * CELL_H + dy;
            const pixX = ti * CELL_W + dx;
            const idx  = (pixY * nTimes * CELL_W + pixX) * 4;
            pixels[idx]     = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imageData, LEFT_PAD, TOP_PAD);

    // Freq axis (y)
    ctx.fillStyle = "#9ca3af";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    const freqTicks = [4, 8, 12, 13, 20, 30, 40];
    for (const hz of freqTicks) {
      const fi = freqs.findIndex((f) => f >= hz);
      if (fi < 0) continue;
      const y = TOP_PAD + (nFreqs - 1 - fi) * CELL_H + CELL_H / 2;
      ctx.fillText(`${hz}Hz`, LEFT_PAD - 3, y + 3);
      ctx.strokeStyle = "#4b5563";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(LEFT_PAD, y);
      ctx.lineTo(LEFT_PAD + nTimes * CELL_W, y);
      ctx.stroke();
    }

    // Time axis (x)
    ctx.textAlign = "center";
    const timeTicks = times.filter((_, i) => i % Math.ceil(nTimes / 6) === 0);
    for (const t of timeTicks) {
      const ti = times.indexOf(t);
      const x = LEFT_PAD + ti * CELL_W;
      const y = TOP_PAD + nFreqs * CELL_H + 14;
      ctx.fillStyle = "#9ca3af";
      ctx.fillText(`${t.toFixed(1)}s`, x, y);
    }

    // Mu band overlay
    const muLo = freqs.findIndex((f) => f >= mu_band[0]);
    const muHi = freqs.findIndex((f) => f >= mu_band[1]);
    if (muLo >= 0 && muHi >= 0) {
      const y1 = TOP_PAD + (nFreqs - 1 - muHi) * CELL_H;
      const y2 = TOP_PAD + (nFreqs - muLo) * CELL_H;
      ctx.strokeStyle = "rgba(251,191,36,0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(LEFT_PAD, y1, nTimes * CELL_W, y2 - y1);
      ctx.fillStyle = "rgba(251,191,36,0.15)";
      ctx.fillRect(LEFT_PAD, y1, nTimes * CELL_W, y2 - y1);
    }

    // Beta band overlay
    const betaLo = freqs.findIndex((f) => f >= beta_band[0]);
    const betaHi = freqs.findIndex((f) => f >= beta_band[1]);
    if (betaLo >= 0 && betaHi >= 0) {
      const y1 = TOP_PAD + (nFreqs - 1 - betaHi) * CELL_H;
      const y2 = TOP_PAD + (nFreqs - betaLo) * CELL_H;
      ctx.strokeStyle = "rgba(167,139,250,0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(LEFT_PAD, y1, nTimes * CELL_W, y2 - y1);
      ctx.fillStyle = "rgba(167,139,250,0.1)";
      ctx.fillRect(LEFT_PAD, y1, nTimes * CELL_W, y2 - y1);
    }
    ctx.setLineDash([]);

    // Legend
    const legendX = LEFT_PAD;
    const legendY = canvasH - 6;
    const labels = [
      { label: "μ (8-12 Hz)", color: "rgba(251,191,36,0.7)" },
      { label: "β (13-30 Hz)", color: "rgba(167,139,250,0.7)" },
    ];
    ctx.font = "8px monospace";
    let lx = legendX;
    for (const { label, color } of labels) {
      ctx.fillStyle = color;
      ctx.fillRect(lx, legendY - 7, 10, 7);
      ctx.fillStyle = "#9ca3af";
      ctx.textAlign = "left";
      ctx.fillText(label, lx + 12, legendY - 1);
      lx += 90;
    }
  }, [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        No spectrogram data
      </div>
    );
  }

  return (
    <div>
      {title && <p className="text-xs text-gray-400 mb-2 font-mono">{title}</p>}
      <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-2">
        <canvas ref={canvasRef} style={{ display: "block", imageRendering: "pixelated" }} />
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ background: "rgb(0,0,255)" }}></span>
          ERD (power ↓)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ background: "rgb(255,255,255)" }}></span>
          Baseline
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ background: "rgb(255,0,0)" }}></span>
          ERS (power ↑)
        </span>
      </div>
    </div>
  );
}
