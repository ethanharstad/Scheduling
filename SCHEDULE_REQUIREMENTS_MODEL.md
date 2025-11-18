# Schedule Requirements Data Model

## Overview

The schedule requirements data model consists of two main components:
1. **StaffSlot** - Individual time slots that need to be filled by qualified staff
2. **ScheduleRequirement** - A collection of staff slots representing complete schedule requirements

## StaffSlot Type Definition

```typescript
interface StaffSlot {
  name: string;                      // Name/identifier of the slot
  startTime: Date;                   // Start timestamp
  endTime: Date;                     // End timestamp
  requiredQualifications: string[];  // Qualifications needed to fill slot
}
```

### Fields

#### `name: string`
- **Description**: Name or identifier for the staff slot
- **Validation**: Must be a non-empty string
- **Examples**:
  - `"Morning Shift Nurse"`
  - `"ER Attending Physician"`
  - `"Night Security Officer"`
  - `"ICU Specialist - Monday"`

#### `startTime: Date`
- **Description**: The timestamp when this slot begins
- **Validation**: Must be a valid Date object
- **Usage**: Defines when the staff member should start their shift
- **Example**: `new Date('2025-11-17T07:00:00')`

#### `endTime: Date`
- **Description**: The timestamp when this slot ends
- **Validation**: Must be a valid Date object, must be after `startTime`
- **Usage**: Defines when the staff member should end their shift
- **Example**: `new Date('2025-11-17T15:00:00')`

#### `requiredQualifications: string[]`
- **Description**: List of qualifications required to fill this slot
- **Validation**: Must be an array of strings
- **Usage**: Staff member must have ALL listed qualifications to be eligible for this slot
- **Examples**:
  - Nursing: `["RN", "BLS"]`
  - Emergency Medicine: `["MD", "Board Certified", "Emergency Medicine"]`
  - ICU: `["RN", "ICU", "CCRN", "Critical Care"]`

## ScheduleRequirement Type Definition

```typescript
interface ScheduleRequirement {
  id: string;                // Unique identifier
  name?: string;             // Optional descriptive name
  scheduleStart: Date;       // Start of schedule window
  scheduleEnd: Date;         // End of schedule window
  staffSlots: StaffSlot[];   // Array of slots to fill
  metadata?: {               // Optional metadata
    createdAt?: Date;
    createdBy?: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}
```

### Fields

#### `id: string`
- **Description**: Unique identifier for this schedule requirement
- **Validation**: Must be a non-empty string
- **Examples**: `"schedule-week-46-2025"`, `"emergency-holiday-2025"`

#### `name?: string` (optional)
- **Description**: Human-readable name for the schedule
- **Examples**:
  - `"Week of November 17-23, 2025"`
  - `"Holiday Emergency Coverage"`
  - `"Winter Schedule 2025"`

#### `scheduleStart: Date`
- **Description**: Start of the overall scheduling window
- **Validation**: Must be a valid Date, must be before `scheduleEnd`
- **Usage**: Defines the beginning of the period being scheduled

#### `scheduleEnd: Date`
- **Description**: End of the overall scheduling window
- **Validation**: Must be a valid Date, must be after `scheduleStart`
- **Usage**: Defines the end of the period being scheduled

#### `staffSlots: StaffSlot[]`
- **Description**: Array of all staff slots that need to be filled
- **Validation**: Must be an array, each element validated as a StaffSlot
- **Usage**: Contains all the individual shifts/positions to fill

#### `metadata?: object` (optional)
- **Description**: Additional information about the schedule
- **Common fields**: `createdAt`, `createdBy`, `description`, `tags`
- **Extensible**: Can include custom fields

## StaffSlot API Functions

### Creation and Validation

#### `createStaffSlot(data: {...}): StaffSlot`
Creates a validated StaffSlot. Throws error if invalid.

```typescript
const slot = createStaffSlot({
  name: 'Morning Shift Nurse',
  startTime: new Date('2025-11-17T07:00:00'),
  endTime: new Date('2025-11-17T15:00:00'),
  requiredQualifications: ['RN', 'BLS'],
});
```

#### `validateStaffSlot(slot: unknown): ValidationError[]`
Validates a StaffSlot and returns errors.

