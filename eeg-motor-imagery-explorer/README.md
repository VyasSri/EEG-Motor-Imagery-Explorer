# EEG Motor Imagery Explorer

An interactive web app for visualising and classifying EEG motor imagery signals from the **BCI Competition IV Dataset 2a**.

---

## Quick Start

### 1. Get the data

Download the pre-converted `.npz` files from:
```
https://github.com/bregydoc/bcidatasetIV2a
```
Place files (`A01T.npz`, `A01E.npz`, etc.) in `backend/data/`.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Pages

| Page | Description |
|------|-------------|
| **Data Explorer** | Browse EEG waveforms trial-by-trial, color-coded by class |
| **TF Map** | Time-frequency spectrograms with mu/beta band overlays |
| **Classifier** | Run CSP+LDA, view confusion matrix + kappa, classify random trials |
| **Foundation Model** | Explainer on why subject-invariant pre-training matters |

## API Endpoints

```
GET  /subjects
GET  /trials/{subject}/{session}
GET  /trial/{subject}/{session}/{idx}
GET  /spectrogram/{subject}/{session}/{idx}/{channel}
POST /classify/{subject}
GET  /classify/trial/{subject}/{session}/{idx}
GET  /classify/random/{subject}
```

## Dataset Classes

| Label | Code |
|-------|------|
| Left Hand  | 769 |
| Right Hand | 770 |
| Feet       | 771 |
| Tongue     | 772 |
