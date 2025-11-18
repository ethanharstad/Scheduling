import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { getDatabase } from '../db/context';
import { staffSlots } from '../db/schema';
import type { StaffSlot } from '../types/StaffSlot';

/**
 * Converts a database row to a StaffSlot object with proper Date conversion
 */
function rowToStaffSlot(row: typeof staffSlots.$inferSelect): StaffSlot & { id: string; scheduleRequirementId?: string } {
  return {
    id: row.id,
    scheduleRequirementId: row.scheduleRequirementId || undefined,
    name: row.name,
    startTime: new Date(row.startTime),
    endTime: new Date(row.endTime),
    requiredQualifications: row.requiredQualifications,
  };
}

export const Route = createFileRoute('/api/staff-slots/$id')({
  server: {
    handlers: {
      // Get a single staff slot by ID
      GET: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          const slot = await db
            .select()
            .from(staffSlots)
            .where(eq(staffSlots.id, params.id))
            .limit(1);

          if (slot.length === 0) {
            return json({ error: 'Staff slot not found' }, { status: 404 });
          }

          return json(rowToStaffSlot(slot[0]));
        } catch (error) {
          console.error('Error fetching staff slot:', error);
          return json(
            { error: 'Failed to fetch staff slot' },
            { status: 500 }
          );
        }
      },

      // Update a staff slot
      PUT: async ({ params, request }: { params: { id: string }; request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Check if staff slot exists
          const existing = await db
            .select()
            .from(staffSlots)
            .where(eq(staffSlots.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Staff slot not found' }, { status: 404 });
          }

          // Update the staff slot
          const updated = await db
            .update(staffSlots)
            .set({
              scheduleRequirementId: body.scheduleRequirementId,
              name: body.name,
              startTime: body.startTime ? new Date(body.startTime) : undefined,
              endTime: body.endTime ? new Date(body.endTime) : undefined,
              requiredQualifications: body.requiredQualifications,
            })
            .where(eq(staffSlots.id, params.id))
            .returning();

          return json(rowToStaffSlot(updated[0]));
        } catch (error) {
          console.error('Error updating staff slot:', error);
          return json(
            { error: 'Failed to update staff slot' },
            { status: 500 }
          );
        }
      },

      // Delete a staff slot
      DELETE: async ({ params }: { params: { id: string } }) => {
        try {
          const db = await getDatabase();

          // Check if staff slot exists
          const existing = await db
            .select()
            .from(staffSlots)
            .where(eq(staffSlots.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Staff slot not found' }, { status: 404 });
          }

          // Delete the staff slot
          await db
            .delete(staffSlots)
            .where(eq(staffSlots.id, params.id));

          return json({ success: true, message: 'Staff slot deleted' });
        } catch (error) {
          console.error('Error deleting staff slot:', error);
          return json(
            { error: 'Failed to delete staff slot' },
            { status: 500 }
          );
        }
      },
    },
  },
});
