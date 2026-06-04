import { HomeFilterSheet } from "@/src/features/housings/home/components/home-filter-sheet";
import { HomeSearchField } from "@/src/features/housings/home/components/home-search-field";
import type { HomeHousingFilters } from "@/src/features/housings/home/types/home-filters";
import type { Dictionary } from "@/src/i18n";

type Props = {
  labels: Dictionary["home"];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filters: HomeHousingFilters;
  onFiltersChange: (value: HomeHousingFilters) => void;
  filterSheetOpen: boolean;
  onFilterSheetOpenChange: (open: boolean) => void;
  activeFilterCount: number;
};

export function HomeListingSearchFilter({
  labels,
  searchQuery,
  onSearchQueryChange,
  filters,
  onFiltersChange,
  filterSheetOpen,
  onFilterSheetOpenChange,
  activeFilterCount,
}: Props) {
  return (
    <>
      <HomeSearchField
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        placeholder={labels.searchPlaceholder}
        hasActiveFilters={activeFilterCount > 0}
        onFilterPress={() => onFilterSheetOpenChange(true)}
        filterAccessibilityLabel={labels.filterTitle}
      />

      <HomeFilterSheet
        open={filterSheetOpen}
        onOpenChange={onFilterSheetOpenChange}
        filters={filters}
        onChange={onFiltersChange}
        labels={labels}
      />
    </>
  );
}
