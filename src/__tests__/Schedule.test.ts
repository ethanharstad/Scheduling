import {
  Schedule,
  createSchedule,
  validateSchedule,
  isSchedule,
  getTotalAssignments,
  getTotalUnfilledSlots,
  getScheduleFillRate,
  findScheduleConflicts,
  isScheduleValid,
  getScheduleStats,
  getHoursByStaff,
  findStaffByHourTarget,
} from '../types/Schedule';
import { createStaffAssignment } from '../types/StaffAssignment';

describe('Schedule', () => {
  const testAssignments = [
    createStaffAssignment({
      id: 'assign-1',
      staffMember: 'Nurse A',
      staffSlot: 'Morning Shift',
      startTime: new Date('2025-11-17T07:00:00'),
      endTime: new Date('2025-11-17T15:00:00'), // 8 hours
    }),
    createStaffAssignment({
      id: 'assign-2',
      staffMember: 'Nurse B',
      staffSlot: 'Afternoon Shift',
      startTime: new Date('2025-11-17T15:00:00'),
      endTime: new Date('2025-11-17T23:00:00'), // 8 hours
    }),
    createStaffAssignment({
      id: 'assign-3',
      staffMember: 'Nurse A',
      staffSlot: 'Morning Shift',
      startTime: new Date('2025-11-18T07:00:00'),
      endTime: new Date('2025-11-18T15:00:00'), // 8 hours
    }),
  ];

  describe('createSchedule', () => {
    it('should create a valid schedule', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        name: 'Weekly Schedule',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: testAssignments,
        unfilledSlots: [],
      });

      expect(schedule.id).toBe('schedule-1');
      expect(schedule.name).toBe('Weekly Schedule');
      expect(schedule.assignments).toHaveLength(3);
      expect(schedule.unfilledSlots).toHaveLength(0);
    });

    it('should create schedule with unfilled slots', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: testAssignments,
        unfilledSlots: [
          {
            slot: 'Night Shift',
            reason: 'No available staff',
          },
        ],
      });

      expect(schedule.unfilledSlots).toHaveLength(1);
      expect(schedule.unfilledSlots[0].reason).toBe('No available staff');
    });

    it('should throw error for end before start', () => {
      expect(() =>
        createSchedule({
          id: 'schedule-1',
          scheduleStart: new Date('2025-11-23T23:59:59'),
          scheduleEnd: new Date('2025-11-17T00:00:00'),
          assignments: [],
          unfilledSlots: [],
        })
      ).toThrow('scheduleEnd must be after scheduleStart');
    });
  });

  describe('getTotalAssignments', () => {
    it('should return correct assignment count', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: testAssignments,
        unfilledSlots: [],
      });

      expect(getTotalAssignments(schedule)).toBe(3);
    });

    it('should return 0 for empty schedule', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: [],
        unfilledSlots: [],
      });

      expect(getTotalAssignments(schedule)).toBe(0);
    });
  });

  describe('getTotalUnfilledSlots', () => {
    it('should return unfilled count', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: [],
        unfilledSlots: [
          { slot: 'Slot 1', reason: 'Reason 1' },
          { slot: 'Slot 2', reason: 'Reason 2' },
        ],
      });

      expect(getTotalUnfilledSlots(schedule)).toBe(2);
    });
  });

  describe('getScheduleFillRate', () => {
    it('should calculate fill rate', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: testAssignments, // 3 assignments
        unfilledSlots: [{ slot: 'Slot 4', reason: 'No staff' }], // 1 unfilled
      });

      // 3 filled out of 4 total = 75%
      expect(getScheduleFillRate(schedule)).toBe(75);
    });

    it('should return 0 for empty schedule', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: [],
        unfilledSlots: [],
      });

      expect(getScheduleFillRate(schedule)).toBe(0);
    });

    it('should return 100 when all slots filled', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: testAssignments,
        unfilledSlots: [],
      });

      expect(getScheduleFillRate(schedule)).toBe(100);
    });
  });

  describe('findScheduleConflicts', () => {
    it('should find overlapping assignments for same staff', () => {
      const conflictingAssignments = [
        createStaffAssignment({
          id: 'assign-1',
          staffMember: 'Nurse A',
          staffSlot: 'Slot 1',
          startTime: new Date('2025-11-17T08:00:00'),
          endTime: new Date('2025-11-17T16:00:00'),
        }),
        createStaffAssignment({
          id: 'assign-2',
          staffMember: 'Nurse A',
          staffSlot: 'Slot 2',
          startTime: new Date('2025-11-17T12:00:00'), // Overlaps!
          endTime: new Date('2025-11-17T20:00:00'),
        }),
      ];

      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: conflictingAssignments,
        unfilledSlots: [],
      });

      const conflicts = findScheduleConflicts(schedule);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].staffName).toBe('Nurse A');
    });

    it('should not find conflicts for different staff', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: testAssignments,
        unfilledSlots: [],
      });

      const conflicts = findScheduleConflicts(schedule);

      expect(conflicts).toHaveLength(0);
    });

    it('should not find conflicts for non-overlapping assignments', () => {
      const nonOverlappingAssignments = [
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
          endTime: new Date('2025-11-17T17:00:00'),
        }),
      ];

      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: nonOverlappingAssignments,
        unfilledSlots: [],
      });

      const conflicts = findScheduleConflicts(schedule);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('isScheduleValid', () => {
    it('should return valid for schedule without conflicts', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: testAssignments,
        unfilledSlots: [],
      });

      const validation = isScheduleValid(schedule);

      expect(validation.valid).toBe(true);
      expect(validation.conflicts).toHaveLength(0);
    });

    it('should return invalid for schedule with conflicts', () => {
      const conflictingAssignments = [
        createStaffAssignment({
          id: 'assign-1',
          staffMember: 'Nurse A',
          staffSlot: 'Slot 1',
          startTime: new Date('2025-11-17T08:00:00'),
          endTime: new Date('2025-11-17T16:00:00'),
        }),
        createStaffAssignment({
          id: 'assign-2',
          staffMember: 'Nurse A',
          staffSlot: 'Slot 2',
          startTime: new Date('2025-11-17T12:00:00'),
          endTime: new Date('2025-11-17T20:00:00'),
        }),
      ];

      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: conflictingAssignments,
        unfilledSlots: [],
      });

      const validation = isScheduleValid(schedule);

      expect(validation.valid).toBe(false);
      expect(validation.conflicts).toHaveLength(1);
    });
  });

  describe('getScheduleStats', () => {
    it('should calculate comprehensive stats', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: testAssignments,
        unfilledSlots: [{ slot: 'Night Shift', reason: 'No staff' }],
      });

      const stats = getScheduleStats(schedule);

      expect(stats.totalAssignments).toBe(3);
      expect(stats.totalHours).toBe(24); // 3 x 8 hours
      expect(stats.uniqueStaffCount).toBe(2); // Nurse A and B
      expect(stats.unfilledSlots).toBe(1);
      expect(stats.fillRate).toBe(75); // 3 out of 4
      expect(stats.hasConflicts).toBe(false);
      expect(stats.conflictCount).toBe(0);
    });
  });

  describe('getHoursByStaff', () => {
    it('should return hours by staff member', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: testAssignments,
        unfilledSlots: [],
      });

      const hours = getHoursByStaff(schedule);

      expect(hours.get('Nurse A')).toBe(16); // 2 x 8 hours
      expect(hours.get('Nurse B')).toBe(8); // 1 x 8 hours
    });
  });

  describe('findStaffByHourTarget', () => {
    it('should identify over-utilized staff', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: [
          createStaffAssignment({
            id: 'assign-1',
            staffMember: 'Nurse A',
            staffSlot: 'Slot 1',
            startTime: new Date('2025-11-17T08:00:00'),
            endTime: new Date('2025-11-17T20:00:00'), // 12 hours
          }),
          createStaffAssignment({
            id: 'assign-2',
            staffMember: 'Nurse A',
            staffSlot: 'Slot 2',
            startTime: new Date('2025-11-18T08:00:00'),
            endTime: new Date('2025-11-18T20:00:00'), // 12 hours
          }),
          createStaffAssignment({
            id: 'assign-3',
            staffMember: 'Nurse A',
            staffSlot: 'Slot 3',
            startTime: new Date('2025-11-19T08:00:00'),
            endTime: new Date('2025-11-19T20:00:00'), // 12 hours
          }),
        ],
        unfilledSlots: [],
      });

      const analysis = findStaffByHourTarget(schedule, 20, 5);

      expect(analysis.overUtilized).toHaveLength(1);
      expect(analysis.overUtilized[0].staff).toBe('Nurse A');
      expect(analysis.overUtilized[0].hours).toBe(36);
      expect(analysis.overUtilized[0].difference).toBe(16); // 36 - 20
    });

    it('should identify under-utilized staff', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: [
          createStaffAssignment({
            id: 'assign-1',
            staffMember: 'Nurse A',
            staffSlot: 'Slot 1',
            startTime: new Date('2025-11-17T08:00:00'),
            endTime: new Date('2025-11-17T12:00:00'), // 4 hours
          }),
        ],
        unfilledSlots: [],
      });

      const analysis = findStaffByHourTarget(schedule, 20, 5);

      expect(analysis.underUtilized).toHaveLength(1);
      expect(analysis.underUtilized[0].staff).toBe('Nurse A');
      expect(analysis.underUtilized[0].hours).toBe(4);
      expect(analysis.underUtilized[0].difference).toBe(16); // 20 - 4
    });

    it('should identify on-target staff', () => {
      const schedule = createSchedule({
        id: 'schedule-1',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        assignments: [
          createStaffAssignment({
            id: 'assign-1',
            staffMember: 'Nurse A',
            staffSlot: 'Slot 1',
            startTime: new Date('2025-11-17T08:00:00'),
            endTime: new Date('2025-11-17T18:00:00'), // 10 hours
          }),
          createStaffAssignment({
            id: 'assign-2',
            staffMember: 'Nurse A',
            staffSlot: 'Slot 2',
            startTime: new Date('2025-11-18T08:00:00'),
            endTime: new Date('2025-11-18T18:00:00'), // 10 hours
          }),
        ],
        unfilledSlots: [],
      });

      // Target 20 hours, tolerance 5, so 15-25 is on target
      const analysis = findStaffByHourTarget(schedule, 20, 5);

      expect(analysis.onTarget).toHaveLength(1);
      expect(analysis.onTarget[0].staff).toBe('Nurse A');
      expect(analysis.onTarget[0].hours).toBe(20);
    });
  });

  describe('isSchedule', () => {
    it('should return true for valid schedule', () => {
      const schedule: Schedule = {
        id: 'test',
        scheduleStart: new Date(),
        scheduleEnd: new Date(),
        assignments: [],
        unfilledSlots: [],
      };

      expect(isSchedule(schedule)).toBe(true);
    });

    it('should return false for invalid schedule', () => {
      expect(isSchedule(null)).toBe(false);
      expect(isSchedule({})).toBe(false);
      expect(isSchedule({ id: 'test' })).toBe(false);
    });
  });
});
