/**
 * Example usage of StaffConstraint data model with StaffMember.
 */

import {
  StaffMember,
  StaffConstraint,
  createStaffMember,
  createStaffConstraint,
  getConstraintStats,
  getConstraintsSummary,
  hasUnavailableConflict,
  getTimeSlotPreference,
  calculatePreferenceScore,
  groupConstraintsByPreference,
  getUnavailableConstraints,
  getPreferredConstraints,
} from '../types';

console.log('='.repeat(60));
console.log('STAFF CONSTRAINT EXAMPLES');
console.log('='.repeat(60));

// Example 1: Creating individual constraints
console.log('\n1. Creating Individual Constraints\n');

const unavailableConstraint: StaffConstraint = {
  startTime: new Date('2025-11-17T15:00:00'),
  endTime: new Date('2025-11-17T17:00:00'),
  preference: 'unavailable',
  reason: 'School pickup',
};

const preferredConstraint = createStaffConstraint({
  startTime: new Date('2025-11-18T07:00:00'),
  endTime: new Date('2025-11-18T15:00:00'),
  preference: 'preferred',
  reason: 'Prefers morning shifts',
});

const notPreferredConstraint = createStaffConstraint({
  startTime: new Date('2025-11-19T23:00:00'),
  endTime: new Date('2025-11-20T07:00:00'),
  preference: 'not_preferred',
  reason: 'Prefers not to work nights',
});

console.log('Unavailable:', unavailableConstraint);
console.log('Preferred:', preferredConstraint);
console.log('Not Preferred:', notPreferredConstraint);

// Example 2: Creating a staff member with constraints
console.log('\n2. Staff Member with Constraints\n');

const nurseWithConstraints = createStaffMember({
  name: 'Nurse Emily Chen',
  rank: 3,
  startOfService: new Date('2020-06-01'),
  qualifications: ['RN', 'BLS', 'Pediatrics'],
  constraints: [
    // Unavailable for school pickup every weekday
    {
      startTime: new Date('2025-11-17T15:00:00'),
      endTime: new Date('2025-11-17T17:00:00'),
      preference: 'unavailable',
      reason: 'School pickup - Monday',
    },
    {
      startTime: new Date('2025-11-18T15:00:00'),
      endTime: new Date('2025-11-18T17:00:00'),
      preference: 'unavailable',
      reason: 'School pickup - Tuesday',
    },
    {
      startTime: new Date('2025-11-19T15:00:00'),
      endTime: new Date('2025-11-19T17:00:00'),
      preference: 'unavailable',
      reason: 'School pickup - Wednesday',
    },
    // Prefers morning shifts
    {
      startTime: new Date('2025-11-17T07:00:00'),
      endTime: new Date('2025-11-17T15:00:00'),
      preference: 'preferred',
      reason: 'Prefers mornings',
    },
    {
      startTime: new Date('2025-11-18T07:00:00'),
      endTime: new Date('2025-11-18T15:00:00'),
      preference: 'preferred',
      reason: 'Prefers mornings',
    },
    // Not preferred - night shifts
    {
      startTime: new Date('2025-11-17T23:00:00'),
      endTime: new Date('2025-11-18T07:00:00'),
      preference: 'not_preferred',
      reason: 'Prefers to avoid nights',
    },
  ],
});

console.log(`Staff: ${nurseWithConstraints.name}`);
console.log(`Constraints: ${nurseWithConstraints.constraints?.length || 0}`);

// Example 3: Analyzing constraints
console.log('\n3. Constraint Statistics\n');

if (nurseWithConstraints.constraints) {
  const stats = getConstraintStats(nurseWithConstraints.constraints);
  console.log('Stats:', stats);
  console.log('\n' + getConstraintsSummary(nurseWithConstraints.constraints));
}

// Example 4: Checking slot availability
console.log('\n4. Checking Time Slot Availability\n');

