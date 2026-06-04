import shap
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from pathlib import Path
from math import atan2, cos, radians, sin, sqrt

from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer

from sklearn.cluster import KMeans
 
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

from sklearn.model_selection import RandomizedSearchCV, cross_val_score, train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

DATA_DIR = Path(__file__).resolve().parent

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
    "price_per_m2"
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

ROOM_OTHER = [
    "pet",
    "tivi",
    "time",
    "washer",
    "mattress",
    "floor", 
    "drying_yard", 
    "room_area",
    "gatelock",
    "toilet",
    "parking_space",
    "cooling_type",
]

ROOM_FEATURE_TEXT_COLUMNS = "combined_text"
TARGET_COLUMN = "price"

housing = pd.read_csv(DATA_DIR / "housing_with_coordinates.csv")
rooms = pd.read_csv(DATA_DIR / "rooms.csv")

rooms["combined_text"] = (
    "Dry Yard: " +
    rooms["drying_yard"].fillna("") + "Cooling Type: " +
    rooms["cooling_type"].fillna("") + "Parking Space: " +
    rooms["parking_space"].fillna("") + "Toilet: " +
    rooms["toilet"].fillna("") + "Gatelock: " +
    rooms["gatelock"].fillna("") + "Time: " +
    rooms["time"].fillna("")
    )

housing.drop(columns=["id", "created_at", "updated_at", "last_update"], inplace=True)
rooms.drop(columns=["id", "created_at", "updated_at"], inplace=True)

# Haverside
CBD_LAT = 10.7720
CBD_LNG = 106.6983

def haversine(lat1, lon1, lat2, lon2):
    R = 6371

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c

housing["distance_to_center"] = housing.apply(
    lambda row: haversine(
        row["latitude"],
        row["longitude"],
        CBD_LAT,
        CBD_LNG
    ),
    axis=1
)

kmeans = KMeans(n_clusters=10, random_state=42)
housing["location_cluster"] = kmeans.fit_predict(housing[["latitude", "longitude"]])

rooms["room_area"] = rooms["room_area"].astype(str).str.extract(r"(\d+\.?\d*)")[0]
rooms["room_area"] = pd.to_numeric(rooms["room_area"], errors="coerce").fillna(20).astype(int)
housing["price_per_m2"] = (housing["price"] // rooms["room_area"])

# Convert Type
rooms[ROOM_FEATURE_NUMBERIC_COLUMNS] = rooms[ROOM_FEATURE_NUMBERIC_COLUMNS].fillna(0).astype(int)


def _coerce_bool_column(series: pd.Series) -> pd.Series:
    def to_int(value) -> int:
        if pd.isna(value):
            return 0
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, (int, float)):
            return 1 if value else 0
        normalized = str(value).strip().lower()
        if normalized in {"true", "1", "yes", "miễn phí", "mien phi"}:
            return 1
        return 0

    return series.map(to_int)


housing["has_wifi"] = _coerce_bool_column(housing["has_wifi"])

# XGBoost only accepts numeric dtypes — exclude string ROOM_OTHER columns and combined_text.
X = pd.concat(
    [
        housing[HOUSING_FEATURE_NUMBERIC_COLUMNS],
        rooms[ROOM_FEATURE_NUMBERIC_COLUMNS + ["room_area"]],
    ],
    axis=1,
)
y = housing[TARGET_COLUMN]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

param_grid = {
    "n_estimators": [200, 500, 800],
    "max_depth": [4, 6, 8, 10],
    "learning_rate": [0.01, 0.03, 0.05, 0.1],
    "subsample": [0.7, 0.8, 1.0],
    "colsample_bytree": [0.7, 0.8, 1.0],
    "min_child_weight": [1, 3, 5]
}

xgb = XGBRegressor(
    objective="reg:squarederror",
    random_state=42
)

search = RandomizedSearchCV(
    estimator=xgb,
    param_distributions=param_grid,
    n_iter=30,
    scoring="neg_mean_absolute_error",
    cv=5,
    verbose=2,
    random_state=42,
    n_jobs=1
)
search.fit(X_train, y_train)

best_model = search.best_estimator_

predictions = best_model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print("MAE:", mae)
print("R2 :", r2)

# importance = pd.DataFrame({
#     "feature": X.columns,
#     "importance": best_model.feature_importances_,
# })

# print(
#     importance.sort_values(
#         by="importance",
#         ascending=False
#     )
# )

# scores = cross_val_score(
#     best_model,
#     X,
#     y,
#     cv=5,
#     scoring="r2"
# )

# print(scores)
# print("r2:", scores.mean())
# print("Mean:", np.mean(scores))
# print("Std:", np.std(scores))

explainer = shap.TreeExplainer(best_model)

shap_values = explainer.shap_values(X)
shap.summary_plot(shap_values, X)

# results = X_test.copy()
# results["actual"] = y_test.values
# results["predicted"] = predictions

# results["error"] = abs(
#     results["actual"] -
#     results["predicted"]
# )

# worst_cases = results.sort_values(
#     "error",
#     ascending=False
# )

# print(worst_cases.head(20))

# residuals = y_test - predictions

# plt.scatter(
#     predictions,
#     residuals
# )

# plt.axhline(0)

# plt.xlabel("Predicted")
# plt.ylabel("Residual")

# plt.show()