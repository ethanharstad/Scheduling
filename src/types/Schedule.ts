import { StaffAssignment, getAssignmentStats, AssignmentStats } from './StaffAssignment';
import { ScheduleRequirement } from './ScheduleRequirement';
import { StaffSlot } from './StaffSlot';

/**
 * Represents a complete schedule with all assignments.
 * This is the primary output of the scheduling algorithm.
 */
export interface Schedule {
  /**
   * Unique identifier for this schedule.
   */
  id: string;

  /**
   * Optional name or description for this schedule.
   */
  name?: string;

  /**
   * The start of the schedule period.
   */
  scheduleStart: Date;

  /**
   * The end of the schedule period.
   */
  scheduleEnd: Date;

  /**
   * All staff assignments in this schedule.
   */
  assignments: StaffAssignment[];

  /**
   * Slots that could not be filled.
   */
  unfilledSlots: UnfilledSlot[];

  /**
   * Optional reference to the requirements that generated this schedule.
   */
  sourceRequirement?: ScheduleRequirement | string;

  /**
   * Optional metadata about the schedule.
   */
  metadata?: {
    generatedAt?: Date;
    generatedBy?: string;
    algorithm?: string;
    notes?: string;
    [key: string]: unknown;
  };
}

/**
 * Represents a slot that could not be filled.
 */
export interface UnfilledSlot {
  /**
   * The slot that could not be filled.
   */
  slot: StaffSlot | string;

  /**
   * Reason why the slot could not be filled.
   */
  reason: string;

  /**
   * Whether the slot was partially filled.
   * For slots requiring multiple staff, some may be assigned.
   */
  partiallyFilled?: boolean;

  /**
   * Number of staff assigned vs needed (if applicable).
   */
  fillStatus?: {
    needed: number;
    assigned: number;
  };
}

/**
 * Validation error for Schedule.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Type guard to check if an object is a valid Schedule.
 */
export function isSchedule(obj: unknown): obj is Schedule {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const schedule = obj as Record<string, unknown>;

  return (
    typeof schedule.id === 'string' &&
    schedule.scheduleStart instanceof Date &&
    schedule.scheduleEnd instanceof Date &&
    Array.isArray(schedule.assignments) &&
    Array.isArray(schedule.unfilledSlots)
  );
}

/**
 * Validates a Schedule object and returns validation errors if any.
 */
export function validateSchedule(schedule: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof schedule !== 'object' || schedule === null) {
    errors.push({ field: 'root', message: 'Schedule must be an object' });
    return errors;
  }

  const s = schedule as Record<string, unknown>;

  // Validate id
  if (typeof s.id !== 'string') {
    errors.push({ field: 'id', message: 'id must be a string' });
  } else if (s.id.trim().length === 0) {
    errors.push({ field: 'id', message: 'id cannot be empty' });
  }

  // Validate optional name
  if (s.name !== undefined && typeof s.name !== 'string') {
    errors.push({ field: 'name', message: 'name must be a string if provided' });
  }

  // Validate scheduleStart
  if (!(s.scheduleStart instanceof Date)) {
    errors.push({ field: 'scheduleStart', message: 'scheduleStart must be a Date object' });
  } else if (isNaN(s.scheduleStart.getTime())) {
    errors.push({ field: 'scheduleStart', message: 'scheduleStart must be a valid Date' });
  }

  // Validate scheduleEnd
  if (!(s.scheduleEnd instanceof Date)) {
    errors.push({ field: 'scheduleEnd', message: 'scheduleEnd must be a Date object' });
  } else if (isNaN(s.scheduleEnd.getTime())) {
    errors.push({ field: 'scheduleEnd', message: 'scheduleEnd must be a valid Date' });
  }

  // Validate time range
  if (
    s.scheduleStart instanceof Date &&
    s.scheduleEnd instanceof Date &&
    !isNaN(s.scheduleStart.getTime()) &&
    !isNaN(s.scheduleEnd.getTime())
  ) {
    if (s.scheduleEnd.getTime() <= s.scheduleStart.getTime()) {
      errors.push({
        field: 'scheduleEnd',
        message: 'scheduleEnd must be after scheduleStart',
      });
    }
  }

  // Validate assignments
  if (!Array.isArray(s.assignments)) {
    errors.push({ field: 'assignments', message: 'assignments must be an array' });
  }

  // Validate unfilledSlots
  if (!Array.isArray(s.unfilledSlots)) {
    errors.push({ field: 'unfilledSlots', message: 'unfilledSlots must be an array' });
  }

  return errors;
}

