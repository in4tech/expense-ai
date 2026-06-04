import { useCallback, useMemo, useState } from "react";

import {
  countActiveHomeFilters,
  EMPTY_HOME_HOUSING_FILTERS,
  type HomeHousingFilters,
} from "@/src/features/housings/home/types/home-filters";
import { filterHousings } from "@/src/features/housings/home/utils/filter-housings";
import type { Housing } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";

export function useHomeListingFilters(labels: Dictionary["home"]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<HomeHousingFilters>(
    EMPTY_HOME_HOUSING_FILTERS,
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const activeFilterCount = useMemo(
    () => countActiveHomeFilters(filters),
    [filters],
  );

  const applyToHousings = useCallback(
    (housings: Housing[]) => filterHousings(housings, searchQuery, filters),
    [filters, searchQuery],
  );

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return labels.searchNoResults;
    }
    if (activeFilterCount > 0) {
      return labels.filterNoResults;
    }
    return labels.empty;
  }, [activeFilterCount, labels, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filterSheetOpen,
    setFilterSheetOpen,
    activeFilterCount,
    applyToHousings,
    emptyMessage,
  };
}
