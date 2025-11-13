/**
 * Type definitions for the staffing scheduler.
 */

// StaffConstraint types and functions
export {
  StaffConstraint,
  PreferenceLevel,
  ValidationError as StaffConstraintValidationError,
  ConstraintStats,
  isPreferenceLevel,
  isStaffConstraint,
  validateStaffConstraint,
  createStaffConstraint,
  getConstraintDuration,
  isTimeInConstraint,
  doConstraintsOverlap,
  doesConstraintContainTimeSlot,
  doesTimeSlotOverlapConstraint,
  filterConstraintsByPreference,
  getUnavailableConstraints,
  getPreferredConstraints,
  hasUnavailableConflict,
  getTimeSlotPreference,
  calculatePreferenceScore,
  sortConstraintsByStartTime,
  groupConstraintsByPreference,
  groupConstraintsByDate,
  getConstraintsInDateRange,
  getConstraintStats,
  getConstraintsSummary,
} from './StaffConstraint';

// StaffMember types and functions
export {
  StaffMember,
  ValidationError as StaffMemberValidationError,
  isStaffMember,
  validateStaffMember,
  createStaffMember,
  calculateYearsOfService,
  hasQualification,
  hasAllQualifications,
  hasAnyQualification,
} from './StaffMember';

// StaffSlot types and functions
export {
  StaffSlot,
  ValidationError as StaffSlotValidationError,
  isStaffSlot,
  validateStaffSlot,
  createStaffSlot,
  getSlotDuration,
  isSlotInTimeWindow,
  doSlotsOverlap,
  isSlotOnDate,
  groupSlotsByDate,
  sortSlotsByStartTime,
  filterSlotsByQualification,
  requiresAllQualifications,
  requiresAnyQualification,
} from './StaffSlot';

// ScheduleRequirement types and functions
export {
  ScheduleRequirement,
  ValidationError as ScheduleRequirementValidationError,
  ScheduleRequirementStats,
  isScheduleRequirement,
  validateScheduleRequirement,
  createScheduleRequirement,
  getTotalSlotCount,
  getTotalRequiredHours,
  getAllRequiredQualifications,
  countSlotsRequiringQualification,
  getSlotsByDateRange,
  groupSlotsByQualifications,
  areAllSlotsInScheduleWindow,
  findSlotsOutsideWindow,
  getScheduleStats,
  getRequirementSummary,
} from './ScheduleRequirement';
