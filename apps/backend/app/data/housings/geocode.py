from pathlib import Path
import re
import logging
import pandas as pd
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent
INPUT_CSV = DATA_DIR / "housings.csv"
OUTPUT_CSV = DATA_DIR / "housing_with_coordinates.csv"

geolocator = Nominatim(user_agent="expense_ai")
geocode = RateLimiter(
    geolocator.geocode,
    min_delay_seconds=2,
    max_retries=5,
    error_wait_seconds=5,
    swallow_exceptions=True,
    return_value_on_exception=None,
)

GEOCODE_KWARGS = {"timeout": 10, "country_codes": "vn"}


def normalize_address(address: str) -> str:
    """Normalize common VN address patterns for Nominatim."""
    text = str(address).strip()
    # Phường 09 / Quận 04 -> Phường 9 / Quận 4
    text = re.sub(
        r"\b(Phường|Quận)\s+0+(\d+)\b",
        lambda m: f"{m.group(1)} {int(m.group(2))}",
        text,
        flags=re.IGNORECASE,
    )
    # Collapse duplicate city suffix: ..., Thành phố Hồ Chí Minh (already at end)
    text = re.sub(
        r",\s*Thành phố Hồ Chí Minh\s*,\s*Thành phố Hồ Chí Minh\s*$",
        ", Thành phố Hồ Chí Minh",
        text,
        flags=re.IGNORECASE,
    )
    return text


def build_queries(address: str) -> list[str]:
    """Progressive queries from specific street to ward/district centroid."""
    address = normalize_address(address)
    parts = [p.strip() for p in address.split(",") if p.strip()]
    if not parts:
        return []

    street = parts[0]
    street_no_house = re.sub(r"^[0-9]+(?:/[0-9A-Za-z-]+)*\s*", "", street).strip()
    tail = parts[1:]
    suffixes = [", ".join(parts[i:]) for i in range(1, len(parts))]

    queries: list[str] = []
    seen: set[str] = set()

    def add(q: str | None) -> None:
        if not q or q in seen:
            return
        seen.add(q)
        queries.append(q)

    add(f"{address}, Vietnam")
    add(f"{address}, Ho Chi Minh City, Vietnam")

    if street_no_house and street_no_house != street:
        add(f"{street_no_house}, {', '.join(tail)}, Vietnam")

    for suffix in suffixes:
        add(f"{suffix}, Ho Chi Minh City, Vietnam")
        add(f"{suffix}, Vietnam")

    # District / ward only (last 2–3 admin parts)
    if len(parts) >= 2:
        add(f"{', '.join(parts[-2:])}, Vietnam")
    if len(parts) >= 3:
        add(f"{', '.join(parts[-3:])}, Vietnam")

    return queries


def geocode_address(address: str) -> tuple[float | None, float | None]:
    for query in build_queries(address):
        location = geocode(query, **GEOCODE_KWARGS)
        if location:
            logger.info(
                "Matched '%s' -> (%s, %s) for '%s'",
                query,
                location.latitude,
                location.longitude,
                address,
            )
            return location.latitude, location.longitude
        logger.debug("No result for query: %s", query)

    logger.warning("Geocoding failed for address: %s", address)
    return None, None


def main() -> None:
    df = pd.read_csv(INPUT_CSV)

    if OUTPUT_CSV.exists():
        existing = pd.read_csv(OUTPUT_CSV)
        if "latitude" in existing.columns and "id" in existing.columns:
            coord_map = existing.set_index("id")[["latitude", "longitude"]].to_dict("index")
            for idx, row in df.iterrows():
                cached = coord_map.get(row["id"])
                if cached and pd.notna(cached.get("latitude")):
                    df.at[idx, "latitude"] = cached["latitude"]
                    df.at[idx, "longitude"] = cached["longitude"]

    if "latitude" not in df.columns:
        df["latitude"] = None
        df["longitude"] = None

    needs_geocode = df["latitude"].isna() | df["longitude"].isna()
    unique_addresses = df.loc[needs_geocode, "address"].dropna().astype(str).unique()
    logger.info(
        "Rows needing geocode: %s | unique addresses: %s",
        needs_geocode.sum(),
        len(unique_addresses),
    )

    address_coords: dict[str, tuple[float | None, float | None]] = {}
    for i, addr in enumerate(unique_addresses, start=1):
        logger.info("Geocoding %s/%s: %s", i, len(unique_addresses), addr)
        address_coords[addr] = geocode_address(addr)

    for idx, row in df[needs_geocode].iterrows():
        addr = str(row["address"])
        lat, lon = address_coords.get(addr, (None, None))
        df.at[idx, "latitude"] = lat
        df.at[idx, "longitude"] = lon

    df.to_csv(OUTPUT_CSV, index=False)

    found = (df["latitude"].notna() & df["longitude"].notna()).sum()
    print(f"Done! {found}/{len(df)} addresses have coordinates ({round(100 * found / len(df), 1)}%)")


if __name__ == "__main__":
    main()
