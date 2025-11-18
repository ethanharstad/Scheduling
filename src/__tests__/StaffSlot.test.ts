import {
  StaffSlot,
  createStaffSlot,
  validateStaffSlot,
  isStaffSlot,
  getSlotDuration,
  isSlotInTimeWindow,
  doSlotsOverlap,
  groupSlotsByDate,
  sortSlotsByStartTime,
  filterSlotsByQualification,
} from '../types/StaffSlot';

describe('StaffSlot', () => {
  describe('createStaffSlot', () => {
    it('should create a valid staff slot', () => {
      const slot = createStaffSlot({
        name: 'Morning Shift Nurse',
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
        requiredQualifications: ['RN', 'BLS'],
      });

      expect(slot.name).toBe('Morning Shift Nurse');
      expect(slot.requiredQualifications).toEqual(['RN', 'BLS']);
    });

    it('should throw error for end time before start time', () => {
      expect(() =>
        createStaffSlot({
          name: 'Invalid Slot',
          startTime: new Date('2025-11-17T15:00:00'),
          endTime: new Date('2025-11-17T07:00:00'),
          requiredQualifications: ['RN'],
        })
      ).toThrow('endTime must be after startTime');
    });

    it('should throw error for empty name', () => {
      expect(() =>
        createStaffSlot({
          name: '',
          startTime: new Date('2025-11-17T07:00:00'),
          endTime: new Date('2025-11-17T15:00:00'),
          requiredQualifications: ['RN'],
        })
      ).toThrow('name cannot be empty');
    });
  });

  describe('getSlotDuration', () => {
    it('should calculate 8-hour shift', () => {
      const slot = createStaffSlot({
        name: 'Morning Shift',
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
        requiredQualifications: ['RN'],
      });

      expect(getSlotDuration(slot)).toBe(8);
    });

    it('should calculate 12-hour shift', () => {
      const slot = createStaffSlot({
        name: 'Day Shift',
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T19:00:00'),
        requiredQualifications: ['RN'],
      });

      expect(getSlotDuration(slot)).toBe(12);
    });

    it('should handle fractional hours', () => {
      const slot = createStaffSlot({
        name: 'Partial Shift',
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T09:30:00'),
        requiredQualifications: ['RN'],
      });

      expect(getSlotDuration(slot)).toBe(2.5);
    });
  });

  describe('isSlotInTimeWindow', () => {
    const slot = createStaffSlot({
      name: 'Test Slot',
      startTime: new Date('2025-11-17T10:00:00'),
      endTime: new Date('2025-11-17T14:00:00'),
      requiredQualifications: ['RN'],
    });

    it('should return true when slot is within window', () => {
      expect(
        isSlotInTimeWindow(
          slot,
          new Date('2025-11-17T00:00:00'),
          new Date('2025-11-17T23:59:59')
        )
      ).toBe(true);
    });

    it('should return false when slot starts before window', () => {
      expect(
        isSlotInTimeWindow(
          slot,
          new Date('2025-11-17T11:00:00'),
          new Date('2025-11-17T23:59:59')
        )
      ).toBe(false);
    });

    it('should return false when slot ends after window', () => {
      expect(
        isSlotInTimeWindow(
          slot,
          new Date('2025-11-17T00:00:00'),
          new Date('2025-11-17T12:00:00')
        )
      ).toBe(false);
    });
  });

  describe('doSlotsOverlap', () => {
    const slot1 = createStaffSlot({
      name: 'Slot 1',
      startTime: new Date('2025-11-17T08:00:00'),
      endTime: new Date('2025-11-17T12:00:00'),
      requiredQualifications: ['RN'],
    });

    const slot2 = createStaffSlot({
      name: 'Slot 2',
      startTime: new Date('2025-11-17T10:00:00'),
      endTime: new Date('2025-11-17T14:00:00'),
      requiredQualifications: ['RN'],
    });

    const slot3 = createStaffSlot({
      name: 'Slot 3',
      startTime: new Date('2025-11-17T13:00:00'),
      endTime: new Date('2025-11-17T15:00:00'),
      requiredQualifications: ['RN'],
    });

    it('should return true for overlapping slots', () => {
      expect(doSlotsOverlap(slot1, slot2)).toBe(true);
    });

    it('should return false for non-overlapping slots', () => {
      expect(doSlotsOverlap(slot1, slot3)).toBe(false);
    });

    it('should return false for adjacent slots', () => {
      const adjacent1 = createStaffSlot({
        name: 'Adjacent 1',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T12:00:00'),
        requiredQualifications: ['RN'],
      });

      const adjacent2 = createStaffSlot({
        name: 'Adjacent 2',
        startTime: new Date('2025-11-17T12:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
        requiredQualifications: ['RN'],
      });

      expect(doSlotsOverlap(adjacent1, adjacent2)).toBe(false);
    });
  });

  describe('groupSlotsByDate', () => {
    const slots: StaffSlot[] = [
      createStaffSlot({
        name: 'Monday Slot 1',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
        requiredQualifications: ['RN'],
      }),
      createStaffSlot({
        name: 'Monday Slot 2',
        startTime: new Date('2025-11-17T16:00:00'),
        endTime: new Date('2025-11-18T00:00:00'),
        requiredQualifications: ['RN'],
      }),
      createStaffSlot({
        name: 'Tuesday Slot',
        startTime: new Date('2025-11-18T08:00:00'),
        endTime: new Date('2025-11-18T16:00:00'),
        requiredQualifications: ['RN'],
      }),
    ];

    it('should group slots by date', () => {
      const grouped = groupSlotsByDate(slots);

      expect(grouped.size).toBe(2);
      expect(grouped.get('2025-11-17')).toHaveLength(2);
      expect(grouped.get('2025-11-18')).toHaveLength(1);
    });
  });

  describe('sortSlotsByStartTime', () => {
    const slots: StaffSlot[] = [
      createStaffSlot({
        name: 'Afternoon',
        startTime: new Date('2025-11-17T15:00:00'),
        endTime: new Date('2025-11-17T23:00:00'),
        requiredQualifications: ['RN'],
      }),
      createStaffSlot({
        name: 'Morning',
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
        requiredQualifications: ['RN'],
      }),
      createStaffSlot({
        name: 'Night',
        startTime: new Date('2025-11-17T23:00:00'),
        endTime: new Date('2025-11-18T07:00:00'),
        requiredQualifications: ['RN'],
      }),
    ];

    it('should sort slots by start time', () => {
      const sorted = sortSlotsByStartTime(slots);

      expect(sorted[0].name).toBe('Morning');
      expect(sorted[1].name).toBe('Afternoon');
      expect(sorted[2].name).toBe('Night');
    });

    it('should not modify original array', () => {
      const originalOrder = slots.map(s => s.name);
      sortSlotsByStartTime(slots);

      expect(slots.map(s => s.name)).toEqual(originalOrder);
    });
  });

  describe('filterSlotsByQualification', () => {
    const slots: StaffSlot[] = [
      createStaffSlot({
        name: 'RN Slot',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
        requiredQualifications: ['RN', 'BLS'],
      }),
      createStaffSlot({
        name: 'MD Slot',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
        requiredQualifications: ['MD', 'Emergency Medicine'],
      }),
      createStaffSlot({
        name: 'ICU Slot',
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
        requiredQualifications: ['RN', 'ICU'],
      }),
    ];

    it('should filter slots requiring RN', () => {
      const rnSlots = filterSlotsByQualification(slots, 'RN');

      expect(rnSlots).toHaveLength(2);
      expect(rnSlots[0].name).toBe('RN Slot');
      expect(rnSlots[1].name).toBe('ICU Slot');
    });

    it('should filter slots requiring MD', () => {
      const mdSlots = filterSlotsByQualification(slots, 'MD');

      expect(mdSlots).toHaveLength(1);
      expect(mdSlots[0].name).toBe('MD Slot');
    });

    it('should return empty array for non-existent qualification', () => {
      const filtered = filterSlotsByQualification(slots, 'NonExistent');

      expect(filtered).toHaveLength(0);
    });
  });
});
