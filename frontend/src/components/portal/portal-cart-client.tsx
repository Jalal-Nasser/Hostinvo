"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { portalTheme } from "@/components/portal/portal-theme";
import {
  clearPortalCart,
  readPortalCart,
  removePortalCartItem,
  subscribeToPortalCart,
  type PortalCartItem,
} from "@/lib/portal-cart";

type PortalCartClientProps = {
  emptyTitle: string;
  emptyDescription: string;
  continueShoppingLabel: string;
  comparePricingLabel: string;
  cartKicker: string;
  cartTitle: string;
  cartDescription: string;
  itemTypeLabel: string;
  addedAtLabel: string;
  removeLabel: string;
  clearCartLabel: string;
  mockCheckoutNote: string;
  registerHref: string;
  pricingHref: string;
};

export function PortalCartClient({
  emptyTitle,
  emptyDescription,
  continueShoppingLabel,
  comparePricingLabel,
  cartKicker,
  cartTitle,
  cartDescription,
  itemTypeLabel,
  addedAtLabel,
  removeLabel,
  clearCartLabel,
  mockCheckoutNote,
  registerHref,
  pricingHref,
}: PortalCartClientProps) {
  const [items, setItems] = useState<PortalCartItem[]>([]);

  useEffect(() => {
    const syncItems = () => {
      setItems(readPortalCart());
    };

    syncItems();

    return subscribeToPortalCart(syncItems);
  }, []);

  return items.length === 0 ? (
    <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
      <h2 className="text-xl font-semibold text-white">{emptyTitle}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aebad4]">{emptyDescription}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link className={portalTheme.primaryButtonClass} href={registerHref}>
          {continueShoppingLabel}
        </Link>
        <Link className={portalTheme.secondaryButtonClass} href={pricingHref}>
          {comparePricingLabel}
        </Link>
      </div>
    </section>
  ) : (
    <div className="space-y-6">
      <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={portalTheme.sectionKickerClass}>{cartKicker}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{cartTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">{cartDescription}</p>
          </div>

          <button className={portalTheme.secondaryButtonClass} onClick={() => clearPortalCart()} type="button">
            {clearCartLabel}
          </button>
        </div>
      </section>

      <section className="grid gap-4">
        {items.map((item) => (
          <article key={item.id} className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.domain}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#aebad4]">
                  <span>{itemTypeLabel}</span>
                  <span className="text-[#6f85aa]">/</span>
                  <span>{item.price}</span>
                  <span className="text-[#6f85aa]">/</span>
                  <span>
                    {addedAtLabel}:{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(item.addedAt))}
                  </span>
                </div>
              </div>

              <button
                className={portalTheme.secondaryButtonClass}
                onClick={() => removePortalCartItem(item.id)}
                type="button"
              >
                {removeLabel}
              </button>
            </div>
          </article>
        ))}
      </section>

      <div className={portalTheme.noteClass}>{mockCheckoutNote}</div>
    </div>
  );
}
