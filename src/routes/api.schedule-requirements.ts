import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { getDatabase } from '../db/context';
import { scheduleRequirements } from '../db/schema';
import type { ScheduleRequirement } from '../types/ScheduleRequirement';

/**
 * Converts a database row to a ScheduleRequirement object with proper Date conversion
 */
function rowToScheduleRequirement(row: typeof scheduleRequirements.$inferSelect): ScheduleRequirement {
  return {
    id: row.id,
    name: row.name || undefined,
    scheduleStart: new Date(row.scheduleStart),
    scheduleEnd: new Date(row.scheduleEnd),
    staffSlots: row.staffSlots.map((slot) => ({
      ...slot,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
    })),
    metadata: row.metadata ? {
      ...row.metadata,
      createdAt: row.metadata.createdAt
        ? new Date(row.metadata.createdAt as string | number)
        : undefined,
    } : undefined,
  };
}

export const Route = createFileRoute('/api/schedule-requirements')({
  server: {
    handlers: {
      // Get all schedule requirements
      GET: async () => {
        try {
          const db = await getDatabase();

          const allRequirements = await db.select().from(scheduleRequirements);

          const requirementObjects = allRequirements.map(rowToScheduleRequirement);

          return json(requirementObjects);
        } catch (error) {
          console.error('Error fetching schedule requirements:', error);
          return json(
            { error: 'Failed to fetch schedule requirements' },
            { status: 500 }
          );
        }
      },

      // Create a new schedule requirement
      POST: async ({ request }: { request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Validate required fields
          if (!body.scheduleStart || !body.scheduleEnd || !body.staffSlots) {
            return json(
              { error: 'Missing required fields: scheduleStart, scheduleEnd, staffSlots' },
              { status: 400 }
            );
          }

          // Generate UUID if id is not provided
          const id = body.id || crypto.randomUUID();

          // Insert the new schedule requirement
          const newRequirement = await db
            .insert(scheduleRequirements)
            .values({
              id,
              name: body.name,
              scheduleStart: new Date(body.scheduleStart),
              scheduleEnd: new Date(body.scheduleEnd),
              staffSlots: body.staffSlots || [],
              metadata: body.metadata,
            })
            .returning();

          const requirement = rowToScheduleRequirement(newRequirement[0]);

          return json(requirement, { status: 201 });
        } catch (error) {
          console.error('Error creating schedule requirement:', error);
          return json(
            { error: 'Failed to create schedule requirement' },
            { status: 500 }
          );
        }
      },
    },
  },
});
