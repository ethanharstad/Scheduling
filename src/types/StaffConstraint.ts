/**
 * Represents a scheduling constraint for a staff member.
 * Constraints define time periods with associated preference levels.
 */

/**
 * Preference level for a time period.
 * - unavailable: Staff member cannot work during this time
 * - not_preferred: Staff member can work but prefers not to
 * - neutral: No preference either way
 * - preferred: Staff member prefers to work during this time
 */
export type PreferenceLevel = 'unavailable' | 'not_preferred' | 'neutral' | 'preferred';

/**
 * Represents a scheduling constraint for a staff member.
 */
export interface StaffConstraint {
  /**
   * The start timestamp for this constraint.
   */
  startTime: Date;

  /**
   * The end timestamp for this constraint.
   */
  endTime: Date;

  /**
   * The preference level for this time period.
   */
  preference: PreferenceLevel;

  /**
   * Optional reason or note for this constraint.
   * Examples: "School pickup", "Medical appointment", "Prefers mornings"
   */
  reason?: string;
}

/**
 * Validation error for StaffConstraint.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Type guard to check if a string is a valid PreferenceLevel.
 */
export function isPreferenceLevel(value: unknown): value is PreferenceLevel {
  return (
    typeof value === 'string' &&
    ['unavailable', 'not_preferred', 'neutral', 'preferred'].includes(value)
  );
}

/**
 * Type guard to check if an object is a valid StaffConstraint.
 */
export function isStaffConstraint(obj: unknown): obj is StaffConstraint {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const constraint = obj as Record<string, unknown>;

  return (
    constraint.startTime instanceof Date &&
    constraint.endTime instanceof Date &&
    isPreferenceLevel(constraint.preference) &&
    (constraint.reason === undefined || typeof constraint.reason === 'string')
  );
}

/**
 * Validates a StaffConstraint object and returns validation errors if any.
 */
export function validateStaffConstraint(constraint: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof constraint !== 'object' || constraint === null) {
    errors.push({ field: 'root', message: 'StaffConstraint must be an object' });
    return errors;
  }

  const c = constraint as Record<string, unknown>;

  // Validate startTime
  if (!(c.startTime instanceof Date)) {
    errors.push({ field: 'startTime', message: 'startTime must be a Date object' });
  } else if (isNaN(c.startTime.getTime())) {
    errors.push({ field: 'startTime', message: 'startTime must be a valid Date' });
  }

  // Validate endTime
  if (!(c.endTime instanceof Date)) {
    errors.push({ field: 'endTime', message: 'endTime must be a Date object' });
  } else if (isNaN(c.endTime.getTime())) {
    errors.push({ field: 'endTime', message: 'endTime must be a valid Date' });
  }

  // Validate time range
  if (
    c.startTime instanceof Date &&
    c.endTime instanceof Date &&
    !isNaN(c.startTime.getTime()) &&
    !isNaN(c.endTime.getTime())
  ) {
    if (c.endTime.getTime() <= c.startTime.getTime()) {
      errors.push({
        field: 'endTime',
        message: 'endTime must be after startTime',
      });
    }
  }

  // Validate preference
  if (!isPreferenceLevel(c.preference)) {
    errors.push({
      field: 'preference',
      message: "preference must be one of: 'unavailable', 'not_preferred', 'neutral', 'preferred'",
    });
  }

  // Validate optional reason
  if (c.reason !== undefined && typeof c.reason !== 'string') {
    errors.push({ field: 'reason', message: 'reason must be a string if provided' });
  }

  return errors;
}

/**
 * Helper function to create a StaffConstraint with validation.
 * Throws an error if the input is invalid.
 */
export function createStaffConstraint(data: {
  startTime: Date;
  endTime: Date;
  preference: PreferenceLevel;
  reason?: string;
}): StaffConstraint {
  const errors = validateStaffConstraint(data);

  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
    throw new Error(`Invalid StaffConstraint: ${errorMessages}`);
  }

  return {
    startTime: data.startTime,
    endTime: data.endTime,
    preference: data.preference,
    reason: data.reason,
  };
}

/**
 * Calculates the duration of a constraint in hours.
 */
export function getConstraintDuration(constraint: StaffConstraint): number {
  const milliseconds = constraint.endTime.getTime() - constraint.startTime.getTime();
  return milliseconds / (1000 * 60 * 60); // Convert to hours
}