```typescript
const errors = validateStaffSlot(data);
if (errors.length > 0) {
  console.log('Validation errors:', errors);
}
```

#### `isStaffSlot(obj: unknown): boolean`
Type guard to check if object is a valid StaffSlot.

```typescript
if (isStaffSlot(data)) {
  console.log(data.name);
}
```

### Utility Functions

#### `getSlotDuration(slot: StaffSlot): number`
Calculates duration of the slot in hours.

```typescript
const hours = getSlotDuration(slot);  // Returns 8.0 for an 8-hour slot
```

#### `isSlotInTimeWindow(slot, windowStart, windowEnd): boolean`
Checks if slot falls completely within a time window.

```typescript
const inWindow = isSlotInTimeWindow(
  slot,
  new Date('2025-11-17T00:00:00'),
  new Date('2025-11-17T23:59:59')
);
```

#### `doSlotsOverlap(slot1, slot2): boolean`
Checks if two slots overlap in time.

```typescript
if (doSlotsOverlap(morningSlot, afternoonSlot)) {
  console.log('Slots overlap - cannot assign same person');
}
```

#### `isSlotOnDate(slot, date): boolean`
Checks if slot starts on a specific date (ignoring time).

```typescript
const isMonday = isSlotOnDate(slot, new Date('2025-11-17'));
```

#### `groupSlotsByDate(slots): Map<string, StaffSlot[]>`
Groups slots by date.

```typescript
const byDate = groupSlotsByDate(allSlots);
byDate.forEach((slots, dateStr) => {
  console.log(`${dateStr}: ${slots.length} slots`);
});
```

#### `sortSlotsByStartTime(slots): StaffSlot[]`
Returns slots sorted by start time (ascending).

```typescript
const sorted = sortSlotsByStartTime(slots);
```

#### `filterSlotsByQualification(slots, qualification): StaffSlot[]`
Returns slots requiring a specific qualification.

```typescript
const rnSlots = filterSlotsByQualification(slots, 'RN');
```

#### `requiresAllQualifications(slot, qualifications): boolean`
Checks if slot requires all specified qualifications.

```typescript
const needsBoth = requiresAllQualifications(slot, ['RN', 'ICU']);
```

#### `requiresAnyQualification(slot, qualifications): boolean`
Checks if slot requires any of the specified qualifications.

```typescript
const needsEither = requiresAnyQualification(slot, ['MD', 'DO']);
```

## ScheduleRequirement API Functions

### Creation and Validation

#### `createScheduleRequirement(data: {...}): ScheduleRequirement`
Creates a validated ScheduleRequirement.

```typescript
const schedule = createScheduleRequirement({
  id: 'week-46-2025',
  name: 'Week of November 17-23',
  scheduleStart: new Date('2025-11-17T00:00:00'),
  scheduleEnd: new Date('2025-11-23T23:59:59'),
  staffSlots: [...],
  metadata: {
    createdAt: new Date(),
    tags: ['regular', 'weekly'],
  },
});
```

#### `validateScheduleRequirement(req: unknown): ValidationError[]`
Validates a ScheduleRequirement and returns errors.

#### `isScheduleRequirement(obj: unknown): boolean`
Type guard for ScheduleRequirement.

### Analysis Functions

#### `getTotalSlotCount(requirement): number`
Returns total number of slots.

```typescript
const count = getTotalSlotCount(schedule);  // e.g., 42
```

#### `getTotalRequiredHours(requirement): number`
Calculates total hours across all slots.

```typescript
const hours = getTotalRequiredHours(schedule);  // e.g., 336.0
```

#### `getAllRequiredQualifications(requirement): string[]`
Returns unique qualifications needed across all slots.

```typescript
const quals = getAllRequiredQualifications(schedule);
// Returns: ["RN", "BLS", "MD", "Emergency Medicine", "ICU", ...]
```

#### `countSlotsRequiringQualification(requirement, qualification): number`
Counts slots requiring a specific qualification.

```typescript
const rnSlotCount = countSlotsRequiringQualification(schedule, 'RN');
console.log(`Need ${rnSlotCount} RN-qualified staff members`);
```

#### `getSlotsByDateRange(requirement, rangeStart, rangeEnd): StaffSlot[]`
Gets slots within a date range.

