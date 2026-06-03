from pydantic import BaseModel, Field


class HousingPredictRequest(BaseModel):
    electricity_fee: float = 0
    water_fee: float = 0
    card_fee: float = 0
    washing_machine_fee: float = 0
    garbage_fee: float = 0
    parking_fee: float = 0
    has_wifi: bool = False
    otherfee: float = 0
    latitude: float
    longitude: float
    price_per_m2: int | None = None

    kitchen: bool = False
    desk: bool = False
    bed: bool = False
    elevator: bool = False
    bancony: bool = False
    fridge: bool = False
    hotwater: bool = False
    air_conditioner: bool = False
    wardrobe: bool = False
    window: bool = False
    attic: bool = False
    skylight: bool = False
    kitchent_sink: bool = False

    drying_yard: str | None = None
    cooling_type: str | None = None
    parking_space: str | None = None
    toilet: str | None = None
    gatelock: str | None = None
    time: str | None = None
    room_area: str | None = None
    floor: str | None = None


class HousingPredictResponse(BaseModel):
    price: int = Field(description="Predicted monthly rent in VND")