/**
 * Checks if a constraint covers a specific time.
 */
export function isTimeInConstraint(constraint: StaffConstraint, time: Date): boolean {
  return time >= constraint.startTime && time < constraint.endTime;
}

/**
 * Checks if two constraints overlap in time.
 */
export function doConstraintsOverlap(
  constraint1: StaffConstraint,
  constraint2: StaffConstraint
): boolean {
  return (
    constraint1.startTime < constraint2.endTime &&
    constraint2.startTime < constraint1.endTime
  );
}

/**
 * Checks if a constraint completely contains a time slot.
 */
export function doesConstraintContainTimeSlot(
  constraint: StaffConstraint,
  slotStart: Date,
  slotEnd: Date
): boolean {
  return constraint.startTime <= slotStart && constraint.endTime >= slotEnd;
}

/**
 * Checks if a time slot overlaps with a constraint.
 */
export function doesTimeSlotOverlapConstraint(
  slotStart: Date,
  slotEnd: Date,
  constraint: StaffConstraint
): boolean {
  return slotStart < constraint.endTime && constraint.startTime < slotEnd;
}

/**
 * Filters constraints by preference level.
 */
export function filterConstraintsByPreference(
  constraints: StaffConstraint[],
  preference: PreferenceLevel
): StaffConstraint[] {
  return constraints.filter((c) => c.preference === preference);
}

/**
 * Gets all unavailable constraints (blocking constraints).
 */
export function getUnavailableConstraints(
  constraints: StaffConstraint[]
): StaffConstraint[] {
  return filterConstraintsByPreference(constraints, 'unavailable');
}

/**
 * Gets all preferred constraints.
 */
export function getPreferredConstraints(constraints: StaffConstraint[]): StaffConstraint[] {
  return filterConstraintsByPreference(constraints, 'preferred');
}

/**
 * Checks if a time slot conflicts with any unavailable constraints.
 */
export function hasUnavailableConflict(
  slotStart: Date,
  slotEnd: Date,
  constraints: StaffConstraint[]
): boolean {
  const unavailable = getUnavailableConstraints(constraints);
  return unavailable.some((constraint) =>
    doesTimeSlotOverlapConstraint(slotStart, slotEnd, constraint)
  );
}

/**
 * Gets the preference level for a specific time slot based on constraints.
 * If multiple constraints apply, returns the most restrictive preference.
 * Priority: unavailable > not_preferred > neutral > preferred
 */
export function getTimeSlotPreference(
  slotStart: Date,
  slotEnd: Date,
  constraints: StaffConstraint[]
): PreferenceLevel | null {
  const overlappingConstraints = constraints.filter((constraint) =>
    doesTimeSlotOverlapConstraint(slotStart, slotEnd, constraint)
  );

  if (overlappingConstraints.length === 0) {
    return null; // No constraints apply
  }

  // Priority order: unavailable > not_preferred > neutral > preferred
  if (overlappingConstraints.some((c) => c.preference === 'unavailable')) {
    return 'unavailable';
  }
  if (overlappingConstraints.some((c) => c.preference === 'not_preferred')) {
    return 'not_preferred';
  }
  if (overlappingConstraints.some((c) => c.preference === 'neutral')) {
    return 'neutral';
  }
  return 'preferred';
}

/**
 * Calculates a numeric preference score for a time slot.
 * Higher scores are better.
 * - unavailable: -100 (should not be scheduled)
 * - not_preferred: -10
 * - neutral: 0
 * - preferred: 10
 * - no constraint: 0
 */
export function calculatePreferenceScore(
  slotStart: Date,
  slotEnd: Date,
  constraints: StaffConstraint[]
): number {
  const preference = getTimeSlotPreference(slotStart, slotEnd, constraints);

  switch (preference) {
    case 'unavailable':
      return -100;
    case 'not_preferred':
      return -10;
    case 'neutral':
      return 0;
    case 'preferred':
      return 10;
    default:
      return 0; // No constraint
  }
}

/**
 * Sorts constraints by start time (ascending).
 */
