"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { readPortalCart, subscribeToPortalCart } from "@/lib/portal-cart";

type PortalCartLinkProps = {
  href: string;
  label: string;
  className: string;
  prefix?: ReactNode;
};

export function PortalCartLink({
  href,
  label,
  className,
  prefix,
}: PortalCartLinkProps) {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const syncItemCount = () => {
      setItemCount(readPortalCart().length);
    };

    syncItemCount();

    return subscribeToPortalCart(syncItemCount);
  }, []);

  return (
    <Link className={className} href={href}>
      {prefix ? <span className="inline-flex">{prefix}</span> : null}
      {itemCount > 0 ? `${label} (${itemCount})` : label}
    </Link>
  );
}
