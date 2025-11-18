import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { getDatabase } from '../db/context';
import { staffAssignments } from '../db/schema';

/**
 * Converts a database row with proper Date conversion
 */
function rowToStaffAssignment(row: typeof staffAssignments.$inferSelect) {
  return {
    id: row.id,
    scheduleId: row.scheduleId || undefined,
    staffMemberId: row.staffMemberId,
    staffSlotId: row.staffSlotId || undefined,
    startTime: new Date(row.startTime),
    endTime: new Date(row.endTime),
    metadata: row.metadata ? {
      ...row.metadata,
      assignedAt: row.metadata.assignedAt
        ? new Date(row.metadata.assignedAt as string | number)
        : undefined,
    } : undefined,
  };
}

export const Route = createFileRoute('/api/staff-assignments/$id')({
  server: {
    handlers: {
      // Get a single staff assignment by ID
      GET: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          const assignment = await db
            .select()
            .from(staffAssignments)
            .where(eq(staffAssignments.id, params.id))
            .limit(1);

          if (assignment.length === 0) {
            return json({ error: 'Staff assignment not found' }, { status: 404 });
          }

          return json(rowToStaffAssignment(assignment[0]));
        } catch (error) {
          console.error('Error fetching staff assignment:', error);
          return json(
            { error: 'Failed to fetch staff assignment' },
            { status: 500 }
          );
        }
      },

      // Update a staff assignment
      PUT: async ({ params, request }: { params: { id: string }; request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Check if staff assignment exists
          const existing = await db
            .select()
            .from(staffAssignments)
            .where(eq(staffAssignments.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Staff assignment not found' }, { status: 404 });
          }

          // Update the staff assignment
          const updated = await db
            .update(staffAssignments)
            .set({
              scheduleId: body.scheduleId,
              staffMemberId: body.staffMemberId,
              staffSlotId: body.staffSlotId,
              startTime: body.startTime ? new Date(body.startTime) : undefined,
              endTime: body.endTime ? new Date(body.endTime) : undefined,
              metadata: body.metadata,
            })
            .where(eq(staffAssignments.id, params.id))
            .returning();

          return json(rowToStaffAssignment(updated[0]));
        } catch (error) {
          console.error('Error updating staff assignment:', error);
          return json(
            { error: 'Failed to update staff assignment' },
            { status: 500 }
          );
        }
      },

      // Delete a staff assignment
      DELETE: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          // Check if staff assignment exists
          const existing = await db
            .select()
            .from(staffAssignments)
            .where(eq(staffAssignments.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Staff assignment not found' }, { status: 404 });
          }

          // Delete the staff assignment
          await db
            .delete(staffAssignments)
            .where(eq(staffAssignments.id, params.id));

          return json({ success: true, message: 'Staff assignment deleted' });
        } catch (error) {
          console.error('Error deleting staff assignment:', error);
          return json(
            { error: 'Failed to delete staff assignment' },
            { status: 500 }
          );
        }
      },
    },
  },
});
