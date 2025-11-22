import { canNurseTakeBooking, incrementBookingCount } from '@/lib/subscription';

export async function validateNurseBooking(nurseId: string) {
  const validation = await canNurseTakeBooking(nurseId);
  
  if (!validation.canTakeBooking) {
    return {
      allowed: false,
      error: validation.reason,
      needsUpgrade: validation.needsUpgrade,
      suggestedPlan: validation.suggestedPlan,
    };
  }

  return { allowed: true };
}

export async function recordBookingAccepted(nurseId: string) {
  await incrementBookingCount(nurseId);
}
