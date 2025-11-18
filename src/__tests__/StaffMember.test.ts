import {
  StaffMember,
  createStaffMember,
  validateStaffMember,
  isStaffMember,
  calculateYearsOfService,
  hasQualification,
  hasAllQualifications,
  hasAnyQualification,
} from '../types/StaffMember';

describe('StaffMember', () => {
  describe('createStaffMember', () => {
    it('should create a valid staff member', () => {
      const staff = createStaffMember({
        name: 'Dr. Sarah Johnson',
        rank: 5,
        startOfService: new Date('2018-03-15'),
        qualifications: ['MD', 'Emergency Medicine'],
      });

      expect(staff.name).toBe('Dr. Sarah Johnson');
      expect(staff.rank).toBe(5);
      expect(staff.qualifications).toEqual(['MD', 'Emergency Medicine']);
    });

    it('should create a staff member with constraints', () => {
      const staff = createStaffMember({
        name: 'Nurse Emily',
        rank: 3,
        startOfService: new Date('2020-01-01'),
        qualifications: ['RN'],
        constraints: [
          {
            startTime: new Date('2025-11-17T15:00:00'),
            endTime: new Date('2025-11-17T17:00:00'),
            preference: 'unavailable',
            reason: 'School pickup',
          },
        ],
      });

      expect(staff.constraints).toBeDefined();
      expect(staff.constraints?.length).toBe(1);
    });

    it('should throw error for invalid name', () => {
      expect(() =>
        createStaffMember({
          name: '',
          rank: 3,
          startOfService: new Date(),
          qualifications: ['RN'],
        })
      ).toThrow('Invalid StaffMember');
    });

    it('should throw error for negative rank', () => {
      expect(() =>
        createStaffMember({
          name: 'John Doe',
          rank: -1,
          startOfService: new Date(),
          qualifications: ['RN'],
        })
      ).toThrow('rank cannot be negative');
    });

    it('should throw error for non-finite rank', () => {
      expect(() =>
        createStaffMember({
          name: 'John Doe',
          rank: NaN,
          startOfService: new Date(),
          qualifications: ['RN'],
        })
      ).toThrow('rank must be a finite number');
    });

    it('should create a copy of qualifications array', () => {
      const quals = ['RN', 'BLS'];
      const staff = createStaffMember({
        name: 'Nurse Jane',
        rank: 2,
        startOfService: new Date(),
        qualifications: quals,
      });

      // Modify original array
      quals.push('ACLS');

      // Staff member's qualifications should not change
      expect(staff.qualifications).toEqual(['RN', 'BLS']);
    });
  });

  describe('validateStaffMember', () => {
    it('should return no errors for valid staff member', () => {
      const errors = validateStaffMember({
        name: 'Dr. Smith',
        rank: 4,
        startOfService: new Date(),
        qualifications: ['MD'],
      });

      expect(errors).toHaveLength(0);
    });

    it('should return error for missing name', () => {
      const errors = validateStaffMember({
        rank: 4,
        startOfService: new Date(),
        qualifications: ['MD'],
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should return error for empty name', () => {
      const errors = validateStaffMember({
        name: '   ',
        rank: 4,
        startOfService: new Date(),
        qualifications: ['MD'],
      });

      expect(errors.some((e) => e.field === 'name' && e.message.includes('empty'))).toBe(
        true
      );
    });

    it('should return error for invalid rank type', () => {
      const errors = validateStaffMember({
        name: 'Dr. Smith',
        rank: '4',
        startOfService: new Date(),
        qualifications: ['MD'],
      });

      expect(errors.some((e) => e.field === 'rank')).toBe(true);
    });

    it('should return error for non-array qualifications', () => {
      const errors = validateStaffMember({
        name: 'Dr. Smith',
        rank: 4,
        startOfService: new Date(),
        qualifications: 'MD',
      });

      expect(errors.some((e) => e.field === 'qualifications')).toBe(true);
    });

    it('should return error for non-string qualification items', () => {
      const errors = validateStaffMember({
        name: 'Dr. Smith',
        rank: 4,
        startOfService: new Date(),
        qualifications: ['MD', 123],
      });

      expect(errors.some((e) => e.field.includes('qualifications['))).toBe(true);
    });
  });

  describe('isStaffMember', () => {
    it('should return true for valid staff member', () => {
      const staff: StaffMember = {
        name: 'Dr. Smith',
        rank: 4,
        startOfService: new Date(),
        qualifications: ['MD'],
      };

      expect(isStaffMember(staff)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isStaffMember(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isStaffMember(undefined)).toBe(false);
    });

    it('should return false for object missing required fields', () => {
      expect(
        isStaffMember({
          name: 'Dr. Smith',
          rank: 4,
        })
      ).toBe(false);
    });

    it('should return true for staff with constraints', () => {
      const staff: StaffMember = {
        name: 'Nurse Jane',
        rank: 3,
        startOfService: new Date(),
        qualifications: ['RN'],
        constraints: [],
      };

      expect(isStaffMember(staff)).toBe(true);
    });

    it('should return false if constraints is not an array', () => {
      expect(
        isStaffMember({
          name: 'Nurse Jane',
          rank: 3,
          startOfService: new Date(),
          qualifications: ['RN'],
          constraints: 'invalid',
        })
      ).toBe(false);
    });
  });

  describe('calculateYearsOfService', () => {
    it('should calculate years of service correctly', () => {
      const staff = createStaffMember({
        name: 'Dr. Smith',
        rank: 4,
        startOfService: new Date('2020-01-01'),
        qualifications: ['MD'],
      });

      const years = calculateYearsOfService(staff, new Date('2025-01-01'));

      expect(years).toBeCloseTo(5, 1);
    });

    it('should return 0 for future start date', () => {
      const staff = createStaffMember({
        name: 'Dr. Smith',
        rank: 4,
        startOfService: new Date('2030-01-01'),
        qualifications: ['MD'],
      });

      const years = calculateYearsOfService(staff, new Date('2025-01-01'));

      expect(years).toBe(0);
    });

    it('should use current date if no date provided', () => {
      const staff = createStaffMember({
        name: 'Dr. Smith',
        rank: 4,
        startOfService: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        qualifications: ['MD'],
      });

      const years = calculateYearsOfService(staff);

      expect(years).toBeGreaterThan(0.9);
      expect(years).toBeLessThan(1.1);
    });

    it('should handle leap years', () => {
      const staff = createStaffMember({
        name: 'Dr. Smith',
        rank: 4,
        startOfService: new Date('2020-02-29'), // Leap year
        qualifications: ['MD'],
      });

      const years = calculateYearsOfService(staff, new Date('2024-02-29'));

      expect(years).toBeCloseTo(4, 1);
    });
  });

  describe('hasQualification', () => {
    const staff = createStaffMember({
      name: 'Nurse Jane',
      rank: 3,
      startOfService: new Date(),
      qualifications: ['RN', 'BLS', 'ACLS'],
    });

    it('should return true for existing qualification', () => {
      expect(hasQualification(staff, 'RN')).toBe(true);
      expect(hasQualification(staff, 'BLS')).toBe(true);
      expect(hasQualification(staff, 'ACLS')).toBe(true);
    });

    it('should return false for non-existing qualification', () => {
      expect(hasQualification(staff, 'MD')).toBe(false);
      expect(hasQualification(staff, 'ICU')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(hasQualification(staff, 'rn')).toBe(false);
      expect(hasQualification(staff, 'Rn')).toBe(false);
    });
  });

  describe('hasAllQualifications', () => {
    const staff = createStaffMember({
      name: 'Nurse Jane',
      rank: 3,
      startOfService: new Date(),
      qualifications: ['RN', 'BLS', 'ACLS', 'Pediatrics'],
    });

    it('should return true when staff has all qualifications', () => {
      expect(hasAllQualifications(staff, ['RN', 'BLS'])).toBe(true);
      expect(hasAllQualifications(staff, ['RN'])).toBe(true);
      expect(hasAllQualifications(staff, ['RN', 'BLS', 'ACLS'])).toBe(true);
    });

    it('should return false when staff missing any qualification', () => {
      expect(hasAllQualifications(staff, ['RN', 'MD'])).toBe(false);
      expect(hasAllQualifications(staff, ['ICU'])).toBe(false);
    });

    it('should return true for empty qualification list', () => {
      expect(hasAllQualifications(staff, [])).toBe(true);
    });

    it('should return true when checking all staff qualifications', () => {
      expect(hasAllQualifications(staff, ['RN', 'BLS', 'ACLS', 'Pediatrics'])).toBe(
        true
      );
    });
  });

  describe('hasAnyQualification', () => {
    const staff = createStaffMember({
      name: 'Nurse Jane',
      rank: 3,
      startOfService: new Date(),
      qualifications: ['RN', 'BLS', 'ACLS'],
    });

    it('should return true when staff has at least one qualification', () => {
      expect(hasAnyQualification(staff, ['RN', 'MD'])).toBe(true);
      expect(hasAnyQualification(staff, ['MD', 'BLS', 'ICU'])).toBe(true);
      expect(hasAnyQualification(staff, ['ACLS'])).toBe(true);
    });

    it('should return false when staff has none of the qualifications', () => {
      expect(hasAnyQualification(staff, ['MD', 'DO'])).toBe(false);
      expect(hasAnyQualification(staff, ['ICU', 'Surgery'])).toBe(false);
    });

    it('should return false for empty qualification list', () => {
      expect(hasAnyQualification(staff, [])).toBe(false);
    });

    it('should return true when checking any staff qualification', () => {
      expect(hasAnyQualification(staff, ['RN', 'BLS', 'ACLS'])).toBe(true);
    });
  });
});
