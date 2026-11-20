/**
 * Anchor-based ordering utilities.
 * The root defines base order. Descendant items store insertAfter (field key or element id).
 * Hidden fields keep position so unhiding restores layout. If an anchor is deleted, the item
 * falls back to the end of its section. Items sharing an anchor keep their relative order.
 */
export function applyAnchors(): never {
  throw new Error('Not implemented');
}
