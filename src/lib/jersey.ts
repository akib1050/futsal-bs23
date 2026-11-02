export const JERSEY_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export type JerseySize = (typeof JERSEY_SIZES)[number];

export function isJerseySize(value: string): value is JerseySize {
  return (JERSEY_SIZES as readonly string[]).includes(value);
}
