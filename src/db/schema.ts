import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
