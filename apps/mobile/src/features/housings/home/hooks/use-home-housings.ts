import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { housingsListQueryOptions } from "@/src/features/housings/api/queries";
import { listHousings } from "@/src/features/housings/api/services";
import {
  HOME_HOUSINGS_MIN_LOADING_MS,
  HOME_LIST_LIMIT,
} from "@/src/features/housings/home/constants";
import { isDevMode } from "@/src/config/dev-mode";
import { useAuth } from "@/src/providers/auth-context";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchHomeHousingsWithMinLoading(
  ...args: Parameters<typeof listHousings>
) {
  const startedAt = Date.now();
  const result = await listHousings(...args);
  if (isDevMode) {
    const remaining = HOME_HOUSINGS_MIN_LOADING_MS - (Date.now() - startedAt);
    if (remaining > 0) {
      await wait(remaining);
    }
  }
  return result;
}

export function useHomeHousings() {
  const { getApiClient } = useAuth();
  const client = useMemo(() => getApiClient(), [getApiClient]);
  const baseOptions = housingsListQueryOptions(client, HOME_LIST_LIMIT, 0);

  return useQuery({
    ...baseOptions,
    queryFn: () => fetchHomeHousingsWithMinLoading(client, HOME_LIST_LIMIT, 0),
  });
}
