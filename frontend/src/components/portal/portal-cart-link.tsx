"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { readPortalCart, subscribeToPortalCart } from "@/lib/portal-cart";

type PortalCartLinkProps = {
  href: string;
  label: string;
  className: string;
};

export function PortalCartLink({ href, label, className }: PortalCartLinkProps) {
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
      {itemCount > 0 ? `${label} (${itemCount})` : label}
    </Link>
  );
}
