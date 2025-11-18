import { StaffMember } from './StaffMember';
import { StaffSlot } from './StaffSlot';

/**
 * Represents an assignment of a staff member to a staff slot.
 * This is the output of the scheduling algorithm.
 */
export interface StaffAssignment {
  /**
   * Unique identifier for this assignment.
   */
  id: string;

  /**
   * The staff member assigned to this slot.
   * Can be either the full StaffMember object or just the name/ID.
   */
  staffMember: StaffMember | string;

  /**
   * The staff slot being filled.
   * Can be either the full StaffSlot object or just the name/ID.
   */
  staffSlot: StaffSlot | string;

  /**
   * The start time of this assignment.
   * May differ from the slot's start time in some cases.
   */
  startTime: Date;

  /**
   * The end time of this assignment.
   * May differ from the slot's end time in some cases.
   */
  endTime: Date;

  /**
   * Optional metadata about the assignment.
   */
  metadata?: {
    assignedAt?: Date;
    assignedBy?: string;
    notes?: string;
    preferenceScore?: number;
    [key: string]: unknown;
  };
}

/**
 * Validation error for StaffAssignment.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Type guard to check if an object is a valid StaffAssignment.
 */
export function isStaffAssignment(obj: unknown): obj is StaffAssignment {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const assignment = obj as Record<string, unknown>;

  return (
    typeof assignment.id === 'string' &&
    (typeof assignment.staffMember === 'string' ||
      typeof assignment.staffMember === 'object') &&
    (typeof assignment.staffSlot === 'string' || typeof assignment.staffSlot === 'object') &&
    assignment.startTime instanceof Date &&
    assignment.endTime instanceof Date
  );
}

/**
 * Validates a StaffAssignment object and returns validation errors if any.
 */
export function validateStaffAssignment(assignment: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof assignment !== 'object' || assignment === null) {
    errors.push({ field: 'root', message: 'StaffAssignment must be an object' });
    return errors;
  }

  const a = assignment as Record<string, unknown>;

  // Validate id
  if (typeof a.id !== 'string') {
    errors.push({ field: 'id', message: 'id must be a string' });
  } else if (a.id.trim().length === 0) {
    errors.push({ field: 'id', message: 'id cannot be empty' });
  }

  // Validate staffMember
  if (
    typeof a.staffMember !== 'string' &&
    (typeof a.staffMember !== 'object' || a.staffMember === null)
  ) {
    errors.push({
      field: 'staffMember',
      message: 'staffMember must be a string or StaffMember object',
    });
  }

  // Validate staffSlot
  if (
    typeof a.staffSlot !== 'string' &&
    (typeof a.staffSlot !== 'object' || a.staffSlot === null)
  ) {
    errors.push({
      field: 'staffSlot',
      message: 'staffSlot must be a string or StaffSlot object',
    });
  }

  // Validate startTime
  if (!(a.startTime instanceof Date)) {
    errors.push({ field: 'startTime', message: 'startTime must be a Date object' });
  } else if (isNaN(a.startTime.getTime())) {
    errors.push({ field: 'startTime', message: 'startTime must be a valid Date' });
  }

  // Validate endTime
  if (!(a.endTime instanceof Date)) {
    errors.push({ field: 'endTime', message: 'endTime must be a Date object' });
  } else if (isNaN(a.endTime.getTime())) {
    errors.push({ field: 'endTime', message: 'endTime must be a valid Date' });
  }

  // Validate time range
  if (
    a.startTime instanceof Date &&
    a.endTime instanceof Date &&
    !isNaN(a.startTime.getTime()) &&
    !isNaN(a.endTime.getTime())
  ) {
    if (a.endTime.getTime() <= a.startTime.getTime()) {
      errors.push({
        field: 'endTime',
        message: 'endTime must be after startTime',
      });
    }
  }

  return errors;
}

/**
 * Helper function to create a StaffAssignment with validation.
 * Throws an error if the input is invalid.
 */
