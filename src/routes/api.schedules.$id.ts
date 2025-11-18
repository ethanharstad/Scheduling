import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { getDatabase } from '../db/context';
import { schedules } from '../db/schema';
import type { Schedule } from '../types/Schedule';

/**
 * Converts a database row to a Schedule object with proper Date conversion
 */
function rowToSchedule(row: typeof schedules.$inferSelect): Schedule {
  return {
    id: row.id,
    name: row.name || undefined,
    scheduleStart: new Date(row.scheduleStart),
    scheduleEnd: new Date(row.scheduleEnd),
    assignments: row.assignments.map((assignment) => ({
      ...assignment,
      startTime: new Date(assignment.startTime),
      endTime: new Date(assignment.endTime),
      metadata: assignment.metadata ? {
        ...assignment.metadata,
        assignedAt: assignment.metadata.assignedAt
          ? new Date(assignment.metadata.assignedAt as string | number)
          : undefined,
      } : undefined,
    })),
    unfilledSlots: row.unfilledSlots,
    sourceRequirement: row.sourceRequirementId || undefined,
    metadata: row.metadata ? {
      ...row.metadata,
      generatedAt: row.metadata.generatedAt
        ? new Date(row.metadata.generatedAt as string | number)
        : undefined,
    } : undefined,
  };
}

export const Route = createFileRoute('/api/schedules/$id')({
  server: {
    handlers: {
      // Get a single schedule by ID
      GET: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          const schedule = await db
            .select()
            .from(schedules)
            .where(eq(schedules.id, params.id))
            .limit(1);

          if (schedule.length === 0) {
            return json({ error: 'Schedule not found' }, { status: 404 });
          }

          return json(rowToSchedule(schedule[0]));
        } catch (error) {
          console.error('Error fetching schedule:', error);
          return json(
            { error: 'Failed to fetch schedule' },
            { status: 500 }
          );
        }
      },

      // Update a schedule
      PUT: async ({ params, request }: { params: { id: string }; request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Check if schedule exists
          const existing = await db
            .select()
            .from(schedules)
            .where(eq(schedules.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Schedule not found' }, { status: 404 });
          }

          // Update the schedule
          const updated = await db
            .update(schedules)
            .set({
              name: body.name,
              scheduleStart: body.scheduleStart ? new Date(body.scheduleStart) : undefined,
              scheduleEnd: body.scheduleEnd ? new Date(body.scheduleEnd) : undefined,
              assignments: body.assignments,
              unfilledSlots: body.unfilledSlots,
              sourceRequirementId: typeof body.sourceRequirement === 'string'
                ? body.sourceRequirement
                : body.sourceRequirement?.id,
              metadata: body.metadata,
            })
            .where(eq(schedules.id, params.id))
            .returning();

          return json(rowToSchedule(updated[0]));
        } catch (error) {
          console.error('Error updating schedule:', error);
          return json(
            { error: 'Failed to update schedule' },
            { status: 500 }
          );
        }
      },

      // Delete a schedule
      DELETE: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          // Check if schedule exists
          const existing = await db
            .select()
            .from(schedules)
            .where(eq(schedules.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Schedule not found' }, { status: 404 });
          }

          // Delete the schedule
          await db
            .delete(schedules)
            .where(eq(schedules.id, params.id));

          return json({ success: true, message: 'Schedule deleted' });
        } catch (error) {
          console.error('Error deleting schedule:', error);
          return json(
            { error: 'Failed to delete schedule' },
            { status: 500 }
          );
        }
      },
    },
  },
});
