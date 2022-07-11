import classNames from "classnames";
import css from "./App.module.scss";
import { TopMenu } from "./components/topMenu/TopMenu";
import { Content } from "./components/content/Content";
import { DEFAULT_CHAIN, useChainInfo } from "./hooks/useChainInfo";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import React, { useState } from "react";
import { SearchResult } from "./components/content/SearchResult";
import { LatestResults } from "./components/content/LatestResults";

export function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Routes>
          <Route index element={<InChainRoute />} />
          <Route path=":chain" element={<InChainRoute />}>
            <Route index element={<LatestResults />} />
            <Route path=":search" element={<SearchResultWithSearch />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function InChainRoute() {
  const { style, id, apiUrl } = useChainInfo(false) || {};

  return apiUrl ? (
    <div className={classNames(css.container, style)}>
      <TopMenu />
      <Content key={id} />
    </div>
  ) : (
    <Navigate to={`/${DEFAULT_CHAIN}`} />
  );
}

function SearchResultWithSearch() {
  const { search } = useParams<"search">();
  return search ? <SearchResult search={decodeURIComponent(search)} /> : null;
}
