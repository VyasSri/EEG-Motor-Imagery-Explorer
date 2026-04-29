"""
preprocessing.py — Bandpass filtering, spectrogram computation, and feature prep.
"""

import numpy as np
from scipy import signal as sp_signal
from data_loader import get_epochs, FS, EPOCH_LEN, N_EEG_CH


# ---------------------------------------------------------------------------
# Bandpass filter
# ---------------------------------------------------------------------------

def bandpass_filter(eeg: np.ndarray, lo: float = 4.0, hi: float = 40.0,
                    fs: int = FS, order: int = 5) -> np.ndarray:
    """
    Apply a zero-phase Butterworth bandpass filter.

    Parameters
    ----------
    eeg : (n_trials, n_ch, n_samples)  or  (n_ch, n_samples)
    Returns same shape.
    """
    nyq = fs / 2.0
    b, a = sp_signal.butter(order, [lo / nyq, hi / nyq], btype="bandpass")
    if eeg.ndim == 2:
        return sp_signal.filtfilt(b, a, eeg, axis=-1)
    # 3-D: filter along last axis
    out = np.empty_like(eeg)
    for i in range(eeg.shape[0]):
        out[i] = sp_signal.filtfilt(b, a, eeg[i], axis=-1)
    return out


# ---------------------------------------------------------------------------
# Spectrogram (STFT-based, normalised to baseline)
# ---------------------------------------------------------------------------

def compute_spectrogram(eeg_trial: np.ndarray, channel: int,
                        fs: int = FS) -> dict:
    """
    Compute a time-frequency power spectrogram for a single trial/channel.

    Parameters
    ----------
    eeg_trial : (n_ch, n_samples)
    channel   : channel index (0-based)

    Returns
    -------
    {
      "freqs"       : list[float]   — Hz
      "times"       : list[float]   — seconds relative to cue onset (0.5 s offset)
      "power_db"    : list[list]    — (n_freqs, n_times) dB-normalised to baseline
      "mu_band"     : [8, 12]
      "beta_band"   : [13, 30]
    }
    """
    x = eeg_trial[channel]  # (n_samples,)

    # STFT parameters
    nperseg  = int(0.5 * fs)   # 500 ms window
    noverlap = int(0.45 * fs)  # 50 ms step → 90% overlap

    freqs, times, Zxx = sp_signal.stft(x, fs=fs, nperseg=nperseg,
                                        noverlap=noverlap, boundary=None)
    power = np.abs(Zxx) ** 2  # (n_freqs, n_times)

    # Restrict to 2–45 Hz for display
    freq_mask = (freqs >= 2) & (freqs <= 45)
    freqs  = freqs[freq_mask]
    power  = power[freq_mask, :]

    # Baseline normalisation: use the first 20% of time points as "baseline"
    # (in practice these are early in the epoch already past cue; good enough)
    n_baseline = max(1, int(power.shape[1] * 0.15))
    baseline   = power[:, :n_baseline].mean(axis=1, keepdims=True)
    baseline   = np.where(baseline == 0, 1e-10, baseline)
    power_db   = 10 * np.log10(power / baseline)  # relative dB

    # Clip extreme values for visualisation
    power_db = np.clip(power_db, -10, 10)

    # Times are relative to start of epoch (which is 0.5s after cue)
    times_sec = (times + 0.5).tolist()

    return {
        "freqs":     freqs.tolist(),
        "times":     times_sec,
        "power_db":  power_db.tolist(),
        "mu_band":   [8, 12],
        "beta_band": [13, 30],
    }


# ---------------------------------------------------------------------------
# CSP feature matrix preparation
# ---------------------------------------------------------------------------

def prepare_csp_data(subject: str, session: str,
                     apply_filter: bool = True) -> tuple[np.ndarray, np.ndarray]:
    """
    Load epochs, optionally bandpass-filter, and return (X, y).

    X : (n_trials, n_ch, n_samples)   float32
    y : (n_trials,)                   int  labels 1-4
    """
    data = get_epochs(subject, session)
    X = data["eeg"]          # (n_trials, 22, 875)
    y = np.array(data["labels"], dtype=int)

    if apply_filter:
        X = bandpass_filter(X, lo=4.0, hi=40.0, fs=FS)

    return X.astype(np.float32), y
