"""
main.py — FastAPI backend for the EEG Motor Imagery Explorer.

Run with:
    uvicorn main:app --reload --port 8000
"""

import random
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure local modules resolve when running from the backend directory
sys.path.insert(0, str(Path(__file__).parent))

from data_loader import (
    list_subjects,
    get_trials_list,
    get_trial,
    get_epochs,
    CH_NAMES,
    FS,
)
from preprocessing import compute_spectrogram, prepare_csp_data
from classifier import train_and_evaluate, predict_single_trial

app = FastAPI(title="EEG Motor Imagery Explorer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "ok", "message": "EEG Motor Imagery Explorer API"}


# ---------------------------------------------------------------------------
# Subjects
# ---------------------------------------------------------------------------

@app.get("/subjects")
def subjects():
    """List available subject IDs (those with data files in /data)."""
    found = list_subjects()
    return {"subjects": found}


# ---------------------------------------------------------------------------
# Trials list
# ---------------------------------------------------------------------------

@app.get("/trials/{subject}/{session}")
def trials(subject: str, session: str):
    """
    Return metadata for all trials in a session.
    session: 'train' or 'eval'
    """
    try:
        trials_list = get_trials_list(subject, session)
        return {"subject": subject, "session": session, "trials": trials_list}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Single trial EEG
# ---------------------------------------------------------------------------

@app.get("/trial/{subject}/{session}/{idx}")
def trial(subject: str, session: str, idx: int):
    """
    Return raw EEG data for a single trial.
    Response: { idx, label, label_name, color, has_artifact, ch_names, fs, eeg }
    eeg shape: (22 channels × 875 samples)
    """
    try:
        return get_trial(subject, session, idx)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IndexError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Spectrogram
# ---------------------------------------------------------------------------

@app.get("/spectrogram/{subject}/{session}/{idx}/{channel}")
def spectrogram(subject: str, session: str, idx: int, channel: int):
    """
    Compute and return a time-frequency power spectrogram for one trial/channel.
    channel: 0-based index into the 22 EEG channels
    """
    try:
        data = get_epochs(subject, session)
        n_trials = data["eeg"].shape[0]
        if idx < 0 or idx >= n_trials:
            raise HTTPException(status_code=404, detail=f"Trial {idx} out of range")
        if channel < 0 or channel >= 22:
            raise HTTPException(status_code=400, detail=f"Channel {channel} out of range [0, 21]")

        trial_eeg = data["eeg"][idx]  # (22, 875)
        result = compute_spectrogram(trial_eeg, channel=channel, fs=FS)
        result["channel_name"] = CH_NAMES[channel]
        result["channel_idx"] = channel
        result["trial_idx"] = idx
        result["label"] = data["labels"][idx]
        result["label_name"] = data["label_names"][idx]
        return result
    except HTTPException:
        raise
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Classifier — full evaluation
# ---------------------------------------------------------------------------

@app.post("/classify/{subject}")
def classify(subject: str):
    """
    Train CSP+LDA on training session, evaluate on eval session.
    Returns confusion matrix, per-class accuracy, kappa score.
    """
    try:
        result = train_and_evaluate(subject)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Classifier — single trial
# ---------------------------------------------------------------------------

@app.get("/classify/trial/{subject}/{session}/{idx}")
def classify_trial(subject: str, session: str, idx: int):
    """
    Predict a single trial using a model trained on the training session.
    Returns predicted class, true class, and per-class probabilities.
    """
    try:
        return predict_single_trial(subject, session, idx)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IndexError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Random trial shortcut (for the "Classify This Trial" button)
# ---------------------------------------------------------------------------

@app.get("/classify/random/{subject}")
def classify_random(subject: str):
    """Pick a random trial from the held-out test split and classify it."""
    try:
        from sklearn.model_selection import train_test_split
        from preprocessing import prepare_csp_data
        _, y = prepare_csp_data(subject, "train")
        n_test = len(train_test_split(y, test_size=0.25, stratify=y, random_state=42)[1])
        idx = random.randint(0, n_test - 1)
        return predict_single_trial(subject, "train", idx)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