const proposedSlots = [
  {
    name: 'Monday Morning',
    start: new Date('2025-11-17T07:00:00'),
    end: new Date('2025-11-17T15:00:00'),
  },
  {
    name: 'Monday Afternoon',
    start: new Date('2025-11-17T15:00:00'),
    end: new Date('2025-11-17T23:00:00'),
  },
  {
    name: 'Monday Night',
    start: new Date('2025-11-17T23:00:00'),
    end: new Date('2025-11-18T07:00:00'),
  },
  {
    name: 'Tuesday Morning',
    start: new Date('2025-11-18T07:00:00'),
    end: new Date('2025-11-18T15:00:00'),
  },
];

if (nurseWithConstraints.constraints) {
  proposedSlots.forEach((slot) => {
    const hasConflict = hasUnavailableConflict(
      slot.start,
      slot.end,
      nurseWithConstraints.constraints!
    );
    const preference = getTimeSlotPreference(
      slot.start,
      slot.end,
      nurseWithConstraints.constraints!
    );
    const score = calculatePreferenceScore(
      slot.start,
      slot.end,
      nurseWithConstraints.constraints!
    );

    console.log(`\n${slot.name}:`);
    console.log(`  Has Unavailable Conflict: ${hasConflict}`);
    console.log(`  Preference: ${preference || 'none'}`);
    console.log(`  Score: ${score}`);
  });
}

// Example 5: Creating staff with different constraint patterns
console.log('\n5. Different Constraint Patterns\n');

// Doctor who prefers day shifts
const doctorDayShift = createStaffMember({
  name: 'Dr. Michael Torres',
  rank: 7,
  startOfService: new Date('2015-01-10'),
  qualifications: ['MD', 'Surgery', 'Board Certified'],
  constraints: [
    {
      startTime: new Date('2025-11-17T06:00:00'),
      endTime: new Date('2025-11-17T18:00:00'),
      preference: 'preferred',
      reason: 'Day shift preference',
    },
    {
      startTime: new Date('2025-11-18T06:00:00'),
      endTime: new Date('2025-11-18T18:00:00'),
      preference: 'preferred',
      reason: 'Day shift preference',
    },
  ],
});

// Paramedic with medical appointment
const paramedicWithAppointment = createStaffMember({
  name: 'Paramedic James Brown',
  rank: 2,
  startOfService: new Date('2021-11-05'),
  qualifications: ['EMT-P', 'BLS', 'ACLS'],
  constraints: [
    {
      startTime: new Date('2025-11-19T10:00:00'),
      endTime: new Date('2025-11-19T12:00:00'),
      preference: 'unavailable',
      reason: 'Medical appointment',
    },
  ],
});

// Night shift specialist
const nightShiftSpecialist = createStaffMember({
  name: 'Nurse Patricia Williams',
  rank: 4,
  startOfService: new Date('2019-08-20'),
  qualifications: ['RN', 'ICU', 'CCRN'],
  constraints: [
    {
      startTime: new Date('2025-11-17T19:00:00'),
      endTime: new Date('2025-11-18T07:00:00'),
      preference: 'preferred',
      reason: 'Night shift specialist',
    },
    {
      startTime: new Date('2025-11-18T19:00:00'),
      endTime: new Date('2025-11-19T07:00:00'),
      preference: 'preferred',
      reason: 'Night shift specialist',
    },
  ],
});

const staffList = [doctorDayShift, paramedicWithAppointment, nightShiftSpecialist];

console.log('Staff with constraints:');
staffList.forEach((staff) => {
  console.log(`\n  ${staff.name}:`);
  console.log(`    Constraints: ${staff.constraints?.length || 0}`);
  if (staff.constraints && staff.constraints.length > 0) {
    const byPreference = groupConstraintsByPreference(staff.constraints);
    byPreference.forEach((constraints, preference) => {
      console.log(`      ${preference}: ${constraints.length}`);
    });
  }
});

// Example 6: Filtering constraints
console.log('\n6. Filtering Constraints\n');

