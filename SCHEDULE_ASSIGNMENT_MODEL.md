# Schedule Assignment Data Model

## Overview

The Schedule Assignment model represents the output of the scheduling algorithm. It consists of two main types:

1. **StaffAssignment** - Individual assignment of a staff member to a staff slot
2. **Schedule** - Collection of assignments representing a complete schedule

## StaffAssignment Type Definition

```typescript
interface StaffAssignment {
  id: string;                           // Unique identifier
  staffMember: StaffMember | string;    // Staff member (object or name)
  staffSlot: StaffSlot | string;        // Staff slot (object or name)
  startTime: Date;                      // Assignment start time
  endTime: Date;                        // Assignment end time
  metadata?: {                          // Optional metadata
    assignedAt?: Date;
    assignedBy?: string;
    notes?: string;
    preferenceScore?: number;
    [key: string]: unknown;
  };
}
```

### Fields

#### `id: string`
- **Description**: Unique identifier for this assignment
- **Validation**: Must be a non-empty string
- **Example**: `"assignment-001"`, `"2025-11-17-nurse-001"`

#### `staffMember: StaffMember | string`
- **Description**: The staff member assigned to the slot
- **Can be**: Full `StaffMember` object or just the name/ID as a string
- **Usage**: Full object provides more context, string is more lightweight

#### `staffSlot: StaffSlot | string`
- **Description**: The staff slot being filled
- **Can be**: Full `StaffSlot` object or just the name/ID as a string
- **Usage**: Full object includes qualification requirements and details

#### `startTime: Date`
- **Description**: When the assignment starts
- **Validation**: Must be a valid Date, must be before `endTime`
- **Note**: May differ from slot's start time in flexible scheduling

#### `endTime: Date`
- **Description**: When the assignment ends
- **Validation**: Must be a valid Date, must be after `startTime`
- **Note**: May differ from slot's end time in flexible scheduling

#### `metadata?: object` (optional)
- **Common fields**:
  - `assignedAt` - When the assignment was created
  - `assignedBy` - Who/what created the assignment
  - `notes` - Additional notes
  - `preferenceScore` - Score from preference calculation
- **Extensible**: Can include custom fields

## Schedule Type Definition

```typescript
interface Schedule {
  id: string;                           // Unique identifier
  name?: string;                        // Optional name
  scheduleStart: Date;                  // Schedule period start
  scheduleEnd: Date;                    // Schedule period end
  assignments: StaffAssignment[];       // All assignments
  unfilledSlots: UnfilledSlot[];        // Slots that couldn't be filled
  sourceRequirement?: ScheduleRequirement | string;  // Source requirements
  metadata?: {                          // Optional metadata
    generatedAt?: Date;
    generatedBy?: string;
    algorithm?: string;
    notes?: string;
    [key: string]: unknown;
  };
}
```

### UnfilledSlot Type

```typescript
interface UnfilledSlot {
  slot: StaffSlot | string;             // The unfilled slot
  reason: string;                       // Why it couldn't be filled
  partiallyFilled?: boolean;            // If partially filled
  fillStatus?: {                        // Fill status details
    needed: number;
    assigned: number;
  };
}
```

## StaffAssignment API Functions

### Creation and Validation

#### `createStaffAssignment(data: {...}): StaffAssignment`
Creates a validated StaffAssignment.

```typescript
const assignment = createStaffAssignment({
  id: 'assignment-001',
  staffMember: nurseEmily,
  staffSlot: morningSlot,
  startTime: new Date('2025-11-17T07:00:00'),
  endTime: new Date('2025-11-17T15:00:00'),
  metadata: {
    assignedAt: new Date(),
    preferenceScore: 10,
  },
});
```

#### `validateStaffAssignment(assignment: unknown): ValidationError[]`
Validates an assignment and returns errors.

#### `isStaffAssignment(obj: unknown): boolean`
Type guard to check if object is a valid StaffAssignment.

### Utility Functions

#### `getStaffMemberName(assignment: StaffAssignment): string`
Gets the staff member name from an assignment.

```typescript
const name = getStaffMemberName(assignment);  // "Nurse Emily Chen"
```

#### `getStaffSlotName(assignment: StaffAssignment): string`
Gets the staff slot name from an assignment.

```typescript
const slotName = getStaffSlotName(assignment);  // "Morning Shift Nurse"
```

#### `getAssignmentDuration(assignment: StaffAssignment): number`
Calculates duration in hours.

```typescript
const hours = getAssignmentDuration(assignment);  // 8.0
```

#### `doAssignmentsOverlap(assignment1, assignment2): boolean`
Checks if two assignments overlap in time.

