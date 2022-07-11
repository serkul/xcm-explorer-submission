export interface XcmTransfer {
  nodeId: string;
  id: string;
  blockNumber: string;
  timestamp: string | null;
  fromAddress: string | null;
  fromAddressSS58?: string | null;
  fromParachainId: string | null;
  toAddress: string;
  toAddressSS58?: string | null;
  toParachainId: string;
  assetParachainId?: string | null;
  assetId: json;
  amount: json;
  assetIdTransferred?: json;
  amountTransferred?: json;
  xcmpMessageHash?: string | null;
  xcmpMessageStatus?: string | null;
  xcmpTransferStatus?: json;
  xcmpInstructions?: json;
  warnings?: string;
}

export type Direction = "both" | "from" | "to" | "none";

export type json = null | string | number | Array<json> | { [key: string]: json };
