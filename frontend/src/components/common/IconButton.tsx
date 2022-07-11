import classNames from "classnames";
import css from "./IconButton.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HTMLProps } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IconButtonProps extends HTMLProps<HTMLButtonElement> {
  icon: IconProp;
}

export function IconButton({ className: c, icon, type, ...rest }: IconButtonProps) {
  const className = classNames(css.container, c);
  return (
    <button className={className} {...rest}>
      <FontAwesomeIcon icon={icon} className={css.icon} />
    </button>
  );
}
