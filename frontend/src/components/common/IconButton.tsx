import classNames from "classnames";
import css from "./IconButton.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HTMLProps } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IconButtonProps extends HTMLProps<HTMLButtonElement> {
  icon: IconProp;
  type?: "submit" | "reset" | "button" | undefined;
}

export function IconButton({ className: c, icon, ...rest }: IconButtonProps) {
  const className = classNames(css.container, c);
  return (
    <button className={className} {...rest}>
      <FontAwesomeIcon icon={icon} className={css.icon} />
    </button>
  );
}
