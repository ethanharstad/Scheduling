/**
 * Example usage of StaffSlot and ScheduleRequirement data models.
 */

import {
  StaffSlot,
  ScheduleRequirement,
  createStaffSlot,
  createScheduleRequirement,
  getSlotDuration,
  doSlotsOverlap,
  getScheduleStats,
  getRequirementSummary,
  getAllRequiredQualifications,
  getTotalRequiredHours,
  groupSlotsByDate,
} from '../types';

// Example 1: Creating individual staff slots
const morningNurseSlot: StaffSlot = {
  name: 'Morning Shift Nurse',
  startTime: new Date('2025-11-17T07:00:00'),
  endTime: new Date('2025-11-17T15:00:00'),
  requiredQualifications: ['RN', 'BLS'],
};

const afternoonNurseSlot: StaffSlot = {
  name: 'Afternoon Shift Nurse',
  startTime: new Date('2025-11-17T15:00:00'),
  endTime: new Date('2025-11-17T23:00:00'),
  requiredQualifications: ['RN', 'BLS'],
};

const erDoctorSlot = createStaffSlot({
  name: 'ER Attending Physician',
  startTime: new Date('2025-11-17T08:00:00'),
  endTime: new Date('2025-11-17T18:00:00'),
  requiredQualifications: ['MD', 'Board Certified', 'Emergency Medicine'],
});

console.log('Individual Staff Slots:');
console.log(`${morningNurseSlot.name}: ${getSlotDuration(morningNurseSlot)} hours`);
console.log(`${erDoctorSlot.name}: ${getSlotDuration(erDoctorSlot)} hours`);

// Example 2: Checking slot overlap
const overlap = doSlotsOverlap(morningNurseSlot, erDoctorSlot);
console.log(`\nMorning nurse and ER doctor overlap: ${overlap}`);

// Example 3: Creating a complete schedule requirement
const weeklySchedule = createScheduleRequirement({
  id: 'schedule-week-46-2025',
  name: 'Week of November 17-23, 2025',
  scheduleStart: new Date('2025-11-17T00:00:00'),
  scheduleEnd: new Date('2025-11-23T23:59:59'),
  staffSlots: [
    // Monday slots
    {
      name: 'Monday Morning Nurse',
      startTime: new Date('2025-11-17T07:00:00'),
      endTime: new Date('2025-11-17T15:00:00'),
      requiredQualifications: ['RN', 'BLS'],
    },
    {
      name: 'Monday Afternoon Nurse',
      startTime: new Date('2025-11-17T15:00:00'),
      endTime: new Date('2025-11-17T23:00:00'),
      requiredQualifications: ['RN', 'BLS'],
    },
    {
      name: 'Monday Night Nurse',
      startTime: new Date('2025-11-17T23:00:00'),
      endTime: new Date('2025-11-18T07:00:00'),
      requiredQualifications: ['RN', 'BLS', 'Night Shift'],
    },
    {
      name: 'Monday ER Doctor',
      startTime: new Date('2025-11-17T08:00:00'),
      endTime: new Date('2025-11-17T20:00:00'),
      requiredQualifications: ['MD', 'Emergency Medicine'],
    },
    // Tuesday slots
    {
      name: 'Tuesday Morning Nurse',
      startTime: new Date('2025-11-18T07:00:00'),
      endTime: new Date('2025-11-18T15:00:00'),
      requiredQualifications: ['RN', 'BLS'],
    },
    {
      name: 'Tuesday ICU Specialist',
      startTime: new Date('2025-11-18T07:00:00'),
      endTime: new Date('2025-11-18T19:00:00'),
      requiredQualifications: ['RN', 'ICU', 'CCRN'],
    },
    {
      name: 'Tuesday Surgeon',
      startTime: new Date('2025-11-18T08:00:00'),
      endTime: new Date('2025-11-18T17:00:00'),
      requiredQualifications: ['MD', 'Surgery', 'Board Certified'],
    },
    // Wednesday slots
    {
      name: 'Wednesday Pediatric Nurse',
      startTime: new Date('2025-11-19T08:00:00'),
      endTime: new Date('2025-11-19T16:00:00'),
      requiredQualifications: ['RN', 'Pediatrics', 'BLS'],
    },
    {
      name: 'Wednesday ER Doctor',
      startTime: new Date('2025-11-19T12:00:00'),
      endTime: new Date('2025-11-20T00:00:00'),
      requiredQualifications: ['MD', 'Emergency Medicine', 'Board Certified'],
    },
  ],
  metadata: {
    createdAt: new Date(),
    createdBy: 'Scheduling Manager',
    description: 'Regular weekly schedule with standard coverage',
    tags: ['regular', 'weekly', 'november'],
  },
});

