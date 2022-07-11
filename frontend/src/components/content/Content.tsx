import classNames from "classnames";
import css from "./Content.module.scss";
import { ChangeEventHandler, useCallback, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import { faPlay, faXmark } from "@fortawesome/free-solid-svg-icons";
import { IconButton } from "../common/IconButton";
import { useChainInfo } from "../../hooks/useChainInfo";

interface ContentProps {
  className?: string;
}

export function Content({ className: c }: ContentProps) {
  const className = classNames(css.container, c);
  const { name } = useChainInfo(true);
  const navigate = useNavigate();
  const [value, setValue] = useState(useParams<"search">()["search"] ?? "");
  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
    setValue(e.target.value);
  }, []);
  const onButtonClick = useCallback(() => {
    navigate(encodeURIComponent(value));
  }, [navigate, value]);
  const onResetClick = useCallback(() => {
    setValue("");
    navigate("");
  }, [setValue, navigate]);

  return (
    <div className={className}>
      <div className={css.search}>
        <div className={css.inputContainer}>
          <input
            type="text"
            className={css.input}
            value={value}
            onChange={onChange}
            placeholder={`Account ID to query on ${name}`}
          />
          <IconButton
            icon={faXmark}
            onClick={onResetClick}
            className={css.closeButton}
            aria-label="Clear search"
          />
        </div>
        <IconButton
          icon={faPlay}
          onClick={onButtonClick}
          className={css.searchButton}
          aria-label="Search"
        />
      </div>
      <Outlet />
    </div>
  );
}
