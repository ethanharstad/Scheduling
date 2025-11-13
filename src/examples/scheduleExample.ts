/**
 * Example usage of StaffAssignment and Schedule data models.
 */

import {
  StaffMember,
  StaffSlot,
  StaffAssignment,
  Schedule,
  createStaffMember,
  createStaffSlot,
  createStaffAssignment,
  createSchedule,
  getScheduleSummary,
  getScheduleStats,
  findScheduleConflicts,
  isScheduleValid,
  getAssignedStaff,
  getHoursByStaff,
  findStaffByHourTarget,
  groupAssignmentsByDate,
  calculateStaffHours,
} from '../types';

console.log('='.repeat(60));
console.log('SCHEDULE AND ASSIGNMENT EXAMPLES');
console.log('='.repeat(60));

// Example 1: Creating staff members
console.log('\n1. Creating Staff Members\n');

const staff: StaffMember[] = [
  createStaffMember({
    name: 'Dr. Sarah Johnson',
    rank: 5,
    startOfService: new Date('2018-03-15'),
    qualifications: ['MD', 'Board Certified', 'Emergency Medicine'],
  }),
  createStaffMember({
    name: 'Nurse Emily Chen',
    rank: 3,
    startOfService: new Date('2020-06-01'),
    qualifications: ['RN', 'BLS', 'Pediatrics'],
  }),
  createStaffMember({
    name: 'Nurse Patricia Williams',
    rank: 4,
    startOfService: new Date('2019-08-20'),
    qualifications: ['RN', 'ICU', 'CCRN'],
  }),
];

console.log(`Created ${staff.length} staff members`);

// Example 2: Creating staff slots
console.log('\n2. Creating Staff Slots\n');

const slots: StaffSlot[] = [
  createStaffSlot({
    name: 'Monday Morning ER',
    startTime: new Date('2025-11-17T07:00:00'),
    endTime: new Date('2025-11-17T15:00:00'),
    requiredQualifications: ['MD', 'Emergency Medicine'],
  }),
  createStaffSlot({
    name: 'Monday Morning Nurse',
    startTime: new Date('2025-11-17T07:00:00'),
    endTime: new Date('2025-11-17T15:00:00'),
    requiredQualifications: ['RN', 'BLS'],
  }),
  createStaffSlot({
    name: 'Monday Afternoon Nurse',
    startTime: new Date('2025-11-17T15:00:00'),
    endTime: new Date('2025-11-17T23:00:00'),
    requiredQualifications: ['RN', 'BLS'],
  }),
  createStaffSlot({
    name: 'Tuesday Morning ICU',
    startTime: new Date('2025-11-18T07:00:00'),
    endTime: new Date('2025-11-18T15:00:00'),
    requiredQualifications: ['RN', 'ICU'],
  }),
];

console.log(`Created ${slots.length} staff slots`);

// Example 3: Creating staff assignments
console.log('\n3. Creating Staff Assignments\n');

const assignments: StaffAssignment[] = [
  createStaffAssignment({
    id: 'assignment-1',
    staffMember: staff[0], // Dr. Sarah Johnson
    staffSlot: slots[0], // Monday Morning ER
    startTime: new Date('2025-11-17T07:00:00'),
    endTime: new Date('2025-11-17T15:00:00'),
    metadata: {
      assignedAt: new Date(),
      preferenceScore: 10,
      notes: 'Preferred shift for staff member',
    },
  }),
  createStaffAssignment({
    id: 'assignment-2',
    staffMember: staff[1], // Nurse Emily Chen
    staffSlot: slots[1], // Monday Morning Nurse
    startTime: new Date('2025-11-17T07:00:00'),
    endTime: new Date('2025-11-17T15:00:00'),
    metadata: {
      assignedAt: new Date(),
      preferenceScore: 0,
    },
  }),
  createStaffAssignment({
    id: 'assignment-3',
    staffMember: staff[1], // Nurse Emily Chen
    staffSlot: slots[2], // Monday Afternoon Nurse
    startTime: new Date('2025-11-17T15:00:00'),
    endTime: new Date('2025-11-17T23:00:00'),
    metadata: {
      assignedAt: new Date(),
      preferenceScore: -10,
      notes: 'Not preferred but available',
    },
  }),
  createStaffAssignment({
    id: 'assignment-4',
    staffMember: staff[2], // Nurse Patricia Williams
    staffSlot: slots[3], // Tuesday Morning ICU
    startTime: new Date('2025-11-18T07:00:00'),
    endTime: new Date('2025-11-18T15:00:00'),
    metadata: {
      assignedAt: new Date(),
      preferenceScore: 10,
      notes: 'ICU specialist - perfect match',
    },
  }),
];

