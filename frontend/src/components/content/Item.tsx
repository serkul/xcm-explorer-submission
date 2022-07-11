import classNames from "classnames";
import css from "./Item.module.scss";
import { Direction, json, XcmTransfer } from "../../types/XcmTransfer";
import { useCallback, useState } from "react";
import { CHAIN_BY_DB_ID, useChainInfo } from "../../hooks/useChainInfo";
import { IconButton } from "../common/IconButton";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { faCheck, faChevronUp, faClose } from "@fortawesome/free-solid-svg-icons";
import { useFindCounterpartsQuery } from "../../queries/useFindCounterpartsQuery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Spinner } from "../common/Spinner";

interface ItemProps {
  className?: string;
  item: XcmTransfer & { direction: Direction };
}

export function Item({ className: c, item }: ItemProps) {
  const counterpartItemQuery = useFindCounterpartsQuery(item);
  const counterpartItem = counterpartItemQuery.data;
  const direction = item.direction;
  const [from, to] =
    direction === "from" ? ([item, counterpartItem] as const) : ([counterpartItem, item] as const);

  const itemParachain = useChainInfo(false);
  const counterpartParachain = CHAIN_BY_DB_ID.get(
    direction === "from" ? item.toParachainId : item.fromParachainId,
  );

  const {
    timestamp,
    fromParachainId,
    fromAddress,
    fromAddressSS58,
    // amount,
    // blockNumber,
    // assetParachainId,
    // assetId,
    // xcmpMessageStatus,
  } = from ?? item;
  const { toParachainId, toAddress, toAddressSS58 } = to ?? item;

  const time = new Date(timestamp || Date.now()).toLocaleString();
  const fromParachain = CHAIN_BY_DB_ID.get(fromParachainId);
  const toParachain = CHAIN_BY_DB_ID.get(toParachainId);

  const [collapsed, setCollapsed] = useState(true);
  const toggleCollapsed = useCallback(() => setCollapsed(value => !value), []);
  const className = classNames(css.container, c, collapsed && css.collapsed);
  return direction === "none" ? null : (
    <div className={className}>
      <div className={css.firstRow}>
        <div className={css.timeStamp}>{time}</div>
        {counterpartItemQuery.isLoading ? (
          <Spinner />
        ) : (
          <FontAwesomeIcon
            icon={counterpartItem ? faCheck : faClose}
            className={css.counterpartLogo}
            title={
              counterpartItem ? "Found counterpart message" : "Couldn't find counterpart message"
            }
          />
        )}
        <IconButton icon={faChevronUp} className={css.collapseToggle} onClick={toggleCollapsed} />
        <div className={css.br} />
        <div className={css.fromDirection}>from</div>
        <div className={css.fromParachain}>
          {fromParachain ? (
            <img
              src={fromParachain.logo}
              className={css.fromLogo}
              alt={fromParachain.name}
              title={fromParachain.name}
            />
          ) : (
            <FontAwesomeIcon icon={faClose} className={css.fromLogo} title={"Unknown parachain"} />
          )}
        </div>
        <Address address={fromAddress} className={css.fromAddress} />
        <div className={css.smallBr} />
        <div className={css.fromDirection}>SS58:</div>
        <Address address={fromAddressSS58} className={css.fromAddress} />
        <div className={css.br} />
        <div className={css.toDirection}>to</div>
        <div className={css.toParachain}>
          {toParachain ? (
            <img
              src={toParachain.logo}
              className={css.toLogo}
              alt={toParachain.name}
              title={toParachain.name}
            />
          ) : (
            <FontAwesomeIcon icon={faClose} className={css.toLogo} title={"Unknown parachain"} />
          )}
        </div>
        <Address address={toAddress} className={css.toAddress} />
        <div className={css.smallBr} />
        <div className={css.toDirection}>SS58:</div>
        <Address address={toAddressSS58} className={css.toAddress} />
      </div>
      <div className={css.content}>
        <h5>Message in {itemParachain?.name ?? "Unknown"} parachain</h5>
        <pre>{toNicerJson(item)}</pre>
        {counterpartItemQuery.isLoading ? (
          <Spinner />
        ) : (
          counterpartParachain &&
          counterpartItem && (
            <>
              <h5>Message in {counterpartParachain?.name ?? "Unknown"} parachain</h5>
              <pre>{toNicerJson(counterpartItem)}</pre>
            </>
          )
        )}
      </div>
    </div>
  );
}

interface AddressProps {
  className?: string;
  address?: string | null;
}

function Address({ className, address }: AddressProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const clickHandler = useCallback(async () => {
    try {
      if (address) {
        await navigator.clipboard.writeText(address);
        setCopiedAddress(true);
      }
    } catch (e) {
      console.error("Failed to copy to clipboard");
    }
  }, [address]);
  const leaveHandler = useCallback(() => setCopiedAddress(false), []);

  return (
    <div className={className}>
      <input type="text" value={address || ""} placeholder={"null address"} readOnly />
      {!!address && (
        <IconButton
          icon={copiedAddress ? faCheck : faCopy}
          className={css.copyButton}
          onClick={clickHandler}
          onMouseLeave={leaveHandler}
        />
      )}
    </div>
  );
}

function toNicerJson(item: XcmTransfer): string {
  const result: any = {};
  for (const [key, value] of Object.entries(item)) {
    if (key !== "direction" && key !== "nodeId") {
      result[key] =
        key === "blockNumber"
          ? value
          : key === "timestamp"
          ? new Date(value).toLocaleString()
          : rowToJson(value);
    }
  }
  return JSON.stringify(result, undefined, 2);
}

function rowToJson(row: json | undefined): json {
  if (Array.isArray(row)) {
    return row.map(item => {
      try {
        if (typeof item === "string") {
          return JSON.parse(item);
        }
      } catch (e) {}
      return item;
    });
  }
  return row ?? null;
}
