/**
 * Alert ↔ item matching rules (single source of truth).
 *
 * Used when an admin creates an item and when an item is marked returned.
 *
 * An alert matches an item when:
 *  1. Every keyword appears in the item title + description (case-insensitive)
 *  2. Category equals the alert's category, when set
 *  3. Location equals the alert's location, when set
 *  4. For document alerts: the item is a document and every document field
 *     set on the alert matches the item's value
 *  5. Colour matches, when set on the alert
 */

export type ItemForMatching = {
  title: string;
  description: string;
  categoryId: string | null;
  locationId: string | null;
  isDocument: boolean;
  documentNumber: string | null;
  documentYear: string | null;
  issuingAuthority: string | null;
  holderName: string | null;
  color: string | null;
};

export type AlertForMatching = {
  keywords: string;
  categoryId: string | null;
  locationId: string | null;
  isDocument: boolean;
  documentNumber: string | null;
  documentYear: string | null;
  issuingAuthority: string | null;
  holderName: string | null;
  color: string | null;
};

function contains(haystack: string | null, needle: string | null): boolean {
  if (!needle) return true;
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase().trim());
}

export function matchesAlert(
  alert: AlertForMatching,
  item: ItemForMatching
): boolean {
  const keywords = alert.keywords
    .toLowerCase()
    .split(/\s+/)
    .filter((keyword) => keyword.length > 0);

  const itemText = `${item.title} ${item.description}`.toLowerCase();

  if (!keywords.every((keyword) => itemText.includes(keyword))) {
    return false;
  }

  if (alert.categoryId && alert.categoryId !== item.categoryId) {
    return false;
  }

  if (alert.locationId && alert.locationId !== item.locationId) {
    return false;
  }

  if (alert.isDocument) {
    if (!item.isDocument) return false;
    if (!contains(item.documentNumber, alert.documentNumber)) return false;
    if (!contains(item.documentYear, alert.documentYear)) return false;
    if (!contains(item.issuingAuthority, alert.issuingAuthority)) return false;
    if (!contains(item.holderName, alert.holderName)) return false;
  }

  if (alert.color && !contains(item.color, alert.color)) {
    return false;
  }

  return true;
}

/** Build the item shape the matcher expects from a Prisma Item. */
export function toMatchableItem(item: ItemForMatching): ItemForMatching {
  return item;
}