console.log(`Created ${assignments.length} staff assignments`);
assignments.forEach((assignment) => {
  const staffName =
    typeof assignment.staffMember === 'string'
      ? assignment.staffMember
      : assignment.staffMember.name;
  const slotName =
    typeof assignment.staffSlot === 'string'
      ? assignment.staffSlot
      : assignment.staffSlot.name;
  console.log(`  - ${staffName} → ${slotName}`);
});

// Example 4: Creating a complete schedule
console.log('\n4. Creating a Complete Schedule\n');

const schedule = createSchedule({
  id: 'schedule-week-46-2025',
  name: 'Week of November 17-23, 2025',
  scheduleStart: new Date('2025-11-17T00:00:00'),
  scheduleEnd: new Date('2025-11-23T23:59:59'),
  assignments,
  unfilledSlots: [
    {
      slot: 'Tuesday Afternoon Nurse',
      reason: 'No qualified staff available',
      partiallyFilled: false,
    },
  ],
  metadata: {
    generatedAt: new Date(),
    generatedBy: 'Manual Example',
    algorithm: 'Manual',
    notes: 'Example schedule for demonstration',
  },
});

console.log('Schedule created:');
console.log(getScheduleSummary(schedule));

// Example 5: Getting schedule statistics
console.log('\n5. Schedule Statistics\n');

const stats = getScheduleStats(schedule);
console.log('Detailed Statistics:');
console.log(`  Total Assignments: ${stats.totalAssignments}`);
console.log(`  Total Hours: ${stats.totalHours.toFixed(1)}`);
console.log(`  Unique Staff: ${stats.uniqueStaffCount}`);
console.log(`  Unfilled Slots: ${stats.unfilledSlots}`);
console.log(`  Fill Rate: ${stats.fillRate.toFixed(1)}%`);
console.log(`  Has Conflicts: ${stats.hasConflicts}`);
console.log(`  Conflict Count: ${stats.conflictCount}`);

// Example 6: Checking for conflicts
console.log('\n6. Checking for Scheduling Conflicts\n');

const validation = isScheduleValid(schedule);
console.log(`Schedule is valid: ${validation.valid}`);

if (!validation.valid) {
  console.log(`\nConflicts found: ${validation.conflicts.length}`);
  validation.conflicts.forEach((conflict) => {
    console.log(`  ⚠️ ${conflict.staffName} has overlapping assignments:`);
    console.log(
      `    - ${conflict.assignment1.startTime.toLocaleString()} - ${conflict.assignment1.endTime.toLocaleString()}`
    );
    console.log(
      `    - ${conflict.assignment2.startTime.toLocaleString()} - ${conflict.assignment2.endTime.toLocaleString()}`
    );
  });
} else {
  console.log('No conflicts detected');
}

// Example 7: Hours by staff member
console.log('\n7. Hours by Staff Member\n');

const hoursByStaff = getHoursByStaff(schedule);
console.log('Hours worked:');
hoursByStaff.forEach((hours, staffName) => {
  console.log(`  ${staffName}: ${hours.toFixed(1)} hours`);
});

// Example 8: Finding staff by hour target
console.log('\n8. Analyzing Staff Utilization (Target: 40 hours, Tolerance: 5)\n');

const utilization = findStaffByHourTarget(schedule, 40, 5);

