import {
  StaffAssignment,
  createStaffAssignment,
  validateStaffAssignment,
  isStaffAssignment,
  getStaffMemberName,
  getStaffSlotName,
  getAssignmentDuration,
  doAssignmentsOverlap,
  groupAssignmentsByStaff,
  groupAssignmentsByDate,
  findAssignmentsForStaff,
  calculateStaffHours,
  getAssignmentStats,
} from '../types/StaffAssignment';
import { createStaffMember } from '../types/StaffMember';
import { createStaffSlot } from '../types/StaffSlot';

describe('StaffAssignment', () => {
  const testStaff = createStaffMember({
    name: 'Nurse Emily',
    rank: 3,
    startOfService: new Date('2020-01-01'),
    qualifications: ['RN', 'BLS'],
  });

  const testSlot = createStaffSlot({
    name: 'Morning Shift',
    startTime: new Date('2025-11-17T07:00:00'),
    endTime: new Date('2025-11-17T15:00:00'),
    requiredQualifications: ['RN'],
  });

  describe('createStaffAssignment', () => {
    it('should create assignment with full objects', () => {
      const assignment = createStaffAssignment({
        id: 'assign-1',
        staffMember: testStaff,
        staffSlot: testSlot,
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
      });

      expect(assignment.id).toBe('assign-1');
      expect(assignment.staffMember).toEqual(testStaff);
      expect(assignment.staffSlot).toEqual(testSlot);
    });

    it('should create assignment with strings', () => {
      const assignment = createStaffAssignment({
        id: 'assign-1',
        staffMember: 'Nurse Emily',
        staffSlot: 'Morning Shift',
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
      });

      expect(assignment.staffMember).toBe('Nurse Emily');
      expect(assignment.staffSlot).toBe('Morning Shift');
    });

    it('should throw error for end before start', () => {
      expect(() =>
        createStaffAssignment({
          id: 'assign-1',
          staffMember: testStaff,
          staffSlot: testSlot,
          startTime: new Date('2025-11-17T15:00:00'),
          endTime: new Date('2025-11-17T07:00:00'),
        })
      ).toThrow('endTime must be after startTime');
    });
  });

  describe('getStaffMemberName', () => {
    it('should get name from staff object', () => {
      const assignment = createStaffAssignment({
        id: 'assign-1',
        staffMember: testStaff,
        staffSlot: testSlot,
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
      });

      expect(getStaffMemberName(assignment)).toBe('Nurse Emily');
    });

    it('should get name from string', () => {
      const assignment = createStaffAssignment({
        id: 'assign-1',
        staffMember: 'Dr. John Doe',
        staffSlot: testSlot,
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
      });

      expect(getStaffMemberName(assignment)).toBe('Dr. John Doe');
    });
  });

  describe('getStaffSlotName', () => {
    it('should get name from slot object', () => {
      const assignment = createStaffAssignment({
        id: 'assign-1',
        staffMember: testStaff,
        staffSlot: testSlot,
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
      });

      expect(getStaffSlotName(assignment)).toBe('Morning Shift');
    });

    it('should get name from string', () => {
      const assignment = createStaffAssignment({
        id: 'assign-1',
        staffMember: testStaff,
        staffSlot: 'Afternoon Shift',
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
      });

      expect(getStaffSlotName(assignment)).toBe('Afternoon Shift');
    });
  });

  describe('getAssignmentDuration', () => {
    it('should calculate duration in hours', () => {
      const assignment = createStaffAssignment({
        id: 'assign-1',
        staffMember: testStaff,
        staffSlot: testSlot,
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
      });

      expect(getAssignmentDuration(assignment)).toBe(8);
    });
  });

  describe('doAssignmentsOverlap', () => {
    const assignment1 = createStaffAssignment({
      id: 'assign-1',
      staffMember: 'Staff A',
      staffSlot: 'Slot 1',
      startTime: new Date('2025-11-17T08:00:00'),
      endTime: new Date('2025-11-17T12:00:00'),
    });

    const assignment2 = createStaffAssignment({
      id: 'assign-2',
      staffMember: 'Staff A',
      staffSlot: 'Slot 2',
      startTime: new Date('2025-11-17T10:00:00'),
      endTime: new Date('2025-11-17T14:00:00'),
    });

    const assignment3 = createStaffAssignment({
      id: 'assign-3',
      staffMember: 'Staff A',
      staffSlot: 'Slot 3',
      startTime: new Date('2025-11-17T13:00:00'),
      endTime: new Date('2025-11-17T15:00:00'),
    });

    it('should return true for overlapping assignments', () => {
      expect(doAssignmentsOverlap(assignment1, assignment2)).toBe(true);
    });

    it('should return false for non-overlapping assignments', () => {
      expect(doAssignmentsOverlap(assignment1, assignment3)).toBe(false);
    });
  });

  describe('groupAssignmentsByStaff', () => {
    const assignments: StaffAssignment[] = [
      createStaffAssignment({
        id: 'assign-1',
        staffMember: 'Nurse A',
        staffSlot: 'Slot 1',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T12:00:00'),
      }),
      createStaffAssignment({
        id: 'assign-2',
        staffMember: 'Nurse A',
        staffSlot: 'Slot 2',
        startTime: new Date('2025-11-17T13:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
      }),
      createStaffAssignment({
        id: 'assign-3',
        staffMember: 'Nurse B',
        staffSlot: 'Slot 3',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
      }),
    ];

    it('should group assignments by staff', () => {
      const grouped = groupAssignmentsByStaff(assignments);

      expect(grouped.size).toBe(2);
      expect(grouped.get('Nurse A')).toHaveLength(2);
      expect(grouped.get('Nurse B')).toHaveLength(1);
    });
  });

  describe('groupAssignmentsByDate', () => {
    const assignments: StaffAssignment[] = [
      createStaffAssignment({
        id: 'assign-1',
        staffMember: 'Nurse A',
        staffSlot: 'Slot 1',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
      }),
      createStaffAssignment({
        id: 'assign-2',
        staffMember: 'Nurse B',
        staffSlot: 'Slot 2',
        startTime: new Date('2025-11-17T16:00:00'),
        endTime: new Date('2025-11-18T00:00:00'),
      }),
      createStaffAssignment({
        id: 'assign-3',
        staffMember: 'Nurse C',
        staffSlot: 'Slot 3',
        startTime: new Date('2025-11-18T08:00:00'),
        endTime: new Date('2025-11-18T16:00:00'),
      }),
    ];

    it('should group assignments by date', () => {
      const grouped = groupAssignmentsByDate(assignments);

      expect(grouped.size).toBe(2);
      expect(grouped.get('2025-11-17')).toHaveLength(2);
      expect(grouped.get('2025-11-18')).toHaveLength(1);
    });
  });

  describe('findAssignmentsForStaff', () => {
    const assignments: StaffAssignment[] = [
      createStaffAssignment({
        id: 'assign-1',
        staffMember: 'Nurse Emily',
        staffSlot: 'Slot 1',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
      }),
      createStaffAssignment({
        id: 'assign-2',
        staffMember: 'Nurse Emily',
        staffSlot: 'Slot 2',
        startTime: new Date('2025-11-18T08:00:00'),
        endTime: new Date('2025-11-18T16:00:00'),
      }),
      createStaffAssignment({
        id: 'assign-3',
        staffMember: 'Dr. John',
        staffSlot: 'Slot 3',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
      }),
    ];

    it('should find assignments by staff name', () => {
      const found = findAssignmentsForStaff(assignments, 'Nurse Emily');

      expect(found).toHaveLength(2);
      expect(found[0].id).toBe('assign-1');
      expect(found[1].id).toBe('assign-2');
    });

    it('should find assignments by staff object', () => {
      const staff = createStaffMember({
        name: 'Nurse Emily',
        rank: 3,
        startOfService: new Date(),
        qualifications: ['RN'],
      });

      const found = findAssignmentsForStaff(assignments, staff);

      expect(found).toHaveLength(2);
    });
  });

  describe('calculateStaffHours', () => {
    const assignments: StaffAssignment[] = [
      createStaffAssignment({
        id: 'assign-1',
        staffMember: 'Nurse Emily',
        staffSlot: 'Slot 1',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'), // 8 hours
      }),
      createStaffAssignment({
        id: 'assign-2',
        staffMember: 'Nurse Emily',
        staffSlot: 'Slot 2',
        startTime: new Date('2025-11-18T08:00:00'),
        endTime: new Date('2025-11-18T20:00:00'), // 12 hours
      }),
      createStaffAssignment({
        id: 'assign-3',
        staffMember: 'Dr. John',
        staffSlot: 'Slot 3',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'), // 8 hours
      }),
    ];

    it('should calculate total hours for staff', () => {
      const hours = calculateStaffHours(assignments, 'Nurse Emily');

      expect(hours).toBe(20); // 8 + 12
    });

    it('should return 0 for staff with no assignments', () => {
      const hours = calculateStaffHours(assignments, 'Nurse Unknown');

      expect(hours).toBe(0);
    });
  });

  describe('getAssignmentStats', () => {
    const assignments: StaffAssignment[] = [
      createStaffAssignment({
        id: 'assign-1',
        staffMember: 'Nurse A',
        staffSlot: 'Slot 1',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'), // 8 hours
      }),
      createStaffAssignment({
        id: 'assign-2',
        staffMember: 'Nurse A',
        staffSlot: 'Slot 2',
        startTime: new Date('2025-11-18T08:00:00'),
        endTime: new Date('2025-11-18T16:00:00'), // 8 hours
      }),
      createStaffAssignment({
        id: 'assign-3',
        staffMember: 'Nurse B',
        staffSlot: 'Slot 3',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T20:00:00'), // 12 hours
      }),
    ];

    it('should calculate comprehensive stats', () => {
      const stats = getAssignmentStats(assignments);

      expect(stats.totalAssignments).toBe(3);
      expect(stats.totalHours).toBe(28); // 8 + 8 + 12
      expect(stats.uniqueStaffCount).toBe(2);
      expect(stats.averageHoursPerAssignment).toBeCloseTo(9.33, 1);
    });

    it('should calculate hours by staff', () => {
      const stats = getAssignmentStats(assignments);

      expect(stats.hoursByStaff.get('Nurse A')).toBe(16);
      expect(stats.hoursByStaff.get('Nurse B')).toBe(12);
    });

    it('should handle empty assignments', () => {
      const stats = getAssignmentStats([]);

      expect(stats.totalAssignments).toBe(0);
      expect(stats.totalHours).toBe(0);
      expect(stats.uniqueStaffCount).toBe(0);
    });
  });
});
