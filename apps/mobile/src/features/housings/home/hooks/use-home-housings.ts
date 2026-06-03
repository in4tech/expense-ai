import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { housingsListQueryOptions } from "@/src/features/housings/api/queries";
import { HOME_LIST_LIMIT } from "@/src/features/housings/home/constants";
import { useAuth } from "@/src/providers/auth-context";

export function useHomeHousings() {
  const { getApiClient } = useAuth();
  const client = useMemo(() => getApiClient(), [getApiClient]);

  return useQuery(housingsListQueryOptions(client, HOME_LIST_LIMIT, 0));
}
