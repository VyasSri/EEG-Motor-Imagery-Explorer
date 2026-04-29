const CLASS_STYLES = {
  "Left Hand":  { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)",  color: "#93c5fd" },
  "Right Hand": { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",   color: "#fca5a5" },
  "Feet":       { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",   color: "#86efac" },
  "Tongue":     { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)",  color: "#d8b4fe" },
};

export default function ClassLabel({ name, size = "sm" }) {
  const style = CLASS_STYLES[name];
  const sz = size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  if (!style) {
    return (
      <span className={`label-badge ${sz} bg-gray-700/50 text-gray-400 border border-gray-600/30`}>
        {name || "Unknown"}
      </span>
    );
  }

  return (
    <span
      className={`label-badge ${sz} font-medium`}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {name}
    </span>
  );
}
