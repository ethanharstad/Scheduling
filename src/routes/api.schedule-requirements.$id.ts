import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
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

export const Route = createFileRoute('/api/schedule-requirements/$id')({
  server: {
    handlers: {
      // Get a single schedule requirement by ID
      GET: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          const requirement = await db
            .select()
            .from(scheduleRequirements)
            .where(eq(scheduleRequirements.id, params.id))
            .limit(1);

          if (requirement.length === 0) {
            return json({ error: 'Schedule requirement not found' }, { status: 404 });
          }

          return json(rowToScheduleRequirement(requirement[0]));
        } catch (error) {
          console.error('Error fetching schedule requirement:', error);
          return json(
            { error: 'Failed to fetch schedule requirement' },
            { status: 500 }
          );
        }
      },

      // Update a schedule requirement
      PUT: async ({ params, request }: { params: { id: string }; request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Check if schedule requirement exists
          const existing = await db
            .select()
            .from(scheduleRequirements)
            .where(eq(scheduleRequirements.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Schedule requirement not found' }, { status: 404 });
          }

          // Update the schedule requirement
          const updated = await db
            .update(scheduleRequirements)
            .set({
              name: body.name,
              scheduleStart: body.scheduleStart ? new Date(body.scheduleStart) : undefined,
              scheduleEnd: body.scheduleEnd ? new Date(body.scheduleEnd) : undefined,
              staffSlots: body.staffSlots,
              metadata: body.metadata,
            })
            .where(eq(scheduleRequirements.id, params.id))
            .returning();

          return json(rowToScheduleRequirement(updated[0]));
        } catch (error) {
          console.error('Error updating schedule requirement:', error);
          return json(
            { error: 'Failed to update schedule requirement' },
            { status: 500 }
          );
        }
      },

      // Delete a schedule requirement
      DELETE: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          // Check if schedule requirement exists
          const existing = await db
            .select()
            .from(scheduleRequirements)
            .where(eq(scheduleRequirements.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Schedule requirement not found' }, { status: 404 });
          }

          // Delete the schedule requirement
          await db
            .delete(scheduleRequirements)
            .where(eq(scheduleRequirements.id, params.id));

          return json({ success: true, message: 'Schedule requirement deleted' });
        } catch (error) {
          console.error('Error deleting schedule requirement:', error);
          return json(
            { error: 'Failed to delete schedule requirement' },
            { status: 500 }
          );
        }
      },
    },
  },
});