if (nurseWithConstraints.constraints) {
  const unavailable = getUnavailableConstraints(nurseWithConstraints.constraints);
  const preferred = getPreferredConstraints(nurseWithConstraints.constraints);

  console.log(`${nurseWithConstraints.name}:`);
  console.log(`  Unavailable periods: ${unavailable.length}`);
  unavailable.forEach((c) => {
    console.log(
      `    - ${c.startTime.toLocaleString()} to ${c.endTime.toLocaleString()}: ${c.reason}`
    );
  });

  console.log(`  Preferred periods: ${preferred.length}`);
  preferred.forEach((c) => {
    console.log(
      `    - ${c.startTime.toLocaleString()} to ${c.endTime.toLocaleString()}: ${c.reason}`
    );
  });
}

// Example 7: Scheduling decision based on constraints
console.log('\n7. Scheduling Decision Example\n');

interface SlotCandidate {
  name: string;
  staff: StaffMember;
  slotStart: Date;
  slotEnd: Date;
  score: number;
  canSchedule: boolean;
}

const testSlot = {
  start: new Date('2025-11-17T07:00:00'),
  end: new Date('2025-11-17T15:00:00'),
};

const candidates: SlotCandidate[] = [
  nurseWithConstraints,
  doctorDayShift,
  nightShiftSpecialist,
].map((staff) => {
  const constraints = staff.constraints || [];
  const hasConflict = hasUnavailableConflict(testSlot.start, testSlot.end, constraints);
  const score = calculatePreferenceScore(testSlot.start, testSlot.end, constraints);

  return {
    name: staff.name,
    staff,
    slotStart: testSlot.start,
    slotEnd: testSlot.end,
    score,
    canSchedule: !hasConflict,
  };
});

console.log(`Candidates for Monday Morning (7am-3pm):\n`);
candidates
  .sort((a, b) => b.score - a.score)
  .forEach((candidate) => {
    console.log(`  ${candidate.name}:`);
    console.log(`    Can Schedule: ${candidate.canSchedule}`);
    console.log(`    Preference Score: ${candidate.score}`);
    console.log(
      `    Recommendation: ${
        !candidate.canSchedule
          ? 'CANNOT SCHEDULE (unavailable)'
          : candidate.score > 0
          ? 'GOOD CHOICE (preferred time)'
          : candidate.score < 0
          ? 'POOR CHOICE (not preferred)'
          : 'NEUTRAL'
      }`
    );
  });

// Example 8: Complex constraint scenario
console.log('\n8. Complex Constraint Scenario\n');

const flexibleStaff = createStaffMember({
  name: 'Nurse Sarah Martinez',
  rank: 5,
  startOfService: new Date('2017-03-15'),
  qualifications: ['RN', 'Emergency Medicine', 'ACLS'],
  constraints: [
    // Unavailable Wednesday mornings
    {
      startTime: new Date('2025-11-19T08:00:00'),
      endTime: new Date('2025-11-19T12:00:00'),
      preference: 'unavailable',
      reason: 'Continuing education class',
    },
    // Prefers early morning shifts
    {
      startTime: new Date('2025-11-17T05:00:00'),
      endTime: new Date('2025-11-17T13:00:00'),
      preference: 'preferred',
      reason: 'Morning person',
    },
    {
      startTime: new Date('2025-11-18T05:00:00'),
      endTime: new Date('2025-11-18T13:00:00'),
      preference: 'preferred',
      reason: 'Morning person',
    },
    // Neutral for afternoons
    {
      startTime: new Date('2025-11-17T13:00:00'),
      endTime: new Date('2025-11-17T21:00:00'),
      preference: 'neutral',
    },
    // Not preferred for late nights
    {
      startTime: new Date('2025-11-17T21:00:00'),
      endTime: new Date('2025-11-18T05:00:00'),
      preference: 'not_preferred',
      reason: 'Prefer to avoid late nights',
    },
  ],
});

console.log(`${flexibleStaff.name}:`);
if (flexibleStaff.constraints) {
  console.log(getConstraintsSummary(flexibleStaff.constraints));
}

console.log('\n' + '='.repeat(60));
console.log('END OF EXAMPLES');
console.log('='.repeat(60));
