import {
  StaffConstraint,
  PreferenceLevel,
  createStaffConstraint,
  validateStaffConstraint,
  isStaffConstraint,
  isPreferenceLevel,
  getConstraintDuration,
  isTimeInConstraint,
  doConstraintsOverlap,
  doesConstraintContainTimeSlot,
  doesTimeSlotOverlapConstraint,
  filterConstraintsByPreference,
  getUnavailableConstraints,
  getPreferredConstraints,
  hasUnavailableConflict,
  getTimeSlotPreference,
  calculatePreferenceScore,
  getConstraintStats,
} from '../types/StaffConstraint';

describe('StaffConstraint', () => {
  describe('createStaffConstraint', () => {
    it('should create a valid constraint', () => {
      const constraint = createStaffConstraint({
        startTime: new Date('2025-11-17T15:00:00'),
        endTime: new Date('2025-11-17T17:00:00'),
        preference: 'unavailable',
        reason: 'School pickup',
      });

      expect(constraint.preference).toBe('unavailable');
      expect(constraint.reason).toBe('School pickup');
    });

    it('should create constraint without reason', () => {
      const constraint = createStaffConstraint({
        startTime: new Date('2025-11-17T15:00:00'),
        endTime: new Date('2025-11-17T17:00:00'),
        preference: 'preferred',
      });

      expect(constraint.reason).toBeUndefined();
    });

    it('should throw error for end time before start time', () => {
      expect(() =>
        createStaffConstraint({
          startTime: new Date('2025-11-17T17:00:00'),
          endTime: new Date('2025-11-17T15:00:00'),
          preference: 'unavailable',
        })
      ).toThrow('endTime must be after startTime');
    });

    it('should throw error for invalid preference', () => {
      expect(() =>
        createStaffConstraint({
          startTime: new Date('2025-11-17T15:00:00'),
          endTime: new Date('2025-11-17T17:00:00'),
          preference: 'invalid' as PreferenceLevel,
        })
      ).toThrow('Invalid StaffConstraint');
    });
  });

  describe('isPreferenceLevel', () => {
    it('should return true for valid preference levels', () => {
      expect(isPreferenceLevel('unavailable')).toBe(true);
      expect(isPreferenceLevel('not_preferred')).toBe(true);
      expect(isPreferenceLevel('neutral')).toBe(true);
      expect(isPreferenceLevel('preferred')).toBe(true);
    });

    it('should return false for invalid preference levels', () => {
      expect(isPreferenceLevel('invalid')).toBe(false);
      expect(isPreferenceLevel('UNAVAILABLE')).toBe(false);
      expect(isPreferenceLevel('')).toBe(false);
      expect(isPreferenceLevel(null)).toBe(false);
      expect(isPreferenceLevel(123)).toBe(false);
    });
  });

  describe('getConstraintDuration', () => {
    it('should calculate duration correctly', () => {
      const constraint = createStaffConstraint({
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
        preference: 'preferred',
      });

      expect(getConstraintDuration(constraint)).toBe(8);
    });

    it('should handle fractional hours', () => {
      const constraint = createStaffConstraint({
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T10:30:00'),
        preference: 'preferred',
      });

      expect(getConstraintDuration(constraint)).toBe(2.5);
    });
  });

  describe('isTimeInConstraint', () => {
    const constraint = createStaffConstraint({
      startTime: new Date('2025-11-17T08:00:00'),
      endTime: new Date('2025-11-17T16:00:00'),
      preference: 'preferred',
    });

    it('should return true for time within constraint', () => {
      expect(isTimeInConstraint(constraint, new Date('2025-11-17T10:00:00'))).toBe(
        true
      );
      expect(isTimeInConstraint(constraint, new Date('2025-11-17T08:00:00'))).toBe(
        true
      );
    });

    it('should return false for time outside constraint', () => {
      expect(isTimeInConstraint(constraint, new Date('2025-11-17T07:00:00'))).toBe(
        false
      );
      expect(isTimeInConstraint(constraint, new Date('2025-11-17T16:00:00'))).toBe(
        false
      );
      expect(isTimeInConstraint(constraint, new Date('2025-11-17T17:00:00'))).toBe(
        false
      );
    });
  });

  describe('doConstraintsOverlap', () => {
    const constraint1 = createStaffConstraint({
      startTime: new Date('2025-11-17T08:00:00'),
      endTime: new Date('2025-11-17T12:00:00'),
      preference: 'preferred',
    });

    const constraint2 = createStaffConstraint({
      startTime: new Date('2025-11-17T10:00:00'),
      endTime: new Date('2025-11-17T14:00:00'),
      preference: 'preferred',
    });

    const constraint3 = createStaffConstraint({
      startTime: new Date('2025-11-17T13:00:00'),
      endTime: new Date('2025-11-17T15:00:00'),
      preference: 'preferred',
    });

    it('should return true for overlapping constraints', () => {
      expect(doConstraintsOverlap(constraint1, constraint2)).toBe(true);
    });

    it('should return false for non-overlapping constraints', () => {
      expect(doConstraintsOverlap(constraint1, constraint3)).toBe(false);
      expect(doConstraintsOverlap(constraint2, constraint3)).toBe(false);
    });
  });

  describe('doesConstraintContainTimeSlot', () => {
    const constraint = createStaffConstraint({
      startTime: new Date('2025-11-17T08:00:00'),
      endTime: new Date('2025-11-17T16:00:00'),
      preference: 'preferred',
    });

    it('should return true when constraint contains entire slot', () => {
      expect(
        doesConstraintContainTimeSlot(
          constraint,
          new Date('2025-11-17T10:00:00'),
          new Date('2025-11-17T14:00:00')
        )
      ).toBe(true);
    });

    it('should return true when slot matches constraint exactly', () => {
      expect(
        doesConstraintContainTimeSlot(
          constraint,
          new Date('2025-11-17T08:00:00'),
          new Date('2025-11-17T16:00:00')
        )
      ).toBe(true);
    });

    it('should return false when slot extends beyond constraint', () => {
      expect(
        doesConstraintContainTimeSlot(
          constraint,
          new Date('2025-11-17T07:00:00'),
          new Date('2025-11-17T14:00:00')
        )
      ).toBe(false);

      expect(
        doesConstraintContainTimeSlot(
          constraint,
          new Date('2025-11-17T10:00:00'),
          new Date('2025-11-17T17:00:00')
        )
      ).toBe(false);
    });
  });

  describe('hasUnavailableConflict', () => {
    const constraints: StaffConstraint[] = [
      createStaffConstraint({
        startTime: new Date('2025-11-17T15:00:00'),
        endTime: new Date('2025-11-17T17:00:00'),
        preference: 'unavailable',
        reason: 'School pickup',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
        preference: 'preferred',
      }),
    ];

    it('should return true when slot overlaps unavailable constraint', () => {
      expect(
        hasUnavailableConflict(
          new Date('2025-11-17T14:00:00'),
          new Date('2025-11-17T16:00:00'),
          constraints
        )
      ).toBe(true);
    });

    it('should return false when slot does not overlap unavailable constraint', () => {
      expect(
        hasUnavailableConflict(
          new Date('2025-11-17T08:00:00'),
          new Date('2025-11-17T12:00:00'),
          constraints
        )
      ).toBe(false);
    });

    it('should return false when overlapping only preferred constraints', () => {
      expect(
        hasUnavailableConflict(
          new Date('2025-11-17T10:00:00'),
          new Date('2025-11-17T14:00:00'),
          constraints
        )
      ).toBe(false);
    });
  });

  describe('getTimeSlotPreference', () => {
    const constraints: StaffConstraint[] = [
      createStaffConstraint({
        startTime: new Date('2025-11-17T15:00:00'),
        endTime: new Date('2025-11-17T17:00:00'),
        preference: 'unavailable',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
        preference: 'preferred',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T12:00:00'),
        endTime: new Date('2025-11-17T13:00:00'),
        preference: 'not_preferred',
      }),
    ];

    it('should return unavailable for unavailable constraint (most restrictive)', () => {
      expect(
        getTimeSlotPreference(
          new Date('2025-11-17T14:00:00'),
          new Date('2025-11-17T16:00:00'),
          constraints
        )
      ).toBe('unavailable');
    });

    it('should return not_preferred when it overlaps', () => {
      expect(
        getTimeSlotPreference(
          new Date('2025-11-17T12:00:00'),
          new Date('2025-11-17T13:00:00'),
          constraints
        )
      ).toBe('not_preferred');
    });

    it('should return preferred when only overlapping preferred', () => {
      expect(
        getTimeSlotPreference(
          new Date('2025-11-17T08:00:00'),
          new Date('2025-11-17T10:00:00'),
          constraints
        )
      ).toBe('preferred');
    });

    it('should return null when no constraints apply', () => {
      expect(
        getTimeSlotPreference(
          new Date('2025-11-17T20:00:00'),
          new Date('2025-11-17T22:00:00'),
          constraints
        )
      ).toBeNull();
    });
  });

  describe('calculatePreferenceScore', () => {
    const constraints: StaffConstraint[] = [
      createStaffConstraint({
        startTime: new Date('2025-11-17T15:00:00'),
        endTime: new Date('2025-11-17T17:00:00'),
        preference: 'unavailable',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T07:00:00'),
        endTime: new Date('2025-11-17T15:00:00'),
        preference: 'preferred',
      }),
    ];

    it('should return -100 for unavailable', () => {
      expect(
        calculatePreferenceScore(
          new Date('2025-11-17T16:00:00'),
          new Date('2025-11-17T18:00:00'),
          constraints
        )
      ).toBe(-100);
    });

    it('should return 10 for preferred', () => {
      expect(
        calculatePreferenceScore(
          new Date('2025-11-17T08:00:00'),
          new Date('2025-11-17T12:00:00'),
          constraints
        )
      ).toBe(10);
    });

    it('should return 0 for no constraints', () => {
      expect(
        calculatePreferenceScore(
          new Date('2025-11-17T20:00:00'),
          new Date('2025-11-17T22:00:00'),
          constraints
        )
      ).toBe(0);
    });
  });

  describe('filterConstraintsByPreference', () => {
    const constraints: StaffConstraint[] = [
      createStaffConstraint({
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T12:00:00'),
        preference: 'unavailable',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T12:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
        preference: 'preferred',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T16:00:00'),
        endTime: new Date('2025-11-17T20:00:00'),
        preference: 'preferred',
      }),
    ];

    it('should filter by unavailable', () => {
      const filtered = filterConstraintsByPreference(constraints, 'unavailable');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].preference).toBe('unavailable');
    });

    it('should filter by preferred', () => {
      const filtered = filterConstraintsByPreference(constraints, 'preferred');
      expect(filtered).toHaveLength(2);
      filtered.forEach((c) => expect(c.preference).toBe('preferred'));
    });
  });

  describe('getUnavailableConstraints', () => {
    const constraints: StaffConstraint[] = [
      createStaffConstraint({
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T12:00:00'),
        preference: 'unavailable',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T12:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
        preference: 'preferred',
      }),
    ];

    it('should return only unavailable constraints', () => {
      const unavailable = getUnavailableConstraints(constraints);
      expect(unavailable).toHaveLength(1);
      expect(unavailable[0].preference).toBe('unavailable');
    });
  });

  describe('getPreferredConstraints', () => {
    const constraints: StaffConstraint[] = [
      createStaffConstraint({
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T12:00:00'),
        preference: 'unavailable',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T12:00:00'),
        endTime: new Date('2025-11-17T16:00:00'),
        preference: 'preferred',
      }),
    ];

    it('should return only preferred constraints', () => {
      const preferred = getPreferredConstraints(constraints);
      expect(preferred).toHaveLength(1);
      expect(preferred[0].preference).toBe('preferred');
    });
  });

  describe('getConstraintStats', () => {
    const constraints: StaffConstraint[] = [
      createStaffConstraint({
        startTime: new Date('2025-11-17T08:00:00'),
        endTime: new Date('2025-11-17T12:00:00'),
        preference: 'unavailable',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T12:00:00'),
        endTime: new Date('2025-11-17T20:00:00'),
        preference: 'preferred',
      }),
      createStaffConstraint({
        startTime: new Date('2025-11-17T20:00:00'),
        endTime: new Date('2025-11-17T22:00:00'),
        preference: 'not_preferred',
      }),
    ];

    it('should calculate total constraints', () => {
      const stats = getConstraintStats(constraints);
      expect(stats.totalConstraints).toBe(3);
    });

    it('should calculate total hours', () => {
      const stats = getConstraintStats(constraints);
      expect(stats.totalHours).toBe(14); // 4 + 8 + 2
    });

    it('should calculate hours by preference', () => {
      const stats = getConstraintStats(constraints);
      expect(stats.unavailableHours).toBe(4);
      expect(stats.preferredHours).toBe(8);
      expect(stats.notPreferredHours).toBe(2);
    });

    it('should find earliest and latest constraints', () => {
      const stats = getConstraintStats(constraints);
      expect(stats.earliestConstraint).toEqual(new Date('2025-11-17T08:00:00'));
      expect(stats.latestConstraint).toEqual(new Date('2025-11-17T22:00:00'));
    });

    it('should handle empty constraints', () => {
      const stats = getConstraintStats([]);
      expect(stats.totalConstraints).toBe(0);
      expect(stats.totalHours).toBe(0);
      expect(stats.earliestConstraint).toBeNull();
      expect(stats.latestConstraint).toBeNull();
    });
  });
});
