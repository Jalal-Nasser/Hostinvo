export type PortalCartItem = {
  id: string;
  type: "domain-registration";
  domain: string;
  price: string;
  addedAt: string;
};

const portalCartStorageKey = "hostinvo.portal.cart.v1";
const portalCartChangedEvent = "hostinvo:portal-cart-changed";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function dispatchPortalCartChanged(): void {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(portalCartChangedEvent));
}

export function readPortalCart(): PortalCartItem[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(portalCartStorageKey);

    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(storedValue) as PortalCartItem[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePortalCart(items: PortalCartItem[]): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(portalCartStorageKey, JSON.stringify(items));
  dispatchPortalCartChanged();
}

export function addPortalCartItem(item: Omit<PortalCartItem, "id" | "addedAt">): PortalCartItem[] {
  const existingItems = readPortalCart().filter(
    (existingItem) => !(existingItem.type === item.type && existingItem.domain === item.domain),
  );

  const nextItems = [
    {
      ...item,
      id: `${item.type}:${item.domain}`,
      addedAt: new Date().toISOString(),
    },
    ...existingItems,
  ];

  writePortalCart(nextItems);

  return nextItems;
}

export function removePortalCartItem(itemId: string): PortalCartItem[] {
  const nextItems = readPortalCart().filter((item) => item.id !== itemId);

  writePortalCart(nextItems);

  return nextItems;
}

export function clearPortalCart(): void {
  writePortalCart([]);
}

export function subscribeToPortalCart(callback: () => void): () => void {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(portalCartChangedEvent, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(portalCartChangedEvent, handleChange);
  };
}
