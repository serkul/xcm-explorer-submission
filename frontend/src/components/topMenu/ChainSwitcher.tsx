import classNames from "classnames";
import css from "./ChainSwitcher.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { CHAIN_INFO, useChainInfo } from "../../hooks/useChainInfo";
import { NavLink } from "react-router-dom";

interface ChainSwitcherProps {
  className?: string;
}

export function ChainSwitcher({ className: c }: ChainSwitcherProps) {
  const className = classNames(css.container, c);
  const { logo, name } = useChainInfo(true);
  return (
    <div className={className}>
      <div className={css.groupHeader}>
        <img src={logo} className={css.logo} alt="Chain logo" />
        <div className={css.name}>{name}</div>
        <FontAwesomeIcon icon={faCaretDown} />
      </div>
      <ul className={css.dropdown}>
        {Object.entries(CHAIN_INFO).map(([id, { name, logo }]) => (
          <li className={css.item} key={id}>
            <NavLink
              to={`/${id}`}
              className={({ isActive }) => classNames(css.link, isActive && css.linkActive)}
            >
              <img src={logo} className={css.itemLogo} alt={"Chain logo"} />
              {name}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
