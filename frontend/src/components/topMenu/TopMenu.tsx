import classNames from "classnames";
import css from "./TopMenu.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { ChainSwitcher } from "./ChainSwitcher";

interface TopMenuProps {
  className?: string;
}

export function TopMenu({ className: c }: TopMenuProps) {
  const className = classNames(css.container, c);
  return (
    <div className={className}>
      <div className={css.menuContainer}>
        <div className={css.menuSection}>
          <ChainSwitcher />
        </div>
        <div className={css.menuSection}>
          <a
            href="https://github.com/grasshoppergn/polkadot-crosschain-transactions-viewer"
            rel="noreferrer noopener"
          >
            <FontAwesomeIcon icon={faGithub} className={css.icon} />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
