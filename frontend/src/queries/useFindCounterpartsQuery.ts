import { Direction, XcmTransfer } from "../types/XcmTransfer";
import { CHAIN_BY_DB_ID } from "../hooks/useChainInfo";
import { gql, request } from "graphql-request";
import { useQuery } from "react-query";

export function useFindCounterpartsQuery({
  fromParachainId,
  toParachainId,
  direction,
  timestamp,
  xcmpMessageHash,
}: XcmTransfer & { direction: Direction }) {
  const { apiUrl, dbId, fieldsSchema } =
    CHAIN_BY_DB_ID.get(direction === "from" ? toParachainId : fromParachainId) ?? {};
  let query: string;
  switch (direction) {
    case "from":
      query = gql`
        query ($hash: String, $timestamp: String) {
          xCMTransfers(
            filter: {
              xcmpMessageHash: { equalTo: $hash }
              timestamp: { greaterThanOrEqualTo: $timestamp }
            }
            first: 1
            orderBy: BLOCK_NUMBER_ASC
          ) {
            ${fieldsSchema}
          }
        }
      `;
      break;
    case "to":
      query = gql`
        query ($hash: String, $timestamp: String) {
          xCMTransfers(
            filter: {
              xcmpMessageHash: { equalTo: $hash }
              timestamp: { lessThanOrEqualTo: $timestamp }
            }
            first: 1
            orderBy: BLOCK_NUMBER_DESC
          ) {
            ${fieldsSchema}
          }
        }
      `;
      break;
    default:
      throw Error("Unexpected direction");
  }
  return useQuery(
    ["counterpart", dbId, xcmpMessageHash, timestamp],
    () =>
      request<{
        xCMTransfers: {
          nodes: Array<XcmTransfer>;
        };
      }>(apiUrl || "", query, {
        hash: xcmpMessageHash,
        timestamp,
      }).then(({ xCMTransfers: { nodes } }) => nodes[0] as XcmTransfer | undefined),
    { enabled: !!apiUrl },
  );
}