if (utilization.overUtilized.length > 0) {
  console.log('Over-utilized staff:');
  utilization.overUtilized.forEach((item) => {
    console.log(`  ${item.staff}: ${item.hours.toFixed(1)} hours (+${item.difference.toFixed(1)})`);
  });
}

if (utilization.underUtilized.length > 0) {
  console.log('\nUnder-utilized staff:');
  utilization.underUtilized.forEach((item) => {
    console.log(`  ${item.staff}: ${item.hours.toFixed(1)} hours (-${item.difference.toFixed(1)})`);
  });
}

if (utilization.onTarget.length > 0) {
  console.log('\nOn target:');
  utilization.onTarget.forEach((item) => {
    console.log(`  ${item.staff}: ${item.hours.toFixed(1)} hours`);
  });
}

// Example 9: Assignments by date
console.log('\n9. Assignments by Date\n');

const byDate = groupAssignmentsByDate(schedule.assignments);
byDate.forEach((assignments, dateStr) => {
  console.log(`\n${dateStr}:`);
  assignments.forEach((assignment) => {
    const staffName =
      typeof assignment.staffMember === 'string'
        ? assignment.staffMember
        : assignment.staffMember.name;
    const start = assignment.startTime.toLocaleTimeString();
    const end = assignment.endTime.toLocaleTimeString();
    console.log(`  ${start} - ${end}: ${staffName}`);
  });
});

// Example 10: Example with a conflict
console.log('\n10. Example Schedule with Conflict\n');

const conflictedAssignments: StaffAssignment[] = [
  createStaffAssignment({
    id: 'conflict-1',
    staffMember: 'John Doe',
    staffSlot: 'Morning Shift',
    startTime: new Date('2025-11-17T07:00:00'),
    endTime: new Date('2025-11-17T15:00:00'),
  }),
  createStaffAssignment({
    id: 'conflict-2',
    staffMember: 'John Doe',
    staffSlot: 'Midday Shift',
    startTime: new Date('2025-11-17T12:00:00'),
    endTime: new Date('2025-11-17T20:00:00'),
  }),
];

const conflictedSchedule = createSchedule({
  id: 'conflicted-schedule',
  name: 'Schedule with Conflicts',
  scheduleStart: new Date('2025-11-17T00:00:00'),
  scheduleEnd: new Date('2025-11-17T23:59:59'),
  assignments: conflictedAssignments,
  unfilledSlots: [],
});

const conflictCheck = isScheduleValid(conflictedSchedule);
console.log(`Schedule is valid: ${conflictCheck.valid}`);

if (!conflictCheck.valid) {
  console.log(`\nConflicts detected: ${conflictCheck.conflicts.length}`);
  conflictCheck.conflicts.forEach((conflict, index) => {
    console.log(`\nConflict ${index + 1}:`);
    console.log(`  Staff: ${conflict.staffName}`);
    console.log(
      `  Assignment 1: ${conflict.assignment1.startTime.toLocaleTimeString()} - ${conflict.assignment1.endTime.toLocaleTimeString()}`
    );
    console.log(
      `  Assignment 2: ${conflict.assignment2.startTime.toLocaleTimeString()} - ${conflict.assignment2.endTime.toLocaleTimeString()}`
    );
    console.log(`  Overlap: Cannot work two shifts at the same time!`);
  });
}

// Example 11: Calculating individual staff hours
console.log('\n11. Calculating Individual Staff Hours\n');

staff.forEach((member) => {
  const hours = calculateStaffHours(schedule.assignments, member);
  console.log(`${member.name}: ${hours.toFixed(1)} hours`);
});

// Example 12: Getting all assigned staff
console.log('\n12. All Assigned Staff\n');

const assignedStaff = getAssignedStaff(schedule);
console.log('Staff members with assignments:');
assignedStaff.forEach((staffName) => {
  console.log(`  - ${staffName}`);
});

console.log('\n' + '='.repeat(60));
console.log('END OF EXAMPLES');
console.log('='.repeat(60));
