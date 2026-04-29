# 🧠 EEG Motor Imagery Explorer
### A Brain-Computer Interface Visualization & Classification App
*Inspired by research at Dr. Millán's CNBI Lab, UT Austin*

---

## Overview

Build an interactive web app that loads, visualizes, and classifies **EEG motor imagery signals** from the publicly available **BCI Competition IV Dataset 2a**. The app demonstrates core concepts behind the CNBI lab's work: decoding what someone is *imagining moving* purely from their brainwaves — the foundational problem behind building brain-controlled robots and assistive devices.

Users can explore EEG signals across channels, view time-frequency power maps (ERD/ERS), and run a live classifier that predicts which of 4 motor imagery classes a trial belongs to.

---

## Dataset

**BCI Competition IV – Dataset 2a**
- 9 subjects, 22 EEG channels + 3 EOG channels
- 4 classes: **Left Hand**, **Right Hand**, **Feet**, **Tongue** imagery
- 2 sessions per subject (training + evaluation), 288 trials each (4s per trial)
- Sampled at 250 Hz

**Download:** https://www.bbci.de/competition/iv/#dataset2a  
*(Files are `.gdf` format — use `mne` Python library to read them)*

Alternatively, use the numpy-preconverted version from:  
https://github.com/bregydoc/bcidatasetIV2a  
*(`.npz` files, easier to load — `np.load('A01T.npz')`)*

---

## Tech Stack

| Layer | Tool |
|---|---|
| Backend / Data | Python, MNE-Python, NumPy, SciPy, scikit-learn |
| API | FastAPI |
| Frontend | React + Recharts + Tailwind CSS |
| ML Model | EEGNet (PyTorch) **or** CSP + LDA (scikit-learn fallback) |

> **Vibe-code tip:** Start with the CSP + LDA pipeline first — it's ~30 lines and already achieves competitive accuracy. Add EEGNet later if you want to flex.

---

## Features & Pages

### 1. 📂 Data Explorer
- Subject selector (A01–A09)
- Trial browser: scroll through individual 4-second EEG epochs
- Multi-channel waveform viewer (all 22 EEG channels stacked)
- Color-coded by class label (left hand / right hand / feet / tongue)

### 2. 🌊 Time-Frequency Map (ERD/ERS Viewer)
- Select a channel (default: C3, Cz, C4 — the motor cortex channels)
- Display a **spectrogram** (STFT or Morlet wavelet) for a selected trial
- Highlight the **mu band (8–12 Hz)** and **beta band (13–30 Hz)** with overlay boxes
- Show event-related desynchronization (ERD = power drop during imagery) visually
- Side-by-side comparison: e.g., Left Hand vs Right Hand trial on C3 vs C4

### 3. 🤖 Classifier Dashboard
- Choose a subject and session
- Run **Common Spatial Pattern (CSP) + LDA** classification
  - Extract CSP filters from training session
  - Classify evaluation session trial-by-trial
  - Show confusion matrix (4×4 grid, color-coded)
  - Display per-class accuracy + overall kappa score
- "Classify This Trial" button — pick a random trial, show the model's prediction with confidence bar

