import joblib
import pandas as pd

from pathlib import Path
from math import atan2, cos, radians, sin, sqrt

from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer

from sklearn.cluster import KMeans
 
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

from sklearn.model_selection import cross_val_score, train_test_split
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

X = pd.concat([housing[HOUSING_FEATURE_NUMBERIC_COLUMNS], rooms], axis=1)
y = housing[TARGET_COLUMN]


numberic_transformer = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    )
])

preprocessor = ColumnTransformer(
    transformers=[
        (
            "num",
            numberic_transformer,
            HOUSING_FEATURE_NUMBERIC_COLUMNS + ROOM_FEATURE_NUMBERIC_COLUMNS
        ),
        (
            "txt",
            TfidfVectorizer(max_features=500),
            ROOM_FEATURE_TEXT_COLUMNS
        )
    ]
)

newModel = Pipeline([
    (
        "preprocessor",
        preprocessor
    ),
    (
        "xgregressor",
        XGBRegressor(
            n_estimators=500, # Số lượng decision tree
            max_depth=4, # Độ sâu của mỗi decision tree
            learning_rate=0.03, # Tốc độ học
            subsample=1.0, # Tỷ lệ mẫu được sử dụng để huấn luyện mỗi decision tree
            colsample_bytree=1.0, # Tỷ lệ cột được sử dụng để huấn luyện mỗi decision tree
            min_child_weight=1,
            random_state=42,
        )
    )
])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

newModel.fit(X_train, y_train)

predictions = newModel.predict(X_test)

result=list(map(lambda x: round(x), predictions))
# print(f"predictions: {result}")

# Mean Absolute Error -> Sai số tuyệt đối trung bình 
mae = mean_absolute_error(y_test, predictions)

# Root Mean Squared Error -> Sai số bình phương trung bình căn bậc 2
# RMSE ≈ MAE → lỗi phân bố khá đều
# RMSE >> MAE → có nhiều outlier hoặc dự đoán rất tệ ở một số điểm
mse = mean_squared_error(y_test, predictions)
rmse = mse ** 0.5

# Model giải thích được bao nhiêu phần biến động của biến mục tiêu (target).
r2 = r2_score(y_test, predictions)

print(f"mae {mae:.4f} : rmse {rmse:.4f} : r2 {r2:.4f}")

joblib.dump(newModel, DATA_DIR / "housing_model.pkl")
joblib.dump(
    {
        "kmeans": kmeans,
        "median_price_per_m2": int(housing["price_per_m2"].median()),
    },
    DATA_DIR / "location_artifacts.pkl",
)

print("Model saved")