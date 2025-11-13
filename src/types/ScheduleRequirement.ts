import { StaffSlot, validateStaffSlot } from './StaffSlot';

/**
 * Represents the complete set of requirements for a schedule.
 * Contains all staff slots that need to be filled.
 */
export interface ScheduleRequirement {
  /**
   * Unique identifier for this schedule requirement.
   */
  id: string;

  /**
   * Optional name or description for this set of requirements.
   * Examples: "Week of Nov 13-19", "Holiday Coverage", "Winter Schedule"
   */
  name?: string;

  /**
   * The start of the time window for this schedule.
   */
  scheduleStart: Date;

  /**
   * The end of the time window for this schedule.
   */
  scheduleEnd: Date;

  /**
   * List of staff slots that need to be filled.
   */
  staffSlots: StaffSlot[];

  /**
   * Optional metadata about the schedule.
   */
  metadata?: {
    createdAt?: Date;
    createdBy?: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

/**
 * Validation error for ScheduleRequirement.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Type guard to check if an object is a valid ScheduleRequirement.
 */
export function isScheduleRequirement(obj: unknown): obj is ScheduleRequirement {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const req = obj as Record<string, unknown>;

  return (
    typeof req.id === 'string' &&
    req.scheduleStart instanceof Date &&
    req.scheduleEnd instanceof Date &&
    Array.isArray(req.staffSlots)
  );
}

/**
 * Validates a ScheduleRequirement object and returns validation errors if any.
 */
export function validateScheduleRequirement(requirement: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof requirement !== 'object' || requirement === null) {
    errors.push({ field: 'root', message: 'ScheduleRequirement must be an object' });
    return errors;
  }

  const req = requirement as Record<string, unknown>;

  // Validate id
  if (typeof req.id !== 'string') {
    errors.push({ field: 'id', message: 'id must be a string' });
  } else if (req.id.trim().length === 0) {
    errors.push({ field: 'id', message: 'id cannot be empty' });
  }

  // Validate optional name
  if (req.name !== undefined) {
    if (typeof req.name !== 'string') {
      errors.push({ field: 'name', message: 'name must be a string' });
    }
  }

  // Validate scheduleStart
  if (!(req.scheduleStart instanceof Date)) {
    errors.push({ field: 'scheduleStart', message: 'scheduleStart must be a Date object' });
  } else if (isNaN(req.scheduleStart.getTime())) {
    errors.push({ field: 'scheduleStart', message: 'scheduleStart must be a valid Date' });
  }

  // Validate scheduleEnd
  if (!(req.scheduleEnd instanceof Date)) {
    errors.push({ field: 'scheduleEnd', message: 'scheduleEnd must be a Date object' });
  } else if (isNaN(req.scheduleEnd.getTime())) {
    errors.push({ field: 'scheduleEnd', message: 'scheduleEnd must be a valid Date' });
  }

  // Validate time range
  if (
    req.scheduleStart instanceof Date &&
    req.scheduleEnd instanceof Date &&
    !isNaN(req.scheduleStart.getTime()) &&
    !isNaN(req.scheduleEnd.getTime())
  ) {
    if (req.scheduleEnd.getTime() <= req.scheduleStart.getTime()) {
      errors.push({
        field: 'scheduleEnd',
        message: 'scheduleEnd must be after scheduleStart',
      });
    }
  }

  // Validate staffSlots
  if (!Array.isArray(req.staffSlots)) {
    errors.push({ field: 'staffSlots', message: 'staffSlots must be an array' });
  } else {
    req.staffSlots.forEach((slot, index) => {
      const slotErrors = validateStaffSlot(slot);
      slotErrors.forEach((error) => {
        errors.push({
          field: `staffSlots[${index}].${error.field}`,
          message: error.message,
        });
      });
    });
  }

  return errors;
}

/**
 * Helper function to create a ScheduleRequirement with validation.
 * Throws an error if the input is invalid.
 */
export function createScheduleRequirement(data: {
  id: string;
  name?: string;
  scheduleStart: Date;
  scheduleEnd: Date;
  staffSlots: StaffSlot[];
  metadata?: ScheduleRequirement['metadata'];
}): ScheduleRequirement {
  const errors = validateScheduleRequirement(data);

  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
    throw new Error(`Invalid ScheduleRequirement: ${errorMessages}`);
  }

  return {
    id: data.id,
    name: data.name,
    scheduleStart: data.scheduleStart,
    scheduleEnd: data.scheduleEnd,
    staffSlots: data.staffSlots.map((slot) => ({ ...slot })), // Deep copy
    metadata: data.metadata ? { ...data.metadata } : undefined,
  };
}

/**
 * Gets the total number of staff slots in the requirement.
 */
