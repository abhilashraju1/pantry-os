/**
 * Capacity-aware back-scheduling for scheduled pickups
 */

export function calculateKitchenFireTime(params: {
  requestedPickupTime: Date;
  cookDurationMinutes: number;
  packingDurationMinutes: number;
  bufferMinutes?: number;
}): {
  targetFireTime: Date;
  targetPackingTime: Date;
  targetReadyTime: Date;
  isFeasible: boolean;
} {
  const {
    requestedPickupTime,
    cookDurationMinutes,
    packingDurationMinutes,
    bufferMinutes = 5
  } = params;

  const totalLeadMinutes = cookDurationMinutes + packingDurationMinutes + bufferMinutes;
  const targetReadyTime = new Date(requestedPickupTime.getTime() - bufferMinutes * 60 * 1000);
  const targetPackingTime = new Date(targetReadyTime.getTime() - packingDurationMinutes * 60 * 1000);
  const targetFireTime = new Date(targetPackingTime.getTime() - cookDurationMinutes * 60 * 1000);

  const now = new Date();
  const isFeasible = targetFireTime >= now;

  return {
    targetFireTime,
    targetPackingTime,
    targetReadyTime,
    isFeasible
  };
}