export function createStaffAssignment(data: {
  id: string;
  staffMember: StaffMember | string;
  staffSlot: StaffSlot | string;
  startTime: Date;
  endTime: Date;
  metadata?: StaffAssignment['metadata'];
}): StaffAssignment {
  const errors = validateStaffAssignment(data);

  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
    throw new Error(`Invalid StaffAssignment: ${errorMessages}`);
  }

  return {
    id: data.id,
    staffMember: data.staffMember,
    staffSlot: data.staffSlot,
    startTime: data.startTime,
    endTime: data.endTime,
    metadata: data.metadata ? { ...data.metadata } : undefined,
  };
}

/**
 * Gets the staff member name from an assignment.
 */
export function getStaffMemberName(assignment: StaffAssignment): string {
  if (typeof assignment.staffMember === 'string') {
    return assignment.staffMember;
  }
  return assignment.staffMember.name;
}

/**
 * Gets the staff slot name from an assignment.
 */
export function getStaffSlotName(assignment: StaffAssignment): string {
  if (typeof assignment.staffSlot === 'string') {
    return assignment.staffSlot;
  }
  return assignment.staffSlot.name;
}

/**
 * Calculates the duration of an assignment in hours.
 */
export function getAssignmentDuration(assignment: StaffAssignment): number {
  const milliseconds = assignment.endTime.getTime() - assignment.startTime.getTime();
  return milliseconds / (1000 * 60 * 60); // Convert to hours
}

/**
 * Checks if two assignments overlap in time.
 */
export function doAssignmentsOverlap(
  assignment1: StaffAssignment,
  assignment2: StaffAssignment
): boolean {
  return (
    assignment1.startTime < assignment2.endTime &&
    assignment2.startTime < assignment1.endTime
  );
}

/**
 * Checks if an assignment falls within a time window.
 */
export function isAssignmentInTimeWindow(
  assignment: StaffAssignment,
  windowStart: Date,
  windowEnd: Date
): boolean {
  return assignment.startTime >= windowStart && assignment.endTime <= windowEnd;
}

/**
 * Groups assignments by staff member.
 */
export function groupAssignmentsByStaff(
  assignments: StaffAssignment[]
): Map<string, StaffAssignment[]> {
  const grouped = new Map<string, StaffAssignment[]>();

  assignments.forEach((assignment) => {
    const staffName = getStaffMemberName(assignment);
    const existing = grouped.get(staffName) || [];
    existing.push(assignment);
    grouped.set(staffName, existing);
  });

  return grouped;
}

/**
 * Groups assignments by date.
 */
export function groupAssignmentsByDate(
  assignments: StaffAssignment[]
): Map<string, StaffAssignment[]> {
  const grouped = new Map<string, StaffAssignment[]>();

  assignments.forEach((assignment) => {
    const dateKey = assignment.startTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = grouped.get(dateKey) || [];
    existing.push(assignment);
    grouped.set(dateKey, existing);
  });

  return grouped;
}

/**
 * Sorts assignments by start time (ascending).
 */
export function sortAssignmentsByStartTime(
  assignments: StaffAssignment[]
): StaffAssignment[] {
  return [...assignments].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Finds assignments for a specific staff member.
 */
export function findAssignmentsForStaff(
  assignments: StaffAssignment[],
  staffNameOrMember: string | StaffMember
): StaffAssignment[] {
  const staffName =
    typeof staffNameOrMember === 'string' ? staffNameOrMember : staffNameOrMember.name;

  return assignments.filter((assignment) => {
    const assignmentStaffName = getStaffMemberName(assignment);
    return assignmentStaffName === staffName;
  });
}

/**
 * Finds overlapping assignments for a staff member.
 * These represent scheduling conflicts.
 */
export function findOverlappingAssignments(
  assignments: StaffAssignment[]
): Array<{ assignment1: StaffAssignment; assignment2: StaffAssignment }> {
  const overlaps: Array<{ assignment1: StaffAssignment; assignment2: StaffAssignment }> = [];

  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      if (doAssignmentsOverlap(assignments[i], assignments[j])) {
        overlaps.push({
          assignment1: assignments[i],
          assignment2: assignments[j],
        });
      }
    }
  }

  return overlaps;
}

/**
 * Calculates total hours worked by a staff member.
 */
