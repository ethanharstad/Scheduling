import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
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

export const Route = createFileRoute('/api/schedules')({
  server: {
    handlers: {
      // Get all schedules
      GET: async () => {
        try {
          const db = await getDatabase();

          const allSchedules = await db.select().from(schedules);

          const scheduleObjects = allSchedules.map(rowToSchedule);

          return json(scheduleObjects);
        } catch (error) {
          console.error('Error fetching schedules:', error);
          return json(
            { error: 'Failed to fetch schedules' },
            { status: 500 }
          );
        }
      },

      // Create a new schedule
      POST: async ({ request }: { request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Validate required fields
          if (!body.id || !body.scheduleStart || !body.scheduleEnd || !body.assignments) {
            return json(
              { error: 'Missing required fields: id, scheduleStart, scheduleEnd, assignments' },
              { status: 400 }
            );
          }

          // Insert the new schedule
          const newSchedule = await db
            .insert(schedules)
            .values({
              id: body.id,
              name: body.name,
              scheduleStart: new Date(body.scheduleStart),
              scheduleEnd: new Date(body.scheduleEnd),
              assignments: body.assignments || [],
              unfilledSlots: body.unfilledSlots || [],
              sourceRequirementId: typeof body.sourceRequirement === 'string'
                ? body.sourceRequirement
                : body.sourceRequirement?.id,
              metadata: body.metadata,
            })
            .returning();

          const schedule = rowToSchedule(newSchedule[0]);

          return json(schedule, { status: 201 });
        } catch (error) {
          console.error('Error creating schedule:', error);
          return json(
            { error: 'Failed to create schedule' },
            { status: 500 }
          );
        }
      },
    },
  },
});
