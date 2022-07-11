import { useChainInfo } from "../hooks/useChainInfo";
import { useInfiniteQuery } from "react-query";
import { request, Variables } from "graphql-request";
import { Direction, XcmTransfer } from "../types/XcmTransfer";
import { useCallback } from "react";

export function usePagedQuery<TQueryKey extends string | readonly unknown[]>(
  queryId: TQueryKey,
  gqlQuery: (fields: string) => string,
  queryVariables?: (pageParam: string) => Variables,
) {
  const { apiUrl, dbId, fieldsSchema } = useChainInfo(true);
  const query = useInfiniteQuery(
    queryId,
    ({ pageParam = "" }) =>
      request<{
        xCMTransfers: {
          pageInfo: {
            endCursor: string;
            hasNextPage: boolean;
          };
          totalCount: number;
          nodes: Array<XcmTransfer>;
        };
      }>(apiUrl || "", gqlQuery(fieldsSchema), queryVariables?.(pageParam)),
    {
      getNextPageParam: ({
        xCMTransfers: {
          pageInfo: { hasNextPage, endCursor },
        },
      }) => (hasNextPage ? endCursor : undefined),
    },
  );
  const loadMore = useCallback(() => {
    if (query.hasNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);
  const allNodes = query.data?.pages
    .map(page =>
      page.xCMTransfers.nodes.map(node => ({
        ...node,
        direction: dbId.includes(node.fromParachainId)
          ? dbId.includes(node.toParachainId)
            ? ("both" as Direction)
            : ("from" as Direction)
          : dbId.includes(node.toParachainId)
          ? ("to" as Direction)
          : ("none" as Direction),
      })),
    )
    .flat()
    .filter(item => item.direction === "from" || item.direction === "to");
  return [query, loadMore, allNodes] as const;
}
