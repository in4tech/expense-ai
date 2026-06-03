import { StyleSheet, View } from "react-native";

import { FeeChip } from "@/src/features/housings/house-detail/components/fee-chip";
import { MetaRow } from "@/src/features/housings/house-detail/components/meta-row";
import { feeText } from "@/src/features/housings/house-detail/utils";
import type { HousingDetail } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";

type Props = {
  housing: HousingDetail;
  labels: Dictionary["houseDetail"];
  homeLabels: Dictionary["home"];
};

export function HouseDetailPropertySection({ housing, labels: d, homeLabels }: Props) {
  return (
    <>
      <View style={styles.feeGrid}>
        <FeeChip
          label={homeLabels.electricityFee}
          value={feeText(housing.electricity_fee)}
          unit={housing.electricity_unit}
        />
        <FeeChip
          label={homeLabels.waterFee}
          value={feeText(housing.water_fee)}
          unit={housing.water_unit}
        />
        <FeeChip
          label={homeLabels.parkingFee}
          value={feeText(housing.parking_fee)}
          unit={housing.parking_unit}
        />
        <FeeChip
          label={homeLabels.garbageFee}
          value={feeText(housing.garbage_fee)}
          unit={housing.garbage_unit}
        />
        <FeeChip
          label={d.meta.cardFee}
          value={feeText(housing.card_fee)}
          unit={housing.card_unit}
        />
        <FeeChip label={d.meta.washingFee} value={feeText(housing.washing_machine_fee)} />
        <FeeChip label={d.meta.otherFee} value={feeText(housing.otherfee)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  feeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
});