console.log('\n' + '='.repeat(60));
console.log('WEEKLY SCHEDULE REQUIREMENT');
console.log('='.repeat(60));

// Example 4: Getting schedule statistics
const stats = getScheduleStats(weeklySchedule);
console.log('\nSchedule Statistics:');
console.log(`Total Slots: ${stats.totalSlots}`);
console.log(`Total Hours: ${stats.totalHours.toFixed(1)}`);
console.log(`Average Slot Duration: ${stats.averageSlotDuration.toFixed(1)} hours`);
console.log(`Unique Qualifications: ${stats.uniqueQualifications}`);
console.log(`Earliest Slot: ${stats.earliestSlot?.toLocaleString()}`);
console.log(`Latest Slot: ${stats.latestSlot?.toLocaleString()}`);

// Example 5: Getting required qualifications
const allQuals = getAllRequiredQualifications(weeklySchedule);
console.log('\nAll Required Qualifications:');
allQuals.forEach((qual) => {
  console.log(`  - ${qual}`);
});

// Example 6: Getting summary
console.log('\n' + '-'.repeat(60));
console.log(getRequirementSummary(weeklySchedule));
console.log('-'.repeat(60));

// Example 7: Total hours calculation
const totalHours = getTotalRequiredHours(weeklySchedule);
console.log(`\nTotal staffing hours needed: ${totalHours.toFixed(1)} hours`);

// Example 8: Grouping slots by date
const slotsByDate = groupSlotsByDate(weeklySchedule.staffSlots);
console.log('\nSlots grouped by date:');
slotsByDate.forEach((slots, date) => {
  console.log(`\n${date}:`);
  slots.forEach((slot) => {
    const start = slot.startTime.toLocaleTimeString();
    const end = slot.endTime.toLocaleTimeString();
    console.log(`  - ${slot.name} (${start} - ${end})`);
  });
});

// Example 9: Building a complex requirement with validation
try {
  const emergencySchedule = createScheduleRequirement({
    id: 'emergency-holiday-2025',
    name: 'Holiday Emergency Coverage',
    scheduleStart: new Date('2025-12-24T00:00:00'),
    scheduleEnd: new Date('2025-12-26T23:59:59'),
    staffSlots: [
      createStaffSlot({
        name: 'Christmas Eve ER Doctor',
        startTime: new Date('2025-12-24T18:00:00'),
        endTime: new Date('2025-12-25T06:00:00'),
        requiredQualifications: ['MD', 'Emergency Medicine', 'Trauma'],
      }),
      createStaffSlot({
        name: 'Christmas Day Nurse',
        startTime: new Date('2025-12-25T07:00:00'),
        endTime: new Date('2025-12-25T19:00:00'),
        requiredQualifications: ['RN', 'BLS', 'ACLS'],
      }),
      createStaffSlot({
        name: 'Christmas Day ICU Specialist',
        startTime: new Date('2025-12-25T07:00:00'),
        endTime: new Date('2025-12-25T19:00:00'),
        requiredQualifications: ['RN', 'ICU', 'CCRN', 'Critical Care'],
      }),
    ],
    metadata: {
      createdAt: new Date(),
      description: 'Emergency coverage for Christmas holiday',
      tags: ['holiday', 'emergency', 'critical'],
    },
  });

  console.log('\n' + '='.repeat(60));
  console.log('HOLIDAY EMERGENCY SCHEDULE');
  console.log('='.repeat(60));
  console.log(getRequirementSummary(emergencySchedule));
} catch (error) {
  console.error('Failed to create emergency schedule:', error);
}

// Example 10: Finding specific slots
console.log('\n' + '='.repeat(60));
console.log('FILTERING EXAMPLES');
console.log('='.repeat(60));

// Find all slots requiring MD qualification
const doctorSlots = weeklySchedule.staffSlots.filter((slot) =>
  slot.requiredQualifications.includes('MD')
);
console.log(`\nSlots requiring MD: ${doctorSlots.length}`);
doctorSlots.forEach((slot) => {
  console.log(`  - ${slot.name}`);
});

// Find all slots requiring ICU qualification
const icuSlots = weeklySchedule.staffSlots.filter((slot) =>
  slot.requiredQualifications.includes('ICU')
);
console.log(`\nSlots requiring ICU: ${icuSlots.length}`);
icuSlots.forEach((slot) => {
  console.log(`  - ${slot.name}`);
});

// Find slots longer than 10 hours
const longSlots = weeklySchedule.staffSlots.filter(
  (slot) => getSlotDuration(slot) > 10
);
console.log(`\nSlots longer than 10 hours: ${longSlots.length}`);
longSlots.forEach((slot) => {
  console.log(`  - ${slot.name}: ${getSlotDuration(slot).toFixed(1)} hours`);
});
