import { queryOptions } from "@tanstack/react-query";

import { type ApiClient } from "@/src/api";
import { listHousings } from "@/src/features/housings/api/services";
import { queryKeys } from "@/src/query/query-keys";

export const housingsListQueryOptions = (
  client: ApiClient,
  limit = 40,
  offset = 0,
) =>
  queryOptions({
    queryKey: queryKeys.housings.list(client.baseUrl, limit, offset),
    queryFn: () => listHousings(client, limit, offset),
  });
