import { UnitCode } from '@pantryos/contracts';

/**
 * Standard unit conversions to canonical base units (g and ml)
 */
export function convertToBaseUnit(quantity: number, unit: UnitCode): { baseQuantity: number; baseUnit: UnitCode } {
  switch (unit) {
    case 'kg':
      return { baseQuantity: quantity * 1000, baseUnit: 'g' };
    case 'g':
      return { baseQuantity: quantity, baseUnit: 'g' };
    case 'l':
      return { baseQuantity: quantity * 1000, baseUnit: 'ml' };
    case 'ml':
      return { baseQuantity: quantity, baseUnit: 'ml' };
    case 'pcs':
    case 'pack':
      return { baseQuantity: quantity, baseUnit: unit };
    default:
      return { baseQuantity: quantity, baseUnit: unit };
  }
}