```typescript
if (doAssignmentsOverlap(assign1, assign2)) {
  console.log('Conflict detected!');
}
```

#### `isAssignmentInTimeWindow(assignment, windowStart, windowEnd): boolean`
Checks if assignment falls within a time window.

```typescript
const inWindow = isAssignmentInTimeWindow(
  assignment,
  weekStart,
  weekEnd
);
```

### Grouping and Filtering

#### `groupAssignmentsByStaff(assignments): Map<string, StaffAssignment[]>`
Groups assignments by staff member.

```typescript
const byStaff = groupAssignmentsByStaff(assignments);
byStaff.forEach((assignments, staffName) => {
  console.log(`${staffName}: ${assignments.length} assignments`);
});
```

#### `groupAssignmentsByDate(assignments): Map<string, StaffAssignment[]>`
Groups assignments by date (YYYY-MM-DD).

```typescript
const byDate = groupAssignmentsByDate(assignments);
byDate.forEach((assignments, dateStr) => {
  console.log(`${dateStr}: ${assignments.length} assignments`);
});
```

#### `sortAssignmentsByStartTime(assignments): StaffAssignment[]`
Returns assignments sorted by start time.

```typescript
const sorted = sortAssignmentsByStartTime(assignments);
```

#### `findAssignmentsForStaff(assignments, staffNameOrMember): StaffAssignment[]`
Finds all assignments for a specific staff member.

```typescript
const nurseAssignments = findAssignmentsForStaff(
  allAssignments,
  'Nurse Emily Chen'
);
```

#### `getAssignmentsInDateRange(assignments, rangeStart, rangeEnd): StaffAssignment[]`
Gets assignments within a date range.

```typescript
const weekAssignments = getAssignmentsInDateRange(
  assignments,
  new Date('2025-11-17T00:00:00'),
  new Date('2025-11-23T23:59:59')
);
```

### Analysis Functions

#### `findOverlappingAssignments(assignments): Array<{...}>`
Finds scheduling conflicts (overlapping assignments).

```typescript
const overlaps = findOverlappingAssignments(assignments);
if (overlaps.length > 0) {
  console.log('Conflicts found:', overlaps);
}
```

#### `calculateStaffHours(assignments, staffNameOrMember): number`
Calculates total hours worked by a staff member.

```typescript
const hours = calculateStaffHours(assignments, 'Nurse Emily Chen');
console.log(`Total hours: ${hours}`);
```

#### `isStaffAvailableAt(assignments, staffNameOrMember, checkStart, checkEnd): boolean`
Checks if staff is available during a time period.

```typescript
const available = isStaffAvailableAt(
  assignments,
  nurse,
  new Date('2025-11-17T15:00:00'),
  new Date('2025-11-17T23:00:00')
);
```

#### `getAssignmentStats(assignments): AssignmentStats`
Gets comprehensive statistics.

```typescript
interface AssignmentStats {
  totalAssignments: number;
  totalHours: number;
  uniqueStaffCount: number;
  averageHoursPerAssignment: number;
  earliestAssignment: Date | null;
  latestAssignment: Date | null;
  hoursByStaff: Map<string, number>;
  assignmentsByStaff: Map<string, number>;
}

const stats = getAssignmentStats(assignments);
console.log(`Total hours: ${stats.totalHours}`);
```

#### `getAssignmentsSummary(assignments): string`
Returns a formatted summary string.

```typescript
const summary = getAssignmentsSummary(assignments);
console.log(summary);
```

## Schedule API Functions

### Creation and Validation

#### `createSchedule(data: {...}): Schedule`
Creates a validated Schedule.

```typescript
const schedule = createSchedule({
  id: 'week-46-2025',
  name: 'Week of November 17-23, 2025',
  scheduleStart: new Date('2025-11-17T00:00:00'),
  scheduleEnd: new Date('2025-11-23T23:59:59'),
  assignments: [...],
  unfilledSlots: [
    {
      slot: 'Night Shift Nurse',
      reason: 'No available staff',
    },
  ],
  metadata: {
    generatedAt: new Date(),
    algorithm: 'balanced',
  },
});
```

#### `validateSchedule(schedule: unknown): ValidationError[]`
Validates a schedule and returns errors.

#### `isSchedule(obj: unknown): boolean`
Type guard for Schedule.

### Basic Information

#### `getTotalAssignments(schedule): number`
Returns total number of assignments.

```typescript
const count = getTotalAssignments(schedule);
```

#### `getTotalUnfilledSlots(schedule): number`
Returns number of unfilled slots.

```typescript
const unfilled = getTotalUnfilledSlots(schedule);
```

