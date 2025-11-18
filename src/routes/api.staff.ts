import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { getDatabase } from '../db/context';
import { staffMembers } from '../db/schema';

export const Route = createFileRoute('/api/staff')({
  server: {
    handlers: {
      // Get all staff members
      GET: async () => {
        try {
          const db = await getDatabase();

          const allStaff = await db.select().from(staffMembers);

          // Convert database rows to StaffMember objects
          const staffMemberObjects = allStaff.map((staff) => ({
            id: staff.id,
            name: staff.name,
            rank: staff.rank,
            startOfService: new Date(staff.startOfService),
            qualifications: staff.qualifications,
            constraints: staff.constraints,
          }));

          return json(staffMemberObjects);
        } catch (error) {
          console.error('Error fetching staff members:', error);
          return json(
            { error: 'Failed to fetch staff members' },
            { status: 500 }
          );
        }
      },

      // Create a new staff member
      POST: async ({ request }: { request: Request }) => {
        try {
          const db = await getDatabase();

          const body = await request.json();

          // Validate required fields
          if (!body.id || !body.name || body.rank === undefined || !body.startOfService || !body.qualifications) {
            return json(
              { error: 'Missing required fields: id, name, rank, startOfService, qualifications' },
              { status: 400 }
            );
          }

          // Insert the new staff member
          const newStaff = await db
            .insert(staffMembers)
            .values({
              id: body.id,
              name: body.name,
              rank: body.rank,
              startOfService: new Date(body.startOfService),
              qualifications: body.qualifications,
              constraints: body.constraints,
            })
            .returning();

          const staffMember = newStaff[0];

          return json(
            {
              id: staffMember.id,
              name: staffMember.name,
              rank: staffMember.rank,
              startOfService: new Date(staffMember.startOfService),
              qualifications: staffMember.qualifications,
              constraints: staffMember.constraints,
            },
            { status: 201 }
          );
        } catch (error) {
          console.error('Error creating staff member:', error);
          return json(
            { error: 'Failed to create staff member' },
            { status: 500 }
          );
        }
      },
    },
  },
});
