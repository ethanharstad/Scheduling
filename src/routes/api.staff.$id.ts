import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { staffMembers } from '../db/schema';

export const Route = createFileRoute('/api/staff/$id')({
  server: {
    handlers: {
      // Get a single staff member by ID
      GET: async ({ params, request }: { params: { id: string }; request: Request }) => {
        try {
          const env = (request as any).cf?.env || (globalThis as any).process?.env;
          if (!env?.db) {
            throw new Error('Database binding not available');
          }
          const db = getDb(env.db);

          const staff = await db
            .select()
            .from(staffMembers)
            .where(eq(staffMembers.id, params.id))
            .limit(1);

          if (staff.length === 0) {
            return json({ error: 'Staff member not found' }, { status: 404 });
          }

          const staffMember = staff[0];

          return json({
            id: staffMember.id,
            name: staffMember.name,
            rank: staffMember.rank,
            startOfService: new Date(staffMember.startOfService),
            qualifications: staffMember.qualifications,
            constraints: staffMember.constraints,
          });
        } catch (error) {
          console.error('Error fetching staff member:', error);
          return json(
            { error: 'Failed to fetch staff member' },
            { status: 500 }
          );
        }
      },

      // Update a staff member
      PUT: async ({ params, request }: { params: { id: string }; request: Request }) => {
        try {
          const env = (request as any).cf?.env || (globalThis as any).process?.env;
          if (!env?.db) {
            throw new Error('Database binding not available');
          }
          const db = getDb(env.db);

          const body = await request.json();

          // Check if staff member exists
          const existing = await db
            .select()
            .from(staffMembers)
            .where(eq(staffMembers.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Staff member not found' }, { status: 404 });
          }

          // Update the staff member
          const updated = await db
            .update(staffMembers)
            .set({
              name: body.name,
              rank: body.rank,
              startOfService: body.startOfService ? new Date(body.startOfService) : undefined,
              qualifications: body.qualifications,
              constraints: body.constraints,
            })
            .where(eq(staffMembers.id, params.id))
            .returning();

          const staffMember = updated[0];

          return json({
            id: staffMember.id,
            name: staffMember.name,
            rank: staffMember.rank,
            startOfService: new Date(staffMember.startOfService),
            qualifications: staffMember.qualifications,
            constraints: staffMember.constraints,
          });
        } catch (error) {
          console.error('Error updating staff member:', error);
          return json(
            { error: 'Failed to update staff member' },
            { status: 500 }
          );
        }
      },

      // Delete a staff member
      DELETE: async ({ params, request }: { params: { id: string }; request: Request }) => {
        try {
          const env = (request as any).cf?.env || (globalThis as any).process?.env;
          if (!env?.db) {
            throw new Error('Database binding not available');
          }
          const db = getDb(env.db);

          // Check if staff member exists
          const existing = await db
            .select()
            .from(staffMembers)
            .where(eq(staffMembers.id, params.id))
            .limit(1);

          if (existing.length === 0) {
            return json({ error: 'Staff member not found' }, { status: 404 });
          }

          // Delete the staff member
          await db
            .delete(staffMembers)
            .where(eq(staffMembers.id, params.id));

          return json({ success: true, message: 'Staff member deleted' });
        } catch (error) {
          console.error('Error deleting staff member:', error);
          return json(
            { error: 'Failed to delete staff member' },
            { status: 500 }
          );
        }
      },
    },
  },
});