### 4. 🧩 Foundation Model Teaser Panel *(static/explainer)*
- Short explainer card: "What is a Motor Imagery Foundation Model?"
- Diagram showing: Raw EEG → Tokenization → Transformer Encoder → Task Head
- Bullet points on why subject-invariant pre-training matters (cross-subject generalization)
- Link to relevant paper: [EEGFormer](https://arxiv.org/abs/2212.01229) or [LaBraM](https://arxiv.org/abs/2405.18765)

---

## File Structure

```
eeg-motor-imagery-explorer/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── data_loader.py       # Load + epoch BCI IV 2a .npz files
│   ├── preprocessing.py     # Bandpass filter, CSP, feature extraction
│   ├── classifier.py        # CSP+LDA pipeline, train/eval functions
│   └── data/                # Put A01T.npz, A01E.npz etc. here
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── DataExplorer.jsx
│   │   │   ├── TFMap.jsx
│   │   │   ├── ClassifierDashboard.jsx
│   │   │   └── FoundationPanel.jsx
│   │   └── components/
│   │       ├── ChannelPlot.jsx
│   │       ├── Spectrogram.jsx
│   │       ├── ConfusionMatrix.jsx
│   │       └── ClassLabel.jsx   # Color-coded pill badge
│   └── package.json
│
└── README.md
```

---

## Backend API Endpoints

```
GET  /subjects                          → list of available subject IDs
GET  /trials/{subject}/{session}        → list of all trials with labels
GET  /trial/{subject}/{session}/{idx}   → raw EEG array (22 ch × 1000 samples)
GET  /spectrogram/{subject}/{session}/{idx}/{channel}  → TF power matrix
POST /classify/{subject}                → run CSP+LDA, return confusion matrix + kappa
GET  /classify/trial/{subject}/{session}/{idx}         → single-trial prediction
```

---

## Key Implementation Details

### Preprocessing Pipeline
```python
# 1. Bandpass filter 4–40 Hz (captures mu + beta bands)
# 2. Epoch: 0.5s to 4.0s after cue onset (avoid motor preparation artifact)
# 3. CSP: fit on training data, extract log-variance features
# 4. LDA: fit on CSP features, predict on eval data
```

### ERD Visualization Logic
```python
# For each trial & channel:
# 1. Compute STFT with 500ms window, 50ms step
# 2. Normalize power relative to pre-cue baseline (-500ms to 0ms)
# 3. Return dB-scale relative power matrix (freq × time)
# Frontend: render as heatmap (blue = ERD/decrease, red = ERS/increase)
```

### CSP Implementation (use sklearn or manual)
```python
from mne.decoding import CSP
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ('csp', CSP(n_components=4, reg=None, log=True)),
    ('lda', LinearDiscriminantAnalysis())
])
pipeline.fit(X_train, y_train)
acc = pipeline.score(X_test, y_test)
```

---

## Stretch Goals (if you're feeling it)

- [ ] **EEGNet in PyTorch** — compact CNN designed for EEG, ~2,500 parameters, replace LDA
- [ ] **Cross-subject evaluation** — train on 8 subjects, test on 1 (shows why foundation models matter)
- [ ] **Topographic map** — render a 2D head with electrode positions, color = ERD magnitude at a given time
- [ ] **"Record your own" mode** — integrate OpenBCI or Muse headset via BrainFlow if hardware available

---

## Why This Project Matters (for your interview)

The CNBI lab (Dr. Millán, UT Austin) is building **motor imagery-specific foundation models** — pre-trained transformers on large EEG corpora that can be fine-tuned for new subjects/tasks. This project demonstrates:

1. **You understand the data** — BCI IV 2a is the field's standard benchmark
2. **You know the core signal processing** — ERD/ERS, CSP, bandpower features
3. **You see the gap** — CSP+LDA is subject-specific and brittle; foundation models fix this
4. **You can build things** — a working interactive app is worth more than a notebook

> *"The question we ask is not how to improve decoding of user's intention, but how to facilitate user's acquisition of BCI skills."*
> — Dr. José del R. Millán, CNBI Lab

---

## Resources

- [MNE-Python docs](https://mne.tools/stable/index.html) — EEG processing library
- [BCI Competition IV results & papers](https://www.bbci.de/competition/iv/)
- [EEGNet paper (Lawhern et al. 2018)](https://arxiv.org/abs/1611.08024) — compact CNN for EEG
- [LaBraM: Large Brain Model](https://arxiv.org/abs/2405.18765) — foundation model for EEG
- [CNBI Lab publications](https://sites.utexas.edu/jdrmillan/)
- [ERD/ERS explainer (Pfurtscheller & Lopes da Silva, 1999)](https://pubmed.ncbi.nlm.nih.gov/10576139/)