#### `getScheduleFillRate(schedule): number`
Calculates fill rate percentage.

```typescript
const fillRate = getScheduleFillRate(schedule);
console.log(`Fill rate: ${fillRate.toFixed(1)}%`);
```

#### `getAssignedStaff(schedule): string[]`
Gets all staff members assigned in the schedule.

```typescript
const staff = getAssignedStaff(schedule);
console.log('Assigned staff:', staff);
```

### Validation and Conflict Detection

#### `findScheduleConflicts(schedule): Array<{...}>`
Finds overlapping assignments for the same staff member.

```typescript
const conflicts = findScheduleConflicts(schedule);
conflicts.forEach((conflict) => {
  console.log(`Conflict: ${conflict.staffName}`);
  console.log(`  Assignment 1: ${conflict.assignment1.id}`);
  console.log(`  Assignment 2: ${conflict.assignment2.id}`);
});
```

#### `isScheduleValid(schedule): {valid: boolean, conflicts: Array<{...}>}`
Validates that schedule has no conflicts.

```typescript
const validation = isScheduleValid(schedule);
if (!validation.valid) {
  console.log(`Found ${validation.conflicts.length} conflicts`);
}
```

### Analysis and Statistics

#### `getScheduleAssignmentStats(schedule): AssignmentStats`
Gets assignment statistics for the schedule.

```typescript
const stats = getScheduleAssignmentStats(schedule);
```

#### `getScheduleStats(schedule): ScheduleStats`
Gets comprehensive schedule statistics.

```typescript
interface ScheduleStats extends AssignmentStats {
  unfilledSlots: number;
  fillRate: number;
  hasConflicts: boolean;
  conflictCount: number;
}

const stats = getScheduleStats(schedule);
console.log(`Fill rate: ${stats.fillRate.toFixed(1)}%`);
console.log(`Conflicts: ${stats.conflictCount}`);
```

#### `getScheduleSummary(schedule): string`
Returns formatted summary string.

```typescript
const summary = getScheduleSummary(schedule);
console.log(summary);
// Output:
// Schedule: Week of November 17-23, 2025
// Period: 11/17/2025 - 11/23/2025
//
// Assignments: 42
// Unfilled Slots: 3
// Fill Rate: 93.3%
//
// Total Hours: 336.0
// Unique Staff: 15
// Average Hours per Assignment: 8.0
```

#### `getHoursByStaff(schedule): Map<string, number>`
Gets hours worked by each staff member.

```typescript
const hoursByStaff = getHoursByStaff(schedule);
hoursByStaff.forEach((hours, staffName) => {
  console.log(`${staffName}: ${hours.toFixed(1)} hours`);
});
```

#### `findStaffByHourTarget(schedule, targetHours, tolerance?): {...}`
Finds staff over/under target hours.

```typescript
const analysis = findStaffByHourTarget(schedule, 40, 5);

console.log('Over-utilized:');
analysis.overUtilized.forEach((item) => {
  console.log(`  ${item.staff}: ${item.hours} hours (+${item.difference})`);
});

console.log('Under-utilized:');
analysis.underUtilized.forEach((item) => {
  console.log(`  ${item.staff}: ${item.hours} hours (-${item.difference})`);
});
```

## Usage Examples

### Creating a Simple Schedule

```typescript
import {
  createStaffMember,
  createStaffSlot,
  createStaffAssignment,
  createSchedule,
} from './types';

// Create staff
const nurse = createStaffMember({
  name: 'Nurse Emily Chen',
  rank: 3,
  startOfService: new Date('2020-06-01'),
  qualifications: ['RN', 'BLS'],
});

// Create slot
const morningSlot = createStaffSlot({
  name: 'Morning Shift',
  startTime: new Date('2025-11-17T07:00:00'),
  endTime: new Date('2025-11-17T15:00:00'),
  requiredQualifications: ['RN'],
});

// Create assignment
const assignment = createStaffAssignment({
  id: 'assignment-001',
  staffMember: nurse,
  staffSlot: morningSlot,
  startTime: morningSlot.startTime,
  endTime: morningSlot.endTime,
});

// Create schedule
const schedule = createSchedule({
  id: 'schedule-001',
  name: 'Weekly Schedule',
  scheduleStart: new Date('2025-11-17T00:00:00'),
  scheduleEnd: new Date('2025-11-23T23:59:59'),
  assignments: [assignment],
  unfilledSlots: [],
});
```

### Checking for Conflicts

