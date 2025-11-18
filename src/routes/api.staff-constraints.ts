import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { getDatabase } from '../db/context';
import { staffConstraints } from '../db/schema';
import type { StaffConstraint } from '../types/StaffConstraint';

/**
 * Converts a database row to a StaffConstraint object with proper Date conversion
 */
function rowToStaffConstraint(row: typeof staffConstraints.$inferSelect): StaffConstraint & { id: string; staffMemberId: string } {
  return {
    id: row.id,
    staffMemberId: row.staffMemberId,
    startTime: new Date(row.startTime),
    endTime: new Date(row.endTime),
    preference: row.preference,
    reason: row.reason || undefined,
  };
}

export const Route = createFileRoute('/api/staff-constraints')({
  server: {
    handlers: {
      // Get all staff constraints
      GET: async () => {
        try {
          const db = await getDatabase();

          const allConstraints = await db.select().from(staffConstraints);

          const constraintObjects = allConstraints.map(rowToStaffConstraint);

          return json(constraintObjects);
        } catch (error) {
          console.error('Error fetching staff constraints:', error);
          return json(
            { error: 'Failed to fetch staff constraints' },
            { status: 500 }
          );
        }
      },

      // Create a new staff constraint
      POST: async ({ request }: { request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Validate required fields
          if (!body.staffMemberId || !body.startTime || !body.endTime || !body.preference) {
            return json(
              { error: 'Missing required fields: staffMemberId, startTime, endTime, preference' },
              { status: 400 }
            );
          }

          // Generate UUID if id is not provided
          const id = body.id || crypto.randomUUID();

          // Insert the new staff constraint
          const newConstraint = await db
            .insert(staffConstraints)
            .values({
              id,
              staffMemberId: body.staffMemberId,
              startTime: new Date(body.startTime),
              endTime: new Date(body.endTime),
              preference: body.preference,
              reason: body.reason,
            })
            .returning();

          const constraint = rowToStaffConstraint(newConstraint[0]);

          return json(constraint, { status: 201 });
        } catch (error) {
          console.error('Error creating staff constraint:', error);
          return json(
            { error: 'Failed to create staff constraint' },
            { status: 500 }
          );
        }
      },
    },
  },
});
