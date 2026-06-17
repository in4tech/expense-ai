import re
from math import atan2, cos, radians, sin, sqrt
from pathlib import Path

import joblib
import pandas as pd

# Artifacts are written by housing_train.py under app/data/housings/
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "housings"
MODEL_PATH = DATA_DIR / "housing_model.pkl"
ARTIFACTS_PATH = DATA_DIR / "location_artifacts.pkl"

CBD_LAT = 10.7720
CBD_LNG = 106.6983

HOUSING_FEATURE_NUMBERIC_COLUMNS = [
    "electricity_fee",
    "water_fee",
    "card_fee",
    "washing_machine_fee",
    "garbage_fee",
    "parking_fee",
    "has_wifi",
    "otherfee",
    "latitude",
    "longitude",
    "location_cluster",
    "distance_to_center",
    "price_per_m2",
    "room_area",
]

ROOM_FEATURE_NUMBERIC_COLUMNS = [
    "kitchen",
    "desk",
    "bed",
    "elevator",
    "bancony",
    "fridge",
    "hotwater",
    "air_conditioner",
    "wardrobe",
    "window",
    "attic",
    "skylight",
    "kitchent_sink",
]

ROOM_TEXT_FIELDS = [
    "drying_yard",
    "cooling_type",
    "parking_space",
    "toilet",
    "gatelock",
    "time",
]


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return r * c


def build_combined_text(payload: dict) -> str:
    return (
        "Dry Yard: "
        + str(payload.get("drying_yard") or "")
        + "Cooling Type: "
        + str(payload.get("cooling_type") or "")
        + "Parking Space: "
        + str(payload.get("parking_space") or "")
        + "Toilet: "
        + str(payload.get("toilet") or "")
        + "Gatelock: "
        + str(payload.get("gatelock") or "")
        + "Time: "
        + str(payload.get("time") or "")
    )


def _parse_room_area(value, default: int = 20) -> int:
    if value is None:
        return default
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        n = int(value)
        return n if n > 0 else default
    text = str(value).strip()
    if not text:
        return default
    match = re.search(r"(\d+\.?\d*)", text)
    if not match:
        return default
    try:
        n = int(float(match.group(1)))
        return n if n > 0 else default
    except ValueError:
        return default


def _bool_to_int(value) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return 1 if value else 0
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes"}:
            return 1
    return 0


def _load_artifacts() -> dict:
    if not ARTIFACTS_PATH.exists():
        raise FileNotFoundError(
            "location_artifacts.pkl not found. Run housing_train.py to generate model artifacts."
        )
    return joblib.load(ARTIFACTS_PATH)


def build_predict_row(payload: dict) -> dict:
    latitude = float(payload["latitude"])
    longitude = float(payload["longitude"])
    artifacts = _load_artifacts()
    kmeans = artifacts["kmeans"]
    median_price_per_m2 = int(artifacts.get("median_price_per_m2", 0))

    distance_to_center = haversine(latitude, longitude, CBD_LAT, CBD_LNG)
    location_cluster = int(kmeans.predict([[latitude, longitude]])[0])

    row: dict = {
        "electricity_fee": float(payload.get("electricity_fee") or 0),
        "water_fee": float(payload.get("water_fee") or 0),
        "card_fee": float(payload.get("card_fee") or 0),
        "washing_machine_fee": float(payload.get("washing_machine_fee") or 0),
        "garbage_fee": float(payload.get("garbage_fee") or 0),
        "parking_fee": float(payload.get("parking_fee") or 0),
        "has_wifi": _bool_to_int(payload.get("has_wifi")),
        "otherfee": float(payload.get("otherfee") or 0),
        "latitude": latitude,
        "longitude": longitude,
        "location_cluster": location_cluster,
        "distance_to_center": distance_to_center,
        "price_per_m2": int(payload.get("price_per_m2") or median_price_per_m2),
        "combined_text": build_combined_text(payload),
        "room_area": _parse_room_area(payload.get("room_area")),
    }

    for key in ROOM_FEATURE_NUMBERIC_COLUMNS:
        row[key] = _bool_to_int(payload.get(key))

    return row


def predict_price(payload: dict) -> int:
    if not MODEL_PATH.exists():
        raise FileNotFoundError("housing_model.pkl not found. Run housing_train.py first.")

    model = joblib.load(MODEL_PATH)
    row = build_predict_row(payload)
    sample = pd.DataFrame([row])
    prediction = model.predict(sample)[0]
    return int(round(float(prediction)))
