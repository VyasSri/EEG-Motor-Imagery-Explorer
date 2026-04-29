"""
classifier.py — CSP + LDA pipeline for 4-class motor imagery classification.
"""

import numpy as np
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import confusion_matrix, cohen_kappa_score
from mne.decoding import CSP

from preprocessing import prepare_csp_data

CLASS_NAMES = ["Left Hand", "Right Hand", "Feet", "Tongue"]
LABEL_TO_NAME = {769: "Left Hand", 770: "Right Hand", 771: "Feet", 772: "Tongue"}
CLASS_LABELS  = [769, 770, 771, 772]


def build_pipeline(n_components: int = 4) -> Pipeline:
    """Return a fresh CSP + LDA sklearn pipeline."""
    return Pipeline([
        ("csp", CSP(n_components=n_components, reg=None, log=True, norm_trace=False)),
        ("lda", LinearDiscriminantAnalysis()),
    ])


def train_and_evaluate(subject: str) -> dict:
    """
    Train CSP+LDA on 75% of the training session, evaluate on the held-out 25%.
    (Eval session files do not contain class labels in this dataset format.)
    """
    X, y = prepare_csp_data(subject, "train")
    X_train, X_eval, y_train, y_eval = train_test_split(
        X, y, test_size=0.25, stratify=y, random_state=42
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_eval)
    acc    = float((y_pred == y_eval).mean())
    kappa  = float(cohen_kappa_score(y_eval, y_pred))
    cm     = confusion_matrix(y_eval, y_pred, labels=CLASS_LABELS).tolist()

    # Per-class accuracy (diagonal / row-sum)
    cm_np = np.array(cm)
    per_class = {}
    for i, label in enumerate(CLASS_LABELS):
        row_sum = cm_np[i].sum()
        per_class[LABEL_TO_NAME[label]] = float(cm_np[i, i] / row_sum) if row_sum > 0 else 0.0

    return {
        "subject":         subject,
        "accuracy":        acc,
        "kappa":           kappa,
        "per_class_acc":   per_class,
        "confusion_matrix": cm,
        "class_names":     CLASS_NAMES,
        "n_train":         len(y_train),
        "n_eval":          len(y_eval),
    }


def predict_single_trial(subject: str, session: str, idx: int) -> dict:
    """
    Train on the training session and predict one trial from `session`.

    Returns
    -------
    {
      "idx"            : int,
      "true_label"     : str,
      "predicted_label": str,
      "correct"        : bool,
      "probabilities"  : dict {class_name: probability},
    }
    """
    X, y = prepare_csp_data(subject, "train")
    X_train, X_target, y_train, y_target = train_test_split(
        X, y, test_size=0.25, stratify=y, random_state=42
    )

    if idx < 0 or idx >= len(y_target):
        raise IndexError(f"Trial index {idx} out of range")

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    trial = X_target[[idx]]
    y_true = int(y_target[idx])
    y_pred = int(pipeline.predict(trial)[0])

    lda: LinearDiscriminantAnalysis = pipeline.named_steps["lda"]
    proba = pipeline.predict_proba(trial)[0]  # shape (4,)
    proba_dict = {LABEL_TO_NAME[label]: float(p) for label, p in zip(CLASS_LABELS, proba)}

    return {
        "idx":             idx,
        "true_label":      LABEL_TO_NAME.get(y_true, "Unknown"),
        "predicted_label": LABEL_TO_NAME.get(y_pred, "Unknown"),
        "correct":         y_true == y_pred,
        "probabilities":   proba_dict,
    }