export function sortConstraintsByStartTime(
  constraints: StaffConstraint[]
): StaffConstraint[] {
  return [...constraints].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Groups constraints by preference level.
 */
export function groupConstraintsByPreference(
  constraints: StaffConstraint[]
): Map<PreferenceLevel, StaffConstraint[]> {
  const grouped = new Map<PreferenceLevel, StaffConstraint[]>();

  constraints.forEach((constraint) => {
    const existing = grouped.get(constraint.preference) || [];
    existing.push(constraint);
    grouped.set(constraint.preference, existing);
  });

  return grouped;
}

/**
 * Groups constraints by date (ignoring time).
 */
export function groupConstraintsByDate(
  constraints: StaffConstraint[]
): Map<string, StaffConstraint[]> {
  const grouped = new Map<string, StaffConstraint[]>();

  constraints.forEach((constraint) => {
    const dateKey = constraint.startTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = grouped.get(dateKey) || [];
    existing.push(constraint);
    grouped.set(dateKey, existing);
  });

  return grouped;
}

/**
 * Finds constraints within a specific date range.
 */
export function getConstraintsInDateRange(
  constraints: StaffConstraint[],
  rangeStart: Date,
  rangeEnd: Date
): StaffConstraint[] {
  return constraints.filter(
    (constraint) =>
      constraint.startTime < rangeEnd && constraint.endTime > rangeStart
  );
}

/**
 * Statistics about a set of constraints.
 */
export interface ConstraintStats {
  totalConstraints: number;
  totalHours: number;
  unavailableHours: number;
  notPreferredHours: number;
  neutralHours: number;
  preferredHours: number;
  constraintsByPreference: Map<PreferenceLevel, number>;
  earliestConstraint: Date | null;
  latestConstraint: Date | null;
}

/**
 * Calculates statistics about a set of constraints.
 */
export function getConstraintStats(constraints: StaffConstraint[]): ConstraintStats {
  if (constraints.length === 0) {
    return {
      totalConstraints: 0,
      totalHours: 0,
      unavailableHours: 0,
      notPreferredHours: 0,
      neutralHours: 0,
      preferredHours: 0,
      constraintsByPreference: new Map(),
      earliestConstraint: null,
      latestConstraint: null,
    };
  }

  let totalHours = 0;
  let unavailableHours = 0;
  let notPreferredHours = 0;
  let neutralHours = 0;
  let preferredHours = 0;
  const constraintsByPreference = new Map<PreferenceLevel, number>();

  constraints.forEach((constraint) => {
    const hours = getConstraintDuration(constraint);
    totalHours += hours;

    switch (constraint.preference) {
      case 'unavailable':
        unavailableHours += hours;
        break;
      case 'not_preferred':
        notPreferredHours += hours;
        break;
      case 'neutral':
        neutralHours += hours;
        break;
      case 'preferred':
        preferredHours += hours;
        break;
    }

    const count = constraintsByPreference.get(constraint.preference) || 0;
    constraintsByPreference.set(constraint.preference, count + 1);
  });

  const startTimes = constraints.map((c) => c.startTime.getTime());
  const endTimes = constraints.map((c) => c.endTime.getTime());

  return {
    totalConstraints: constraints.length,
    totalHours,
    unavailableHours,
    notPreferredHours,
    neutralHours,
    preferredHours,
    constraintsByPreference,
    earliestConstraint: new Date(Math.min(...startTimes)),
    latestConstraint: new Date(Math.max(...endTimes)),
  };
}

/**
 * Creates a summary string for a set of constraints.
 */
export function getConstraintsSummary(constraints: StaffConstraint[]): string {
  const stats = getConstraintStats(constraints);

  const lines = [
    `Total Constraints: ${stats.totalConstraints}`,
    `Total Hours: ${stats.totalHours.toFixed(1)}`,
    `  Unavailable: ${stats.unavailableHours.toFixed(1)} hours`,
    `  Not Preferred: ${stats.notPreferredHours.toFixed(1)} hours`,
    `  Neutral: ${stats.neutralHours.toFixed(1)} hours`,
    `  Preferred: ${stats.preferredHours.toFixed(1)} hours`,
  ];

  if (stats.earliestConstraint && stats.latestConstraint) {
    lines.push(`Period: ${stats.earliestConstraint.toLocaleString()} - ${stats.latestConstraint.toLocaleString()}`);
  }

  return lines.join('\n');
}
