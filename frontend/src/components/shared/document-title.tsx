"use client";

import { useEffect } from "react";

type DocumentTitleProps = {
  brand?: string | null;
  title?: string | null;
};

function clean(value?: string | null): string {
  return value?.trim() ?? "";
}

export function DocumentTitle({ brand, title }: DocumentTitleProps) {
  useEffect(() => {
    const brandTitle = clean(brand) || "Hostinvo";
    const pageTitle = clean(title);

    document.title =
      pageTitle && pageTitle !== brandTitle
        ? `${brandTitle} - ${pageTitle}`
        : brandTitle;
  }, [brand, title]);

  return null;
}
