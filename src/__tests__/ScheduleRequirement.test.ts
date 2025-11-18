import {
  ScheduleRequirement,
  createScheduleRequirement,
  validateScheduleRequirement,
  isScheduleRequirement,
  getTotalSlotCount,
  getTotalRequiredHours,
  getAllRequiredQualifications,
  getScheduleStats as getRequirementScheduleStats,
} from '../types/ScheduleRequirement';
import { createStaffSlot } from '../types/StaffSlot';

describe('ScheduleRequirement', () => {
  const testSlots = [
    createStaffSlot({
      name: 'Morning Nurse',
      startTime: new Date('2025-11-17T07:00:00'),
      endTime: new Date('2025-11-17T15:00:00'),
      requiredQualifications: ['RN', 'BLS'],
    }),
    createStaffSlot({
      name: 'Afternoon Nurse',
      startTime: new Date('2025-11-17T15:00:00'),
      endTime: new Date('2025-11-17T23:00:00'),
      requiredQualifications: ['RN', 'BLS'],
    }),
    createStaffSlot({
      name: 'ER Doctor',
      startTime: new Date('2025-11-17T08:00:00'),
      endTime: new Date('2025-11-17T20:00:00'),
      requiredQualifications: ['MD', 'Emergency Medicine'],
    }),
  ];

  describe('createScheduleRequirement', () => {
    it('should create a valid schedule requirement', () => {
      const requirement = createScheduleRequirement({
        id: 'test-schedule',
        name: 'Test Schedule',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      });

      expect(requirement.id).toBe('test-schedule');
      expect(requirement.name).toBe('Test Schedule');
      expect(requirement.staffSlots).toHaveLength(3);
    });

    it('should create requirement without name', () => {
      const requirement = createScheduleRequirement({
        id: 'test-schedule',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      });

      expect(requirement.name).toBeUndefined();
    });

    it('should throw error for end before start', () => {
      expect(() =>
        createScheduleRequirement({
          id: 'test-schedule',
          scheduleStart: new Date('2025-11-23T23:59:59'),
          scheduleEnd: new Date('2025-11-17T00:00:00'),
          staffSlots: testSlots,
        })
      ).toThrow('scheduleEnd must be after scheduleStart');
    });

    it('should throw error for empty id', () => {
      expect(() =>
        createScheduleRequirement({
          id: '',
          scheduleStart: new Date('2025-11-17T00:00:00'),
          scheduleEnd: new Date('2025-11-23T23:59:59'),
          staffSlots: testSlots,
        })
      ).toThrow('id cannot be empty');
    });
  });

  describe('getTotalSlotCount', () => {
    it('should return correct slot count', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      });

      expect(getTotalSlotCount(requirement)).toBe(3);
    });

    it('should return 0 for empty slots', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: [],
      });

      expect(getTotalSlotCount(requirement)).toBe(0);
    });
  });

  describe('getTotalRequiredHours', () => {
    it('should calculate total hours', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      });

      // Morning: 8 hours, Afternoon: 8 hours, ER Doctor: 12 hours = 28 total
      expect(getTotalRequiredHours(requirement)).toBe(28);
    });

    it('should return 0 for empty slots', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: [],
      });

      expect(getTotalRequiredHours(requirement)).toBe(0);
    });
  });

  describe('getAllRequiredQualifications', () => {
    it('should return all unique qualifications', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      });

      const quals = getAllRequiredQualifications(requirement);

      expect(quals).toHaveLength(4);
      expect(quals).toContain('RN');
      expect(quals).toContain('BLS');
      expect(quals).toContain('MD');
      expect(quals).toContain('Emergency Medicine');
    });

    it('should return sorted qualifications', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      });

      const quals = getAllRequiredQualifications(requirement);

      // Should be sorted alphabetically
      expect(quals).toEqual(['BLS', 'Emergency Medicine', 'MD', 'RN']);
    });

    it('should return empty array for no slots', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: [],
      });

      expect(getAllRequiredQualifications(requirement)).toEqual([]);
    });
  });

  describe('getRequirementScheduleStats', () => {
    it('should return comprehensive stats', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      });

      const stats = getRequirementScheduleStats(requirement);

      expect(stats.totalSlots).toBe(3);
      expect(stats.totalHours).toBe(28);
      expect(stats.uniqueQualifications).toBe(4);
      expect(stats.qualificationsList).toHaveLength(4);
      expect(stats.earliestSlot).toEqual(new Date('2025-11-17T07:00:00'));
      expect(stats.latestSlot).toEqual(new Date('2025-11-17T23:00:00'));
    });

    it('should calculate average slot duration', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      });

      const stats = getRequirementScheduleStats(requirement);

      // Total hours: 28, Total slots: 3, Average: 28/3 ≈ 9.33
      expect(stats.averageSlotDuration).toBeCloseTo(9.33, 1);
    });

    it('should handle empty slots', () => {
      const requirement = createScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: [],
      });

      const stats = getRequirementScheduleStats(requirement);

      expect(stats.totalSlots).toBe(0);
      expect(stats.totalHours).toBe(0);
      expect(stats.uniqueQualifications).toBe(0);
      expect(stats.earliestSlot).toBeNull();
      expect(stats.latestSlot).toBeNull();
      expect(stats.averageSlotDuration).toBe(0);
    });
  });

  describe('validateScheduleRequirement', () => {
    it('should return no errors for valid requirement', () => {
      const errors = validateScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      });

      expect(errors).toHaveLength(0);
    });

    it('should return error for invalid staffSlots', () => {
      const errors = validateScheduleRequirement({
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: 'not an array',
      });

      expect(errors.some(e => e.field === 'staffSlots')).toBe(true);
    });
  });

  describe('isScheduleRequirement', () => {
    it('should return true for valid requirement', () => {
      const requirement: ScheduleRequirement = {
        id: 'test',
        scheduleStart: new Date('2025-11-17T00:00:00'),
        scheduleEnd: new Date('2025-11-23T23:59:59'),
        staffSlots: testSlots,
      };

      expect(isScheduleRequirement(requirement)).toBe(true);
    });

    it('should return false for invalid requirement', () => {
      expect(isScheduleRequirement(null)).toBe(false);
      expect(isScheduleRequirement({})).toBe(false);
      expect(isScheduleRequirement({ id: 'test' })).toBe(false);
    });
  });
});
