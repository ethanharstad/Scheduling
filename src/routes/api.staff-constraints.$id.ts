import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
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

export const Route = createFileRoute('/api/staff-constraints/$id')({
  server: {
    handlers: {
      // Get a single staff constraint by ID
      GET: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          const constraint = await db
            .select()
            .from(staffConstraints)
            .where(eq(staffConstraints.id, params.id))
            .limit(1);

          if (constraint.length === 0) {
            return json({ error: 'Staff constraint not found' }, { status: 404 });
          }

          return json(rowToStaffConstraint(constraint[0]));
        } catch (error) {
          console.error('Error fetching staff constraint:', error);
          return json(
            { error: 'Failed to fetch staff constraint' },
            { status: 500 }
          );
        }
      },

      // Update a staff constraint
      PUT: async ({ params, request }: { params: { id: string }; request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Check if staff constraint exists
          const existing = await db
            .select()
            .from(staffConstraints)
            .where(eq(staffConstraints.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Staff constraint not found' }, { status: 404 });
          }

          // Update the staff constraint
          const updated = await db
            .update(staffConstraints)
            .set({
              staffMemberId: body.staffMemberId,
              startTime: body.startTime ? new Date(body.startTime) : undefined,
              endTime: body.endTime ? new Date(body.endTime) : undefined,
              preference: body.preference,
              reason: body.reason,
            })
            .where(eq(staffConstraints.id, params.id))
            .returning();

          return json(rowToStaffConstraint(updated[0]));
        } catch (error) {
          console.error('Error updating staff constraint:', error);
          return json(
            { error: 'Failed to update staff constraint' },
            { status: 500 }
          );
        }
      },

      // Delete a staff constraint
      DELETE: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          // Check if staff constraint exists
          const existing = await db
            .select()
            .from(staffConstraints)
            .where(eq(staffConstraints.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Staff constraint not found' }, { status: 404 });
          }

          // Delete the staff constraint
          await db
            .delete(staffConstraints)
            .where(eq(staffConstraints.id, params.id));

          return json({ success: true, message: 'Staff constraint deleted' });
        } catch (error) {
          console.error('Error deleting staff constraint:', error);
          return json(
            { error: 'Failed to delete staff constraint' },
            { status: 500 }
          );
        }
      },
    },
  },
});
