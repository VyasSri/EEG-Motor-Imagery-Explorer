import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import DataExplorer from "./pages/DataExplorer.jsx";
import TFMap from "./pages/TFMap.jsx";
import ClassifierDashboard from "./pages/ClassifierDashboard.jsx";
import FoundationPanel from "./pages/FoundationPanel.jsx";

const API = "/api";

const NAV_ITEMS = [
  { to: "/",           label: "Data Explorer" },
  { to: "/tfmap",      label: "TF Map"        },
  { to: "/classifier", label: "Classifier"    },
  { to: "/foundation", label: "Foundation"    },
];

export default function App() {
  const [subjects, setSubjects]           = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSession, setSelectedSession] = useState("train");
  const location = useLocation();

  useEffect(() => {
    fetch(`${API}/subjects`)
      .then((r) => r.json())
      .then((d) => {
        setSubjects(d.subjects || []);
        if (d.subjects?.length) setSelectedSubject(d.subjects[0]);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-white/[0.06]"
        style={{
          background: "linear-gradient(180deg, rgba(10,13,22,0.98) 0%, rgba(8,11,18,0.96) 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-8 rounded-lg shrink-0"
              style={{
                background: "linear-gradient(180deg, #4f46e5, #7c3aed)",
                boxShadow: "0 0 10px rgba(99,102,241,0.5)",
              }}
            />
            <div className="leading-none">
              <p className="text-sm font-bold text-white">EEG Motor Imagery</p>
              <p className="text-[10px] text-gray-500 mt-0.5">BCI Competition IV · Dataset 2a</p>
            </div>
          </div>

          {/* Subject / session selectors */}
          <div className="flex items-center gap-2">
            <select
              className="select-input text-xs h-8 py-0"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.length === 0 && <option value="">No data</option>}
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              className="select-input text-xs h-8 py-0"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="train">Training</option>
              <option value="eval">Evaluation</option>
            </select>
          </div>
        </div>

        {/* Nav */}
        <nav className="max-w-7xl mx-auto px-5 flex gap-0.5 pb-2">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: "linear-gradient(135deg, rgba(79,70,229,0.25), rgba(124,58,237,0.15))",
                      boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.3)",
                    }
                  : {}
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* No data warning */}
      {subjects.length === 0 && (
        <div
          className="border-b border-yellow-500/20 text-yellow-300/90 text-xs px-6 py-2.5 text-center"
          style={{ background: "rgba(234,179,8,0.06)" }}
        >
          No subject data found — place{" "}
          <code className="font-mono bg-yellow-900/30 px-1 rounded">A01T.npz</code>,{" "}
          <code className="font-mono bg-yellow-900/30 px-1 rounded">A01E.npz</code> etc. in{" "}
          <code className="font-mono bg-yellow-900/30 px-1 rounded">backend/data/</code> and restart the API.
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-5 py-6">
        <Routes>
          <Route path="/"           element={<DataExplorer subject={selectedSubject} session={selectedSession} api={API} />} />
          <Route path="/tfmap"      element={<TFMap        subject={selectedSubject} session={selectedSession} api={API} />} />
          <Route path="/classifier" element={<ClassifierDashboard subject={selectedSubject} api={API} />} />
          <Route path="/foundation" element={<FoundationPanel />} />
        </Routes>
      </main>
    </div>
  );
}
