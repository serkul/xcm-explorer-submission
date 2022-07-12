import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { ChainSwitcher } from "./ChainSwitcher";
import css from "./TopMenu.module.scss";

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
          <a href="https://github.com/serkul/xcm-explorer-submission" rel="noreferrer noopener">
            <FontAwesomeIcon icon={faGithub} className={css.icon} />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
