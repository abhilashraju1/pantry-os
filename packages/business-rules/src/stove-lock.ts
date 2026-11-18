/**
 * Exclusive stove/equipment assignment validation
 */

export interface ActiveTaskLock {
  taskId: string;
  equipmentId: string;
  startedAt: Date;
  lockedUntil: Date;
}

export function validateEquipmentLock(
  requestedEquipmentId: string,
  existingLocks: ActiveTaskLock[],
  now: Date = new Date()
): { canAcquire: boolean; conflictingTask?: ActiveTaskLock } {
  const activeLock = existingLocks.find(
    (lock) => lock.equipmentId === requestedEquipmentId && lock.lockedUntil > now
  );

  if (activeLock) {
    return {
      canAcquire: false,
      conflictingTask: activeLock
    };
  }

  return { canAcquire: true };
}
