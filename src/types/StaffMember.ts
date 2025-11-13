import { StaffConstraint } from './StaffConstraint';

/**
 * Represents a staff member in the scheduling system.
 */
export interface StaffMember {
  /**
   * The full name of the staff member.
   */
  name: string;

  /**
   * Numeric rank of the staff member.
   * Higher rank may indicate seniority or authority level.
   */
  rank: number;

  /**
   * The date when the staff member started their service.
   */
  startOfService: Date;

  /**
   * List of qualifications or certifications held by the staff member.
   * Examples: ["RN", "BLS", "ACLS", "Pediatrics"]
   */
  qualifications: string[];

  /**
   * Optional list of scheduling constraints for this staff member.
   * Constraints define time periods with preference levels.
   */
  constraints?: StaffConstraint[];
}

/**
 * Type guard to check if an object is a valid StaffMember.
 */
export function isStaffMember(obj: unknown): obj is StaffMember {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const member = obj as Record<string, unknown>;

  const basicChecks =
    typeof member.name === 'string' &&
    typeof member.rank === 'number' &&
    member.startOfService instanceof Date &&
    Array.isArray(member.qualifications) &&
    member.qualifications.every((q) => typeof q === 'string');

  if (!basicChecks) {
    return false;
  }

  // Check optional constraints field
  if (member.constraints !== undefined) {
    if (!Array.isArray(member.constraints)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a StaffMember object and returns validation errors if any.
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validateStaffMember(member: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof member !== 'object' || member === null) {
    errors.push({ field: 'root', message: 'StaffMember must be an object' });
    return errors;
  }

  const m = member as Record<string, unknown>;

  // Validate name
  if (typeof m.name !== 'string') {
    errors.push({ field: 'name', message: 'name must be a string' });
  } else if (m.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'name cannot be empty' });
  }

  // Validate rank
  if (typeof m.rank !== 'number') {
    errors.push({ field: 'rank', message: 'rank must be a number' });
  } else if (!Number.isFinite(m.rank)) {
    errors.push({ field: 'rank', message: 'rank must be a finite number' });
  } else if (m.rank < 0) {
    errors.push({ field: 'rank', message: 'rank cannot be negative' });
  }

  // Validate startOfService
  if (!(m.startOfService instanceof Date)) {
    errors.push({ field: 'startOfService', message: 'startOfService must be a Date object' });
  } else if (isNaN(m.startOfService.getTime())) {
    errors.push({ field: 'startOfService', message: 'startOfService must be a valid Date' });
  }

  // Validate qualifications
  if (!Array.isArray(m.qualifications)) {
    errors.push({ field: 'qualifications', message: 'qualifications must be an array' });
  } else {
    m.qualifications.forEach((q, index) => {
      if (typeof q !== 'string') {
        errors.push({
          field: `qualifications[${index}]`,
          message: `qualification at index ${index} must be a string`,
        });
      }
    });
  }

  // Validate optional constraints
  if (m.constraints !== undefined) {
    if (!Array.isArray(m.constraints)) {
      errors.push({ field: 'constraints', message: 'constraints must be an array if provided' });
    } else {
      // Import validateStaffConstraint would cause circular dependency
      // So we just check that it's an array here
      // Full validation can be done separately if needed
    }
  }

  return errors;
}

/**
 * Helper function to create a StaffMember with validation.
 * Throws an error if the input is invalid.
 */
export function createStaffMember(data: {
  name: string;
  rank: number;
  startOfService: Date;
  qualifications: string[];
  constraints?: StaffConstraint[];
}): StaffMember {
  const errors = validateStaffMember(data);

  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
    throw new Error(`Invalid StaffMember: ${errorMessages}`);
  }

  return {
    name: data.name,
    rank: data.rank,
    startOfService: data.startOfService,
    qualifications: [...data.qualifications], // Create a copy to avoid external mutations
    constraints: data.constraints ? data.constraints.map((c) => ({ ...c })) : undefined,
  };
}

/**
 * Calculates years of service for a staff member as of a given date.
 */
export function calculateYearsOfService(
  member: StaffMember,
  asOfDate: Date = new Date()
): number {
  const milliseconds = asOfDate.getTime() - member.startOfService.getTime();
  const years = milliseconds / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years
  return Math.max(0, years); // Return 0 if negative (future start date)
}

/**
 * Checks if a staff member has a specific qualification.
 */
export function hasQualification(member: StaffMember, qualification: string): boolean {
  return member.qualifications.includes(qualification);
}

/**
 * Checks if a staff member has all of the specified qualifications.
 */
export function hasAllQualifications(member: StaffMember, qualifications: string[]): boolean {
  return qualifications.every((q) => member.qualifications.includes(q));
}

/**
 * Checks if a staff member has any of the specified qualifications.
 */
export function hasAnyQualification(member: StaffMember, qualifications: string[]): boolean {
  return qualifications.some((q) => member.qualifications.includes(q));
}
