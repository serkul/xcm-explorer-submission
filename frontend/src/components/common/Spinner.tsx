import classNames from "classnames";
import css from "./Spinner.module.scss";
import img from "./../../images/spinner.png";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className: c }: SpinnerProps) {
  const className = classNames(css.container, c);
  return <img alt="loading" src={img} className={className} />;
}
