import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { getDatabase } from '../db/context';
import { staffSlots } from '../db/schema';
import type { StaffSlot } from '../types/StaffSlot';

/**
 * Converts a database row to a StaffSlot object with proper Date conversion
 */
function rowToStaffSlot(row: typeof staffSlots.$inferSelect): StaffSlot & { id: string; scheduleRequirementId: string } {
  return {
    id: row.id,
    scheduleRequirementId: row.scheduleRequirementId,
    name: row.name,
    startTime: new Date(row.startTime),
    endTime: new Date(row.endTime),
    requiredQualifications: row.requiredQualifications,
  };
}

export const Route = createFileRoute('/api/staff-slots')({
  server: {
    handlers: {
      // Get all staff slots
      GET: async () => {
        try {
          const db = await getDatabase();

          const allSlots = await db.select().from(staffSlots);

          const slotObjects = allSlots.map(rowToStaffSlot);

          return json(slotObjects);
        } catch (error) {
          console.error('Error fetching staff slots:', error);
          return json(
            { error: 'Failed to fetch staff slots' },
            { status: 500 }
          );
        }
      },

      // Create a new staff slot
      POST: async ({ request }: { request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Validate required fields
          if (!body.id || !body.name || !body.startTime || !body.endTime || !body.requiredQualifications || !body.scheduleRequirementId) {
            return json(
              { error: 'Missing required fields: id, name, startTime, endTime, requiredQualifications, scheduleRequirementId' },
              { status: 400 }
            );
          }

          // Insert the new staff slot
          const newSlot = await db
            .insert(staffSlots)
            .values({
              id: body.id,
              scheduleRequirementId: body.scheduleRequirementId,
              name: body.name,
              startTime: new Date(body.startTime),
              endTime: new Date(body.endTime),
              requiredQualifications: body.requiredQualifications,
            })
            .returning();

          const slot = rowToStaffSlot(newSlot[0]);

          return json(slot, { status: 201 });
        } catch (error) {
          console.error('Error creating staff slot:', error);
          return json(
            { error: 'Failed to create staff slot' },
            { status: 500 }
          );
        }
      },
    },
  },
});
