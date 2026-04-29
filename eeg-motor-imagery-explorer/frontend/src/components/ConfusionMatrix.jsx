import React from "react";

const CLASS_NAMES = ["Left Hand", "Right Hand", "Feet", "Tongue"];
const SHORT       = ["L.Hand",    "R.Hand",     "Feet", "Tongue"];

export default function ConfusionMatrix({ matrix, classNames = CLASS_NAMES }) {
  if (!matrix || matrix.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
        No data
      </div>
    );
  }

  const rowMaxes = matrix.map((row) => Math.max(...row));

  return (
    <div>
      <p className="text-[11px] text-gray-600 mb-3">Rows = True · Columns = Predicted</p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-20 text-right pr-3 text-gray-500 font-normal pb-2">True \ Pred</th>
              {(classNames ?? SHORT).map((c, ci) => (
                <th key={ci} className="px-2 pb-2 text-gray-400 font-medium text-center">
                  {SHORT[ci] || c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => {
              const rowSum = row.reduce((a, b) => a + b, 0);
              return (
                <tr key={ri}>
                  <td className="text-right pr-3 text-gray-400 font-medium py-1">
                    {SHORT[ri] || classNames[ri]}
                  </td>
                  {row.map((val, ci) => {
                    const isCorrect = ri === ci;
                    const ratio = rowMaxes[ri] > 0 ? val / rowMaxes[ri] : 0;
                    const bg = isCorrect
                      ? `rgba(99,102,241,${0.15 + ratio * 0.75})`
                      : `rgba(99,102,241,${ratio * 0.15})`;
                    const pct = rowSum > 0 ? ((val / rowSum) * 100).toFixed(0) : "0";
                    return (
                      <td
                        key={ci}
                        className="text-center py-1 px-2 w-16 h-12 relative"
                        style={{ backgroundColor: bg }}
                      >
                        <span className={`font-bold text-sm ${isCorrect ? "text-white" : "text-gray-300"}`}>
                          {val}
                        </span>
                        <span className="block text-xs text-gray-400">{pct}%</span>
                        {isCorrect && (
                          <span className="absolute top-0.5 right-0.5 text-indigo-400 text-xs">✓</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