```typescript
const mondaySlots = getSlotsByDateRange(
  schedule,
  new Date('2025-11-17T00:00:00'),
  new Date('2025-11-17T23:59:59')
);
```

#### `groupSlotsByQualifications(requirement): Map<string, StaffSlot[]>`
Groups slots by their qualification requirements.

```typescript
const grouped = groupSlotsByQualifications(schedule);
grouped.forEach((slots, qualKey) => {
  console.log(`Qualifications ${qualKey}: ${slots.length} slots`);
});
```

#### `areAllSlotsInScheduleWindow(requirement): boolean`
Checks if all slots fall within the schedule window.

```typescript
if (!areAllSlotsInScheduleWindow(schedule)) {
  console.warn('Some slots are outside the schedule window!');
}
```

#### `findSlotsOutsideWindow(requirement): StaffSlot[]`
Returns slots that fall outside the schedule window.

```typescript
const outsideSlots = findSlotsOutsideWindow(schedule);
if (outsideSlots.length > 0) {
  console.warn(`${outsideSlots.length} slots are outside the window`);
}
```

#### `getScheduleStats(requirement): ScheduleRequirementStats`
Returns comprehensive statistics about the schedule.

```typescript
interface ScheduleRequirementStats {
  totalSlots: number;
  totalHours: number;
  uniqueQualifications: number;
  qualificationsList: string[];
  earliestSlot: Date | null;
  latestSlot: Date | null;
  averageSlotDuration: number;
  slotsOutsideWindow: number;
}

const stats = getScheduleStats(schedule);
console.log(`Total Hours: ${stats.totalHours}`);
console.log(`Avg Duration: ${stats.averageSlotDuration} hours`);
```

#### `getRequirementSummary(requirement): string`
Returns a formatted summary string.

```typescript
const summary = getRequirementSummary(schedule);
console.log(summary);
// Output:
// Schedule: Week of November 17-23
// Period: 11/17/2025 - 11/23/2025
// Total Slots: 42
// Total Hours: 336.0
// Unique Qualifications: 8
// Required Qualifications: BLS, CCRN, ICU, MD, ...
```

## Usage Examples

### Creating a Weekly Schedule

```typescript
import {
  createScheduleRequirement,
  createStaffSlot,
  getScheduleStats,
} from './types';

const weeklySchedule = createScheduleRequirement({
  id: 'week-46-2025',
  name: 'Week of November 17-23, 2025',
  scheduleStart: new Date('2025-11-17T00:00:00'),
  scheduleEnd: new Date('2025-11-23T23:59:59'),
  staffSlots: [
    // Day shifts
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
    // ... more slots
  ],
  metadata: {
    createdAt: new Date(),
    createdBy: 'Scheduling Manager',
    description: 'Regular weekly schedule',
    tags: ['weekly', 'regular'],
  },
});

const stats = getScheduleStats(weeklySchedule);
console.log(`Need to fill ${stats.totalSlots} slots`);
console.log(`Total staffing hours: ${stats.totalHours}`);
```

### Finding Qualification Gaps

```typescript
import {
  getAllRequiredQualifications,
  countSlotsRequiringQualification,
} from './types';

// Get all required qualifications
const requiredQuals = getAllRequiredQualifications(schedule);

// Check how many slots need each qualification
console.log('Qualification Requirements:');
requiredQuals.forEach((qual) => {
  const count = countSlotsRequiringQualification(schedule, qual);
  console.log(`  ${qual}: ${count} slots`);
});
```

### Analyzing Schedule Coverage

```typescript
import {
  groupSlotsByDate,
  getSlotDuration,
} from './types';

// Group by date to see daily requirements
const byDate = groupSlotsByDate(schedule.staffSlots);

byDate.forEach((slots, dateStr) => {
  const totalHours = slots.reduce(
    (sum, slot) => sum + getSlotDuration(slot),
    0
  );
  console.log(`${dateStr}: ${slots.length} slots, ${totalHours} hours`);
});
```

### Validating Schedule Requirements

