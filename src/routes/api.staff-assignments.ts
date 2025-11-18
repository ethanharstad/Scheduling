import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
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

export const Route = createFileRoute('/api/staff-assignments')({
  server: {
    handlers: {
      // Get all staff assignments
      GET: async () => {
        try {
          const db = await getDatabase();

          const allAssignments = await db.select().from(staffAssignments);

          const assignmentObjects = allAssignments.map(rowToStaffAssignment);

          return json(assignmentObjects);
        } catch (error) {
          console.error('Error fetching staff assignments:', error);
          return json(
            { error: 'Failed to fetch staff assignments' },
            { status: 500 }
          );
        }
      },

      // Create a new staff assignment
      POST: async ({ request }: { request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Validate required fields
          if (!body.id || !body.staffMemberId || !body.startTime || !body.endTime) {
            return json(
              { error: 'Missing required fields: id, staffMemberId, startTime, endTime' },
              { status: 400 }
            );
          }

          // Insert the new staff assignment
          const newAssignment = await db
            .insert(staffAssignments)
            .values({
              id: body.id,
              scheduleId: body.scheduleId,
              staffMemberId: body.staffMemberId,
              staffSlotId: body.staffSlotId,
              startTime: new Date(body.startTime),
              endTime: new Date(body.endTime),
              metadata: body.metadata,
            })
            .returning();

          const assignment = rowToStaffAssignment(newAssignment[0]);

          return json(assignment, { status: 201 });
        } catch (error) {
          console.error('Error creating staff assignment:', error);
          return json(
            { error: 'Failed to create staff assignment' },
            { status: 500 }
          );
        }
      },
    },
  },
});
