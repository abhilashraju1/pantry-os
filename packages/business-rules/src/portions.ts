/**
 * Batch portion derivations from actual usable cooked yield
 */

export function calculateMaxPortions(actualUsableYield: number, portionSize: number): number {
  if (portionSize <= 0 || actualUsableYield <= 0) return 0;
  return Math.floor(actualUsableYield / portionSize);
}

export function calculateRemainingPortions(params: {
  actualUsableYield: number;
  portionSize: number;
  alreadyReservedPortions: number;
}): {
  totalPortions: number;
  reservedPortions: number;
  availablePortions: number;
  remainingYield: number;
} {
  const { actualUsableYield, portionSize, alreadyReservedPortions } = params;
  const totalPortions = calculateMaxPortions(actualUsableYield, portionSize);
  const availablePortions = Math.max(0, totalPortions - alreadyReservedPortions);
  const remainingYield = Math.max(0, actualUsableYield - alreadyReservedPortions * portionSize);

  return {
    totalPortions,
    reservedPortions: alreadyReservedPortions,
    availablePortions,
    remainingYield
  };
}