```typescript
import { validateScheduleRequirement } from './types';

const data = {
  id: 'test-schedule',
  scheduleStart: new Date('2025-11-17T00:00:00'),
  scheduleEnd: new Date('2025-11-23T23:59:59'),
  staffSlots: [
    {
      name: 'Test Slot',
      startTime: new Date('2025-11-17T08:00:00'),
      endTime: new Date('2025-11-17T16:00:00'),
      requiredQualifications: ['RN'],
    },
  ],
};

const errors = validateScheduleRequirement(data);

if (errors.length === 0) {
  console.log('Valid schedule requirement');
} else {
  console.log('Validation errors:');
  errors.forEach((error) => {
    console.log(`  ${error.field}: ${error.message}`);
  });
}
```

## Validation Rules

### StaffSlot Validation

1. **name**: Must be non-empty string
2. **startTime**: Must be valid Date
3. **endTime**: Must be valid Date, must be after startTime
4. **requiredQualifications**: Must be array of strings

### ScheduleRequirement Validation

1. **id**: Must be non-empty string
2. **name** (optional): Must be string if provided
3. **scheduleStart**: Must be valid Date
4. **scheduleEnd**: Must be valid Date, must be after scheduleStart
5. **staffSlots**: Must be array, each element validated as StaffSlot
6. **metadata** (optional): Can contain any additional fields

## Common Use Cases

### 1. Building Requirements from Template

```typescript
// Define common shift patterns
const shiftPatterns = {
  morning: { start: 7, end: 15 },
  afternoon: { start: 15, end: 23 },
  night: { start: 23, end: 7 },
};

function createDailySlots(date: Date, position: string, quals: string[]) {
  return Object.entries(shiftPatterns).map(([shift, times]) => {
    const start = new Date(date);
    start.setHours(times.start, 0, 0, 0);

    const end = new Date(date);
    end.setHours(times.end, 0, 0, 0);
    if (times.end < times.start) end.setDate(end.getDate() + 1);

    return createStaffSlot({
      name: `${shift} ${position}`,
      startTime: start,
      endTime: end,
      requiredQualifications: quals,
    });
  });
}

// Generate a week of nurse slots
const slots = [];
for (let i = 0; i < 7; i++) {
  const date = new Date('2025-11-17');
  date.setDate(date.getDate() + i);
  slots.push(...createDailySlots(date, 'Nurse', ['RN', 'BLS']));
}
```

### 2. Analyzing Workload Distribution

```typescript
function analyzeWorkload(requirement: ScheduleRequirement) {
  const byDate = groupSlotsByDate(requirement.staffSlots);

  const analysis = Array.from(byDate.entries()).map(([date, slots]) => ({
    date,
    slotCount: slots.length,
    totalHours: slots.reduce((sum, s) => sum + getSlotDuration(s), 0),
    qualifications: new Set(
      slots.flatMap((s) => s.requiredQualifications)
    ).size,
  }));

  return analysis;
}
```

### 3. Finding Qualification Conflicts

```typescript
function findQualificationConflicts(
  requirement: ScheduleRequirement,
  availableQualifications: Set<string>
) {
  const required = getAllRequiredQualifications(requirement);
  const missing = required.filter((q) => !availableQualifications.has(q));

  if (missing.length > 0) {
    console.warn('Missing qualifications:', missing);
    missing.forEach((qual) => {
      const count = countSlotsRequiringQualification(requirement, qual);
      console.log(`  ${qual}: needed for ${count} slots`);
    });
  }

  return missing;
}
```

## Integration with StaffMember

The schedule requirements model is designed to work seamlessly with the StaffMember model:

```typescript
import {
  StaffMember,
  StaffSlot,
  hasAllQualifications,
} from './types';

function canFillSlot(staff: StaffMember, slot: StaffSlot): boolean {
  return hasAllQualifications(staff, slot.requiredQualifications);
}

function findEligibleStaff(
  staffList: StaffMember[],
  slot: StaffSlot
): StaffMember[] {
  return staffList.filter((staff) => canFillSlot(staff, slot));
}
```

## Future Enhancements

Potential extensions to the model:

- **Priority levels** for slots (critical, normal, optional)
- **Preferred staff** assignments for specific slots
- **Minimum/maximum staff** per slot (allow ranges)
- **Break requirements** between consecutive slots
- **Location/department** information
- **Cost/budget** tracking per slot
- **Recurring patterns** for automated generation
- **Flexibility windows** (slot can start ±30 minutes)
