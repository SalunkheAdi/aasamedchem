import { Prisma } from "@prisma/client";
import Decimal = Prisma.Decimal;

export type Dimension = "WEIGHT" | "VOLUME" | "COUNT";

export interface UnitInfo {
  dimension: Dimension;
  factor: Decimal; // Factor to convert to base unit
  label: string;
}

export const UNIT_CONFIG: Record<string, UnitInfo> = {
  g: { dimension: "WEIGHT", factor: new Decimal(1), label: "grams (g)" },
  kg: { dimension: "WEIGHT", factor: new Decimal(1000), label: "kilograms (kg)" },
  mL: { dimension: "VOLUME", factor: new Decimal(1), label: "milliliters (mL)" },
  L: { dimension: "VOLUME", factor: new Decimal(1000), label: "liters (L)" },
  items: { dimension: "COUNT", factor: new Decimal(1), label: "items (count)" },
};

/**
 * Validates that both units belong to the same dimension.
 */
export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const configA = UNIT_CONFIG[unitA];
  const configB = UNIT_CONFIG[unitB];
  if (!configA || !configB) return false;
  return configA.dimension === configB.dimension;
}

/**
 * Converts a quantity from a source unit to a target unit within the same dimension.
 */
export function convertUnit(
  quantity: Decimal | number | string,
  sourceUnit: string,
  targetUnit: string
): Decimal {
  const q = new Decimal(quantity);
  const srcConfig = UNIT_CONFIG[sourceUnit];
  const targetConfig = UNIT_CONFIG[targetUnit];

  if (!srcConfig || !targetConfig) {
    throw new Error(`Invalid units provided: ${sourceUnit} -> ${targetUnit}`);
  }

  if (srcConfig.dimension !== targetConfig.dimension) {
    throw new Error(
      `Incompatible dimensions: Cannot convert from ${sourceUnit} (${srcConfig.dimension}) to ${targetUnit} (${targetConfig.dimension})`
    );
  }

  // Convert to base unit, then to target unit
  const qtyInBase = q.mul(srcConfig.factor);
  return qtyInBase.div(targetConfig.factor);
}

/**
 * Helper to convert quantity in a unit to the base unit of its dimension.
 */
export function convertToBase(quantity: Decimal | number | string, unit: string): Decimal {
  const q = new Decimal(quantity);
  const config = UNIT_CONFIG[unit];
  if (!config) {
    throw new Error(`Invalid unit: ${unit}`);
  }
  return q.mul(config.factor);
}

/**
 * Calculates subtotal price in INR.
 * @param orderedQty Quantity ordered by user
 * @param orderedUnit Unit of the ordered quantity (e.g. "g")
 * @param price Rate per price unit (e.g. 500)
 * @param priceUnit Unit the rate is configured in (e.g. "kg")
 */
export function calculateSubtotal(
  orderedQty: Decimal | number | string,
  orderedUnit: string,
  price: Decimal | number | string,
  priceUnit: string
): Decimal {
  if (!areUnitsCompatible(orderedUnit, priceUnit)) {
    throw new Error(
      `Incompatible units: Ordered unit ${orderedUnit} is incompatible with price unit ${priceUnit}`
    );
  }

  const q = new Decimal(orderedQty);
  const p = new Decimal(price);

  // Convert ordered quantity to the price unit
  const qtyInPriceUnit = convertUnit(q, orderedUnit, priceUnit);

  // Multiply by price per unit
  return qtyInPriceUnit.mul(p);
}
