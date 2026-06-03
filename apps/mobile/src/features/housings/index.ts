export type { Housing, HousingDetail, HousingDetailResponse, HousingListResponse, RoomDetail } from "@/src/features/housings/types";
export { listHousings, getHousingById } from "@/src/features/housings/api/services";
export { housingsListQueryOptions, housingDetailQueryOptions } from "@/src/features/housings/api/queries";
export {
  formatAmenitiesDescription,
  getHousingCoords,
  HouseDetailCenterState,
  HouseDetailHeader,
  HouseDetailHero,
  HouseDetailLocationMap,
  HouseDetailOverviewSection,
  HouseDetailPropertySection,
  HouseDetailRoomSection,
  HouseDetailSection,
} from "@/src/features/housings/house-detail";
