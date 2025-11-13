/**
 * Represents a single staff slot that needs to be filled in a schedule.
 */
export interface StaffSlot {
  /**
   * The name or identifier of the staff slot.
   * Examples: "Morning Shift Nurse", "ER Attending", "Night Security"
   */
  name: string;

  /**
   * The start timestamp for this staff slot.
   */
  startTime: Date;

  /**
   * The end timestamp for this staff slot.
   */
  endTime: Date;

  /**
   * List of qualifications required to fill this slot.
   * Staff member must have all listed qualifications.
   */
  requiredQualifications: string[];
}

/**
 * Validation error for StaffSlot.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Type guard to check if an object is a valid StaffSlot.
 */
export function isStaffSlot(obj: unknown): obj is StaffSlot {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const slot = obj as Record<string, unknown>;

  return (
    typeof slot.name === 'string' &&
    slot.startTime instanceof Date &&
    slot.endTime instanceof Date &&
    Array.isArray(slot.requiredQualifications) &&
    slot.requiredQualifications.every((q) => typeof q === 'string')
  );
}

/**
 * Validates a StaffSlot object and returns validation errors if any.
 */
export function validateStaffSlot(slot: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof slot !== 'object' || slot === null) {
    errors.push({ field: 'root', message: 'StaffSlot must be an object' });
    return errors;
  }

  const s = slot as Record<string, unknown>;

  // Validate name
  if (typeof s.name !== 'string') {
    errors.push({ field: 'name', message: 'name must be a string' });
  } else if (s.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'name cannot be empty' });
  }

  // Validate startTime
  if (!(s.startTime instanceof Date)) {
    errors.push({ field: 'startTime', message: 'startTime must be a Date object' });
  } else if (isNaN(s.startTime.getTime())) {
    errors.push({ field: 'startTime', message: 'startTime must be a valid Date' });
  }

  // Validate endTime
  if (!(s.endTime instanceof Date)) {
    errors.push({ field: 'endTime', message: 'endTime must be a Date object' });
  } else if (isNaN(s.endTime.getTime())) {
    errors.push({ field: 'endTime', message: 'endTime must be a valid Date' });
  }

  // Validate time range (endTime must be after startTime)
  if (
    s.startTime instanceof Date &&
    s.endTime instanceof Date &&
    !isNaN(s.startTime.getTime()) &&
    !isNaN(s.endTime.getTime())
  ) {
    if (s.endTime.getTime() <= s.startTime.getTime()) {
      errors.push({
        field: 'endTime',
        message: 'endTime must be after startTime',
      });
    }
  }

  // Validate requiredQualifications
  if (!Array.isArray(s.requiredQualifications)) {
    errors.push({
      field: 'requiredQualifications',
      message: 'requiredQualifications must be an array',
    });
  } else {
    s.requiredQualifications.forEach((q, index) => {
      if (typeof q !== 'string') {
        errors.push({
          field: `requiredQualifications[${index}]`,
          message: `qualification at index ${index} must be a string`,
        });
      }
    });
  }

  return errors;
}

/**
 * Helper function to create a StaffSlot with validation.
 * Throws an error if the input is invalid.
 */
export function createStaffSlot(data: {
  name: string;
  startTime: Date;
  endTime: Date;
  requiredQualifications: string[];
}): StaffSlot {
  const errors = validateStaffSlot(data);

  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
    throw new Error(`Invalid StaffSlot: ${errorMessages}`);
  }

  return {
    name: data.name,
    startTime: data.startTime,
    endTime: data.endTime,
    requiredQualifications: [...data.requiredQualifications], // Create a copy
  };
}

/**
 * Calculates the duration of a staff slot in hours.
 */
export function getSlotDuration(slot: StaffSlot): number {
  const milliseconds = slot.endTime.getTime() - slot.startTime.getTime();
  return milliseconds / (1000 * 60 * 60); // Convert to hours
}

/**
 * Checks if a staff slot occurs within a given time window.
 */
export function isSlotInTimeWindow(
  slot: StaffSlot,
  windowStart: Date,
  windowEnd: Date
): boolean {
  return slot.startTime >= windowStart && slot.endTime <= windowEnd;
}

/**
 * Checks if two staff slots overlap in time.
 */
export function doSlotsOverlap(slot1: StaffSlot, slot2: StaffSlot): boolean {
  return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;
}

/**
 * Checks if a staff slot starts on a specific date (ignoring time).
 */
export function isSlotOnDate(slot: StaffSlot, date: Date): boolean {
  const slotDate = new Date(slot.startTime);
  slotDate.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return slotDate.getTime() === checkDate.getTime();
}

/**
 * Groups staff slots by date.
 */
export function groupSlotsByDate(slots: StaffSlot[]): Map<string, StaffSlot[]> {
  const grouped = new Map<string, StaffSlot[]>();

  slots.forEach((slot) => {
    const dateKey = slot.startTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = grouped.get(dateKey) || [];
    existing.push(slot);
    grouped.set(dateKey, existing);
  });

  return grouped;
}

/**
 * Sorts staff slots by start time (ascending).
 */
export function sortSlotsByStartTime(slots: StaffSlot[]): StaffSlot[] {
  return [...slots].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Filters staff slots that require a specific qualification.
 */
export function filterSlotsByQualification(
  slots: StaffSlot[],
  qualification: string
): StaffSlot[] {
  return slots.filter((slot) => slot.requiredQualifications.includes(qualification));
}

/**
 * Checks if a staff slot requires all of the specified qualifications.
 */
export function requiresAllQualifications(
  slot: StaffSlot,
  qualifications: string[]
): boolean {
  return qualifications.every((q) => slot.requiredQualifications.includes(q));
}

/**
 * Checks if a staff slot requires any of the specified qualifications.
 */
export function requiresAnyQualification(
  slot: StaffSlot,
  qualifications: string[]
): boolean {
  return qualifications.some((q) => slot.requiredQualifications.includes(q));
}
