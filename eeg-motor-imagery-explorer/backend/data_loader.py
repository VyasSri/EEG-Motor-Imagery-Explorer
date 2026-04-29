"""
data_loader.py — Load and epoch BCI Competition IV Dataset 2a .npz files.

Expected .npz structure (from bregydoc/bcidatasetIV2a):
  s        : (n_samples, 25)  — raw EEG (22 ch) + EOG (3 ch)
  etyp     : (n_events,)      — event type codes
  epos     : (n_events,)      — event positions in samples
  edur     : (n_events,)      — event durations
  artifacts: (288,)           — 1 if trial has artifacts
  y        : (288,)           — class labels 1–4
"""

import os
import numpy as np
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

# Event codes
CUE_ONSET = 768
CLASS_EVENTS = {769: "Left Hand", 770: "Right Hand", 771: "Feet", 772: "Tongue"}
CLASS_COLORS = {
    "Left Hand": "#3b82f6",
    "Right Hand": "#ef4444",
    "Feet": "#22c55e",
    "Tongue": "#a855f7",
}

FS = 250          # Sampling frequency (Hz)
EPOCH_START = int(0.5 * FS)   # 0.5s after cue onset
EPOCH_END   = int(4.0 * FS)   # 4.0s after cue onset
EPOCH_LEN   = EPOCH_END - EPOCH_START   # 875 samples
N_EEG_CH    = 22
CH_NAMES = [
    "Fz", "FC3", "FC1", "FCz", "FC2", "FC4",
    "C5", "C3", "C1", "Cz", "C2", "C4", "C6",
    "CP3", "CP1", "CPz", "CP2", "CP4",
    "P1", "Pz", "P2", "POz"
]

# Session suffixes
SESSION_MAP = {"train": "T", "eval": "E"}


def _npz_path(subject: str, session: str) -> Path:
    """Return path to .npz file for given subject + session."""
    suffix = SESSION_MAP.get(session, session.upper()[0])
    return DATA_DIR / f"{subject}{suffix}.npz"


def list_subjects() -> list[str]:
    """Return list of subject IDs that have at least one data file in /data."""
    found = set()
    for f in DATA_DIR.glob("A0*.npz"):
        found.add(f.stem[:3])  # e.g. A01
    return sorted(found)


def load_raw(subject: str, session: str) -> dict:
    """Load the raw .npz file and return a dict with arrays."""
    path = _npz_path(subject, session)
    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {path}")
    npz = np.load(str(path), allow_pickle=True)
    return {k: npz[k] for k in npz.files}


def get_epochs(subject: str, session: str) -> dict:
    """
    Extract all epochs from raw data.

    Returns
    -------
    {
      "eeg"      : np.ndarray (n_trials, n_ch, epoch_len),
      "labels"   : list[int]  (769-772),
      "label_names": list[str],
      "artifacts": list[int],
      "ch_names" : list[str],
      "fs"       : int,
    }
    """
    raw = load_raw(subject, session)
    s         = raw["s"]
    etyp      = raw["etyp"].flatten().astype(int)
    epos      = raw["epos"].flatten().astype(int)
    artifacts = raw["artifacts"].flatten().astype(int)

    eeg = s[:, :N_EEG_CH]  # (n_samples, 22)

    # Labels are the class events (769-772) in order of appearance
    class_codes = set(CLASS_EVENTS.keys())
    class_mask  = np.isin(etyp, list(class_codes))
    class_positions = epos[class_mask]
    class_labels    = etyp[class_mask]

    epochs = []
    valid_labels = []
    valid_artifacts = []

    for trial_idx, (cue_pos, label) in enumerate(zip(class_positions, class_labels)):
        start = cue_pos + EPOCH_START
        end   = cue_pos + EPOCH_END
        if end > len(eeg):
            break
        epoch = eeg[start:end, :].T  # (22, epoch_len)
        epochs.append(epoch)
        valid_labels.append(int(label))
        art = int(artifacts[trial_idx]) if trial_idx < len(artifacts) else 0
        valid_artifacts.append(art)

    epochs_arr = np.array(epochs, dtype=np.float32)

    return {
        "eeg": epochs_arr,
        "labels": valid_labels,
        "label_names": [CLASS_EVENTS.get(l, "Unknown") for l in valid_labels],
        "artifacts": valid_artifacts,
        "ch_names": CH_NAMES,
        "fs": FS,
        "epoch_len": EPOCH_LEN,
    }


def get_trial(subject: str, session: str, idx: int) -> dict:
    """Return a single trial as a JSON-serialisable dict."""
    data = get_epochs(subject, session)
    n_trials = len(data["labels"])
    if idx < 0 or idx >= n_trials:
        raise IndexError(f"Trial index {idx} out of range [0, {n_trials})")
    label = data["labels"][idx]
    return {
        "idx": idx,
        "label": label,
        "label_name": CLASS_EVENTS.get(label, "Unknown"),
        "color": CLASS_COLORS.get(CLASS_EVENTS.get(label, ""), "#6b7280"),
        "has_artifact": bool(data["artifacts"][idx]),
        "ch_names": CH_NAMES,
        "fs": FS,
        "eeg": data["eeg"][idx].tolist(),   # (22, 875)
    }


def get_trials_list(subject: str, session: str) -> list[dict]:
    """Return metadata for all trials (no raw EEG)."""
    data = get_epochs(subject, session)
    return [
        {
            "idx": i,
            "label": data["labels"][i],
            "label_name": CLASS_EVENTS.get(data["labels"][i], "Unknown"),
            "color": CLASS_COLORS.get(CLASS_EVENTS.get(data["labels"][i], ""), "#6b7280"),
            "has_artifact": bool(data["artifacts"][i]),
        }
        for i in range(len(data["labels"]))
    ]