```typescript
const validation = isScheduleValid(schedule);

if (!validation.valid) {
  console.log('⚠️ Schedule has conflicts!');
  validation.conflicts.forEach((conflict) => {
    console.log(`\nStaff: ${conflict.staffName}`);
    console.log(`  Assignment 1: ${conflict.assignment1.id}`);
    console.log(`  Assignment 2: ${conflict.assignment2.id}`);
  });
} else {
  console.log('✅ Schedule is valid - no conflicts');
}
```

### Analyzing Workload Distribution

```typescript
const hoursByStaff = getHoursByStaff(schedule);

// Find min and max hours
let minHours = Infinity;
let maxHours = -Infinity;

hoursByStaff.forEach((hours) => {
  if (hours < minHours) minHours = hours;
  if (hours > maxHours) maxHours = hours;
});

const variance = maxHours - minHours;
console.log(`Workload variance: ${variance.toFixed(1)} hours`);

if (variance > 10) {
  console.log('⚠️ Workload is not well balanced');
} else {
  console.log('✅ Workload is well balanced');
}
```

### Generating Reports

```typescript
function generateScheduleReport(schedule: Schedule): string {
  const summary = getScheduleSummary(schedule);
  const stats = getScheduleStats(schedule);
  const hoursByStaff = getHoursByStaff(schedule);

  let report = summary + '\n\n';

  report += 'Hours by Staff:\n';
  Array.from(hoursByStaff.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([staff, hours]) => {
      report += `  ${staff}: ${hours.toFixed(1)} hours\n`;
    });

  if (schedule.unfilledSlots.length > 0) {
    report += '\nUnfilled Slots:\n';
    schedule.unfilledSlots.forEach((unfilled) => {
      const slotName = typeof unfilled.slot === 'string'
        ? unfilled.slot
        : unfilled.slot.name;
      report += `  - ${slotName}: ${unfilled.reason}\n`;
    });
  }

  return report;
}
```

## Best Practices

### 1. Always Validate Schedules

Check for conflicts before finalizing:

```typescript
const validation = isScheduleValid(schedule);
if (!validation.valid) {
  throw new Error(`Schedule has ${validation.conflicts.length} conflicts`);
}
```

### 2. Track Assignment Metadata

Include useful metadata for auditing and debugging:

```typescript
const assignment = createStaffAssignment({
  id: 'assignment-001',
  staffMember: nurse,
  staffSlot: slot,
  startTime: slot.startTime,
  endTime: slot.endTime,
  metadata: {
    assignedAt: new Date(),
    assignedBy: 'scheduler-v1',
    preferenceScore: 10,
    notes: 'Staff member preferred this slot',
  },
});
```

### 3. Handle Unfilled Slots

Always document why slots couldn't be filled:

```typescript
unfilledSlots: [
  {
    slot: nightShiftSlot,
    reason: 'No staff available with required qualifications',
    partiallyFilled: false,
  },
  {
    slot: weekendSlot,
    reason: 'Staff at maximum hours',
    partiallyFilled: true,
    fillStatus: { needed: 3, assigned: 2 },
  },
]
```

### 4. Monitor Workload Distribution

Ensure fair distribution of hours:

```typescript
const analysis = findStaffByHourTarget(schedule, 40, 5);

if (analysis.overUtilized.length > 0) {
  console.warn('Some staff are over-utilized');
  // Consider rebalancing
}
```

## Integration with Scheduling Algorithm

The assignment and schedule models are designed as the output of scheduling algorithms:

```typescript
function scheduleStaff(
  requirements: ScheduleRequirement,
  staff: StaffMember[]
): Schedule {
  const assignments: StaffAssignment[] = [];
  const unfilledSlots: UnfilledSlot[] = [];

  // Algorithm logic here...
  requirements.staffSlots.forEach((slot) => {
    const qualified = staff.filter(/* qualification check */);

    if (qualified.length > 0) {
      const selected = qualified[0];  // Or use ranking logic
      assignments.push(createStaffAssignment({
        id: `assignment-${assignments.length + 1}`,
        staffMember: selected,
        staffSlot: slot,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));
    } else {
      unfilledSlots.push({
        slot,
        reason: 'No qualified staff available',
      });
    }
  });

  return createSchedule({
    id: `schedule-${Date.now()}`,
    scheduleStart: requirements.scheduleStart,
    scheduleEnd: requirements.scheduleEnd,
    assignments,
    unfilledSlots,
    sourceRequirement: requirements,
  });
}
```

## Future Enhancements

Potential extensions:
- Assignment swapping functionality
- Schedule comparison tools
- Optimization suggestions
- Cost tracking per assignment
- Shift trade requests
- Emergency replacement tracking
- Historical schedule analysis