export function getTotalSlotCount(requirement: ScheduleRequirement): number {
  return requirement.staffSlots.length;
}

/**
 * Calculates the total hours across all staff slots.
 */
export function getTotalRequiredHours(requirement: ScheduleRequirement): number {
  return requirement.staffSlots.reduce((total, slot) => {
    const duration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60 * 60);
    return total + duration;
  }, 0);
}

/**
 * Gets all unique qualifications required across all slots.
 */
export function getAllRequiredQualifications(requirement: ScheduleRequirement): string[] {
  const qualificationsSet = new Set<string>();

  requirement.staffSlots.forEach((slot) => {
    slot.requiredQualifications.forEach((q) => qualificationsSet.add(q));
  });

  return Array.from(qualificationsSet).sort();
}

/**
 * Counts how many slots require a specific qualification.
 */
export function countSlotsRequiringQualification(
  requirement: ScheduleRequirement,
  qualification: string
): number {
  return requirement.staffSlots.filter((slot) =>
    slot.requiredQualifications.includes(qualification)
  ).length;
}

/**
 * Gets slots that fall within a specific date range.
 */
export function getSlotsByDateRange(
  requirement: ScheduleRequirement,
  rangeStart: Date,
  rangeEnd: Date
): StaffSlot[] {
  return requirement.staffSlots.filter(
    (slot) => slot.startTime >= rangeStart && slot.endTime <= rangeEnd
  );
}

/**
 * Groups slots by the qualifications they require.
 */
export function groupSlotsByQualifications(
  requirement: ScheduleRequirement
): Map<string, StaffSlot[]> {
  const grouped = new Map<string, StaffSlot[]>();

  requirement.staffSlots.forEach((slot) => {
    const key = slot.requiredQualifications.sort().join(',');
    const existing = grouped.get(key) || [];
    existing.push(slot);
    grouped.set(key, existing);
  });

  return grouped;
}

/**
 * Checks if all slots in the requirement fall within the schedule window.
 */
export function areAllSlotsInScheduleWindow(requirement: ScheduleRequirement): boolean {
  return requirement.staffSlots.every(
    (slot) =>
      slot.startTime >= requirement.scheduleStart &&
      slot.endTime <= requirement.scheduleEnd
  );
}

/**
 * Finds slots that fall outside the schedule window.
 */
export function findSlotsOutsideWindow(requirement: ScheduleRequirement): StaffSlot[] {
  return requirement.staffSlots.filter(
    (slot) =>
      slot.startTime < requirement.scheduleStart ||
      slot.endTime > requirement.scheduleEnd
  );
}

/**
 * Gets statistics about the schedule requirement.
 */
export interface ScheduleRequirementStats {
  totalSlots: number;
  totalHours: number;
  uniqueQualifications: number;
  qualificationsList: string[];
  earliestSlot: Date | null;
  latestSlot: Date | null;
  averageSlotDuration: number;
  slotsOutsideWindow: number;
}

export function getScheduleStats(
  requirement: ScheduleRequirement
): ScheduleRequirementStats {
  const slots = requirement.staffSlots;

  if (slots.length === 0) {
    return {
      totalSlots: 0,
      totalHours: 0,
      uniqueQualifications: 0,
      qualificationsList: [],
      earliestSlot: null,
      latestSlot: null,
      averageSlotDuration: 0,
      slotsOutsideWindow: 0,
    };
  }

  const totalHours = getTotalRequiredHours(requirement);
  const qualificationsList = getAllRequiredQualifications(requirement);
  const outsideWindow = findSlotsOutsideWindow(requirement);

  const startTimes = slots.map((s) => s.startTime.getTime());
  const endTimes = slots.map((s) => s.endTime.getTime());

  return {
    totalSlots: slots.length,
    totalHours,
    uniqueQualifications: qualificationsList.length,
    qualificationsList,
    earliestSlot: new Date(Math.min(...startTimes)),
    latestSlot: new Date(Math.max(...endTimes)),
    averageSlotDuration: totalHours / slots.length,
    slotsOutsideWindow: outsideWindow.length,
  };
}

/**
 * Creates a summary string for the schedule requirement.
 */
export function getRequirementSummary(requirement: ScheduleRequirement): string {
  const stats = getScheduleStats(requirement);
  const name = requirement.name || requirement.id;

  return `Schedule: ${name}
Period: ${requirement.scheduleStart.toLocaleDateString()} - ${requirement.scheduleEnd.toLocaleDateString()}
Total Slots: ${stats.totalSlots}
Total Hours: ${stats.totalHours.toFixed(1)}
Unique Qualifications: ${stats.uniqueQualifications}
Required Qualifications: ${stats.qualificationsList.join(', ')}`;
}
