import classNames from "classnames";
import css from "./LatestResults.module.scss";
import { useChainInfo } from "../../hooks/useChainInfo";
import { Spinner } from "../common/Spinner";
import { Item } from "./Item";
import { useLatestResultsQuery } from "../../queries/useLatestResultsQuery";

interface LatestResultsProps {
  className?: string;
}

export function LatestResults({ className: c }: LatestResultsProps) {
  const className = classNames(css.container, c);
  const { name } = useChainInfo(true);
  const [query, loadMore, allNodes] = useLatestResultsQuery();
  return (
    <div className={className}>
      <h2>Latest transactions from {name} chain</h2>
      {allNodes?.map(item => (
        <Item item={item} key={item.id} />
      ))}
      {query.isLoading || query.isFetchingNextPage ? (
        <Spinner />
      ) : (
        query.hasNextPage && <button onClick={loadMore}>Load more</button>
      )}
    </div>
  );
}
