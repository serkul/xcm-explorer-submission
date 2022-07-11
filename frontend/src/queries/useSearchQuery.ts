import { useChainInfo } from "../hooks/useChainInfo";
import { gql } from "graphql-request";
import { usePagedQuery } from "./usePagedQuery";

export function useSearchQuery(search: string, pageSize = 10) {
  const { dbId, fromSearchFields, toSearchFields } = useChainInfo(true);
  const [parachainIdCanBeNull, parachainIds] = dbId.reduce(
    ([canBeNull, ids], item) => [canBeNull || item === null, item === null ? ids : [...ids, item]],
    [false, [] as Array<string>],
  );
  const fromSearchFilters = fromSearchFields.map(field => ({
    [field]: { includesInsensitive: search },
  }));
  const toSearchFilters = toSearchFields.map(field => ({
    [field]: { includesInsensitive: search },
  }));
  return usePagedQuery(
    ["search", dbId, search],
    fields => gql`
      query (
        $pageSize: Int
        $pageParam: Cursor
        $fromSearchFilters: [XCMTransferFilter!]
        $toSearchFilters: [XCMTransferFilter!]
        $parachainIds: [String!]
        $parachainIdCanBeNull: Boolean
      ) {
        xCMTransfers(
          filter: {
            or: [
              {
                and: [
                  {
                    or: [
                      { fromParachainId: { in: $parachainIds } }
                      {
                        and: [
                          { fromParachainId: { isNull: $parachainIdCanBeNull } }
                          { fromParachainId: { isNull: true } }
                        ]
                      }
                    ]
                  }
                  { or: $fromSearchFilters }
                ]
              }
              {
                and: [
                  {
                    or: [
                      { toParachainId: { in: $parachainIds } }
                      {
                        and: [
                          { toParachainId: { isNull: $parachainIdCanBeNull } }
                          { toParachainId: { isNull: true } }
                        ]
                      }
                    ]
                  }
                  { or: $toSearchFilters }
                ]
              }
            ]
          }
          first: $pageSize
          orderBy: BLOCK_NUMBER_DESC
          after: $pageParam
        ) {
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
          ${fields}
        }
      }
    `,
    pageParam => ({
      pageParam,
      pageSize,
      parachainIds,
      parachainIdCanBeNull,
      toSearchFilters,
      fromSearchFilters,
    }),
  );
}