export function calculateStaffHours(
  assignments: StaffAssignment[],
  staffNameOrMember: string | StaffMember
): number {
  const staffAssignments = findAssignmentsForStaff(assignments, staffNameOrMember);
  return staffAssignments.reduce(
    (total, assignment) => total + getAssignmentDuration(assignment),
    0
  );
}

/**
 * Gets assignments within a specific date range.
 */
export function getAssignmentsInDateRange(
  assignments: StaffAssignment[],
  rangeStart: Date,
  rangeEnd: Date
): StaffAssignment[] {
  return assignments.filter(
    (assignment) =>
      assignment.startTime < rangeEnd && assignment.endTime > rangeStart
  );
}

/**
 * Checks if a staff member is available at a specific time.
 * Returns false if they have an assignment that overlaps with the given time.
 */
export function isStaffAvailableAt(
  assignments: StaffAssignment[],
  staffNameOrMember: string | StaffMember,
  checkStart: Date,
  checkEnd: Date
): boolean {
  const staffAssignments = findAssignmentsForStaff(assignments, staffNameOrMember);

  return !staffAssignments.some(
    (assignment) =>
      assignment.startTime < checkEnd && assignment.endTime > checkStart
  );
}

/**
 * Statistics about assignments.
 */
export interface AssignmentStats {
  totalAssignments: number;
  totalHours: number;
  uniqueStaffCount: number;
  averageHoursPerAssignment: number;
  earliestAssignment: Date | null;
  latestAssignment: Date | null;
  hoursByStaff: Map<string, number>;
  assignmentsByStaff: Map<string, number>;
}

/**
 * Calculates statistics about a set of assignments.
 */
export function getAssignmentStats(assignments: StaffAssignment[]): AssignmentStats {
  if (assignments.length === 0) {
    return {
      totalAssignments: 0,
      totalHours: 0,
      uniqueStaffCount: 0,
      averageHoursPerAssignment: 0,
      earliestAssignment: null,
      latestAssignment: null,
      hoursByStaff: new Map(),
      assignmentsByStaff: new Map(),
    };
  }

  let totalHours = 0;
  const hoursByStaff = new Map<string, number>();
  const assignmentsByStaff = new Map<string, number>();

  assignments.forEach((assignment) => {
    const hours = getAssignmentDuration(assignment);
    totalHours += hours;

    const staffName = getStaffMemberName(assignment);
    hoursByStaff.set(staffName, (hoursByStaff.get(staffName) || 0) + hours);
    assignmentsByStaff.set(staffName, (assignmentsByStaff.get(staffName) || 0) + 1);
  });

  const startTimes = assignments.map((a) => a.startTime.getTime());
  const endTimes = assignments.map((a) => a.endTime.getTime());

  return {
    totalAssignments: assignments.length,
    totalHours,
    uniqueStaffCount: hoursByStaff.size,
    averageHoursPerAssignment: totalHours / assignments.length,
    earliestAssignment: new Date(Math.min(...startTimes)),
    latestAssignment: new Date(Math.max(...endTimes)),
    hoursByStaff,
    assignmentsByStaff,
  };
}

/**
 * Creates a summary string for a set of assignments.
 */
export function getAssignmentsSummary(assignments: StaffAssignment[]): string {
  const stats = getAssignmentStats(assignments);

  const lines = [
    `Total Assignments: ${stats.totalAssignments}`,
    `Total Hours: ${stats.totalHours.toFixed(1)}`,
    `Unique Staff: ${stats.uniqueStaffCount}`,
    `Average Hours per Assignment: ${stats.averageHoursPerAssignment.toFixed(1)}`,
  ];

  if (stats.earliestAssignment && stats.latestAssignment) {
    lines.push(
      `Period: ${stats.earliestAssignment.toLocaleString()} - ${stats.latestAssignment.toLocaleString()}`
    );
  }

  lines.push('\nHours by Staff:');
  Array.from(stats.hoursByStaff.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([staff, hours]) => {
      lines.push(`  ${staff}: ${hours.toFixed(1)} hours`);
    });

  return lines.join('\n');
}
