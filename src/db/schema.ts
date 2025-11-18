import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { StaffAssignment } from '../types/StaffAssignment';
import type { UnfilledSlot } from '../types/Schedule';
import type { StaffSlot } from '../types/StaffSlot';
import type { PreferenceLevel } from '../types/StaffConstraint';

/**
 * Staff members table schema for D1 database.
 */
export const staffMembers = sqliteTable('staff_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rank: integer('rank').notNull(),
  startOfService: integer('start_of_service', { mode: 'timestamp' }).notNull(),
  qualifications: text('qualifications', { mode: 'json' }).$type<string[]>().notNull(),
  constraints: text('constraints', { mode: 'json' }).$type<unknown[]>(),
});

export type StaffMemberRow = typeof staffMembers.$inferSelect;
export type StaffMemberInsert = typeof staffMembers.$inferInsert;

/**
 * Schedules table schema for D1 database.
 * Represents a complete schedule with all assignments.
 */
export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  name: text('name'),
  scheduleStart: integer('schedule_start', { mode: 'timestamp' }).notNull(),
  scheduleEnd: integer('schedule_end', { mode: 'timestamp' }).notNull(),
  assignments: text('assignments', { mode: 'json' }).$type<StaffAssignment[]>().notNull(),
  unfilledSlots: text('unfilled_slots', { mode: 'json' }).$type<UnfilledSlot[]>().notNull(),
  sourceRequirementId: text('source_requirement_id'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
});

export type ScheduleRow = typeof schedules.$inferSelect;
export type ScheduleInsert = typeof schedules.$inferInsert;

/**
 * Schedule requirements table schema for D1 database.
 * Represents the requirements for generating a schedule.
 */
export const scheduleRequirements = sqliteTable('schedule_requirements', {
  id: text('id').primaryKey(),
  name: text('name'),
  scheduleStart: integer('schedule_start', { mode: 'timestamp' }).notNull(),
  scheduleEnd: integer('schedule_end', { mode: 'timestamp' }).notNull(),
  staffSlots: text('staff_slots', { mode: 'json' }).$type<StaffSlot[]>().notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
});

export type ScheduleRequirementRow = typeof scheduleRequirements.$inferSelect;
export type ScheduleRequirementInsert = typeof scheduleRequirements.$inferInsert;

/**
 * Staff constraints table schema for D1 database.
 * Represents scheduling constraints for staff members.
 */
export const staffConstraints = sqliteTable('staff_constraints', {
  id: text('id').primaryKey(),
  staffMemberId: text('staff_member_id').notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  preference: text('preference').$type<PreferenceLevel>().notNull(),
  reason: text('reason'),
});

export type StaffConstraintRow = typeof staffConstraints.$inferSelect;
export type StaffConstraintInsert = typeof staffConstraints.$inferInsert;

/**
 * Staff slots table schema for D1 database.
 * Represents individual staff slots that need to be filled.
 * Each slot must be associated with a schedule requirement.
 */
export const staffSlots = sqliteTable('staff_slots', {
  id: text('id').primaryKey(),
  scheduleRequirementId: text('schedule_requirement_id').notNull(),
  name: text('name').notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  requiredQualifications: text('required_qualifications', { mode: 'json' }).$type<string[]>().notNull(),
});

export type StaffSlotRow = typeof staffSlots.$inferSelect;
export type StaffSlotInsert = typeof staffSlots.$inferInsert;

/**
 * Staff assignments table schema for D1 database.
 * Represents assignments of staff members to slots.
 */
export const staffAssignments = sqliteTable('staff_assignments', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id'),
  staffMemberId: text('staff_member_id').notNull(),
  staffSlotId: text('staff_slot_id'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
});

export type StaffAssignmentRow = typeof staffAssignments.$inferSelect;
export type StaffAssignmentInsert = typeof staffAssignments.$inferInsert;
