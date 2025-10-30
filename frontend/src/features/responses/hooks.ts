import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { qkResponses } from "./keys";
import { fetchResponses, type ListResponsesParams } from "./api";

type Resp = Awaited<ReturnType<typeof fetchResponses>>; // { items, total }

export function useResponses(params?: ListResponsesParams) {
  return useQuery<Resp>({
    queryKey: qkResponses.list(params),
    queryFn: () => fetchResponses(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