/**
 * Helper function to create a Schedule with validation.
 * Throws an error if the input is invalid.
 */
export function createSchedule(data: {
  id: string;
  name?: string;
  scheduleStart: Date;
  scheduleEnd: Date;
  assignments: StaffAssignment[];
  unfilledSlots?: UnfilledSlot[];
  sourceRequirement?: ScheduleRequirement | string;
  metadata?: Schedule['metadata'];
}): Schedule {
  const errors = validateSchedule({
    ...data,
    unfilledSlots: data.unfilledSlots || [],
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
    throw new Error(`Invalid Schedule: ${errorMessages}`);
  }

  return {
    id: data.id,
    name: data.name,
    scheduleStart: data.scheduleStart,
    scheduleEnd: data.scheduleEnd,
    assignments: data.assignments.map((a) => ({ ...a })),
    unfilledSlots: (data.unfilledSlots || []).map((u) => ({ ...u })),
    sourceRequirement: data.sourceRequirement,
    metadata: data.metadata ? { ...data.metadata } : undefined,
  };
}

/**
 * Gets the total number of assignments in the schedule.
 */
export function getTotalAssignments(schedule: Schedule): number {
  return schedule.assignments.length;
}

/**
 * Gets the total number of unfilled slots.
 */
export function getTotalUnfilledSlots(schedule: Schedule): number {
  return schedule.unfilledSlots.length;
}

/**
 * Calculates the fill rate (percentage of slots filled).
 */
export function getScheduleFillRate(schedule: Schedule): number {
  const total = schedule.assignments.length + schedule.unfilledSlots.length;
  if (total === 0) return 0;
  return (schedule.assignments.length / total) * 100;
}

/**
 * Gets assignment statistics for the schedule.
 */
export function getScheduleAssignmentStats(schedule: Schedule): AssignmentStats {
  return getAssignmentStats(schedule.assignments);
}

/**
 * Finds scheduling conflicts (overlapping assignments for same staff).
 */
export function findScheduleConflicts(schedule: Schedule): Array<{
  staffName: string;
  assignment1: StaffAssignment;
  assignment2: StaffAssignment;
}> {
  const conflicts: Array<{
    staffName: string;
    assignment1: StaffAssignment;
    assignment2: StaffAssignment;
  }> = [];

  const assignmentsByStaff = new Map<string, StaffAssignment[]>();

  // Group by staff
  schedule.assignments.forEach((assignment) => {
    const staffName =
      typeof assignment.staffMember === 'string'
        ? assignment.staffMember
        : assignment.staffMember.name;
    const existing = assignmentsByStaff.get(staffName) || [];
    existing.push(assignment);
    assignmentsByStaff.set(staffName, existing);
  });

  // Check for overlaps within each staff member's assignments
  assignmentsByStaff.forEach((assignments, staffName) => {
    for (let i = 0; i < assignments.length; i++) {
      for (let j = i + 1; j < assignments.length; j++) {
        const a1 = assignments[i];
        const a2 = assignments[j];
        if (a1.startTime < a2.endTime && a2.startTime < a1.endTime) {
          conflicts.push({
            staffName,
            assignment1: a1,
            assignment2: a2,
          });
        }
      }
    }
  });

  return conflicts;
}

/**
 * Validates that the schedule has no conflicts.
 */
export function isScheduleValid(schedule: Schedule): {
  valid: boolean;
  conflicts: ReturnType<typeof findScheduleConflicts>;
} {
  const conflicts = findScheduleConflicts(schedule);
  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Statistics about a schedule.
 */
export interface ScheduleStats extends AssignmentStats {
  unfilledSlots: number;
  fillRate: number;
  hasConflicts: boolean;
  conflictCount: number;
}

/**
 * Gets comprehensive statistics about the schedule.
 */
export function getScheduleStats(schedule: Schedule): ScheduleStats {
  const assignmentStats = getScheduleAssignmentStats(schedule);
  const conflicts = findScheduleConflicts(schedule);

  return {
    ...assignmentStats,
    unfilledSlots: schedule.unfilledSlots.length,
    fillRate: getScheduleFillRate(schedule),
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length,
  };
}

/**
 * Creates a summary string for the schedule.
 */
export function getScheduleSummary(schedule: Schedule): string {
  const stats = getScheduleStats(schedule);
  const name = schedule.name || schedule.id;

  const lines = [
    `Schedule: ${name}`,
    `Period: ${schedule.scheduleStart.toLocaleDateString()} - ${schedule.scheduleEnd.toLocaleDateString()}`,
    ``,
    `Assignments: ${stats.totalAssignments}`,
    `Unfilled Slots: ${stats.unfilledSlots}`,
    `Fill Rate: ${stats.fillRate.toFixed(1)}%`,
    ``,
    `Total Hours: ${stats.totalHours.toFixed(1)}`,
    `Unique Staff: ${stats.uniqueStaffCount}`,
    `Average Hours per Assignment: ${stats.averageHoursPerAssignment.toFixed(1)}`,
  ];

  if (stats.hasConflicts) {
    lines.push('');
    lines.push(`⚠️ CONFLICTS DETECTED: ${stats.conflictCount}`);
  }

  if (schedule.metadata?.algorithm) {
    lines.push('');
    lines.push(`Algorithm: ${schedule.metadata.algorithm}`);
  }

  if (schedule.metadata?.generatedAt) {
    lines.push(
      `Generated: ${new Date(schedule.metadata.generatedAt).toLocaleString()}`
    );
  }

  return lines.join('\n');
}

/**
 * Gets all staff members assigned in the schedule.
 */
export function getAssignedStaff(schedule: Schedule): string[] {
  const staffSet = new Set<string>();

  schedule.assignments.forEach((assignment) => {
    const staffName =
      typeof assignment.staffMember === 'string'
        ? assignment.staffMember
        : assignment.staffMember.name;
    staffSet.add(staffName);
  });

  return Array.from(staffSet).sort();
}

/**
 * Gets hours worked by each staff member.
 */
export function getHoursByStaff(schedule: Schedule): Map<string, number> {
  return getScheduleAssignmentStats(schedule).hoursByStaff;
}

/**
 * Finds staff members who are over or under a target number of hours.
 */
export function findStaffByHourTarget(
  schedule: Schedule,
  targetHours: number,
  tolerance: number = 0
): {
  underUtilized: Array<{ staff: string; hours: number; difference: number }>;
  overUtilized: Array<{ staff: string; hours: number; difference: number }>;
  onTarget: Array<{ staff: string; hours: number }>;
} {
  const hoursByStaff = getHoursByStaff(schedule);

  const underUtilized: Array<{ staff: string; hours: number; difference: number }> = [];
  const overUtilized: Array<{ staff: string; hours: number; difference: number }> = [];
  const onTarget: Array<{ staff: string; hours: number }> = [];

  hoursByStaff.forEach((hours, staff) => {
    const difference = hours - targetHours;

    if (difference < -tolerance) {
      underUtilized.push({ staff, hours, difference: Math.abs(difference) });
    } else if (difference > tolerance) {
      overUtilized.push({ staff, hours, difference });
    } else {
      onTarget.push({ staff, hours });
    }
  });

  return {
    underUtilized: underUtilized.sort((a, b) => b.difference - a.difference),
    overUtilized: overUtilized.sort((a, b) => b.difference - a.difference),
    onTarget: onTarget.sort((a, b) => a.staff.localeCompare(b.staff)),
  };
}
