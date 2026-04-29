"""
Downloads BCI IV 2a .npz files from the bregydoc/bcidatasetIV2a GitHub repo.
Run once at build time: python download_data.py
"""

import os
import urllib.request
from pathlib import Path

token = os.environ.get("GITHUB_TOKEN")
if token:
    opener = urllib.request.build_opener()
    opener.addheaders = [("Authorization", f"token {token}")]
    urllib.request.install_opener(opener)

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

BASE_URL = "https://github.com/VyasSri/EEG-Motor-Imagery-Explorer/raw/main/eeg-motor-imagery-explorer/backend/data"

FILES = [f"A0{i}{s}.npz" for i in range(1, 10) for s in ("T", "E")]

for fname in FILES:
    dest = DATA_DIR / fname
    if dest.exists():
        print(f"  already exists: {fname}")
        continue
    url = f"{BASE_URL}/{fname}"
    print(f"  downloading {fname} ...", flush=True)
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"  done: {fname} ({dest.stat().st_size // 1_000_000} MB)")
    except Exception as e:
        print(f"  FAILED {fname}: {e}")
