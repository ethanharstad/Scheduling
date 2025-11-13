# Staff Constraints Data Model

## Overview

The Staff Constraints model allows you to define scheduling preferences and availability for staff members. Constraints consist of time periods with associated preference levels, enabling the scheduler to respect staff availability and preferences when generating schedules.

## Type Definitions

### PreferenceLevel

```typescript
type PreferenceLevel = 'unavailable' | 'not_preferred' | 'neutral' | 'preferred';
```

Preference levels indicate how suitable a time period is for scheduling:

- **`unavailable`**: Staff member cannot work during this time (blocking constraint)
- **`not_preferred`**: Staff member can work but prefers not to
- **`neutral`**: No preference either way
- **`preferred`**: Staff member prefers to work during this time

### StaffConstraint

```typescript
interface StaffConstraint {
  startTime: Date;         // Start timestamp
  endTime: Date;          // End timestamp
  preference: PreferenceLevel;  // Preference level
  reason?: string;        // Optional reason/note
}
```

### Fields

#### `startTime: Date`
- **Description**: The start timestamp for this constraint
- **Validation**: Must be a valid Date object
- **Usage**: Defines when the constraint period begins

#### `endTime: Date`
- **Description**: The end timestamp for this constraint
- **Validation**: Must be a valid Date object, must be after `startTime`
- **Usage**: Defines when the constraint period ends

#### `preference: PreferenceLevel`
- **Description**: The preference level for this time period
- **Validation**: Must be one of: `'unavailable'`, `'not_preferred'`, `'neutral'`, `'preferred'`
- **Usage**: Indicates how suitable this time is for scheduling

#### `reason?: string` (optional)
- **Description**: Optional reason or note for this constraint
- **Examples**:
  - `"School pickup"`
  - `"Medical appointment"`
  - `"Prefers mornings"`
  - `"Continuing education class"`

## Integration with StaffMember

The `StaffMember` interface includes an optional `constraints` field:

```typescript
interface StaffMember {
  name: string;
  rank: number;
  startOfService: Date;
  qualifications: string[];
  constraints?: StaffConstraint[];  // Optional list of constraints
}
```

## API Functions

### Creation and Validation

#### `createStaffConstraint(data: {...}): StaffConstraint`
Creates a validated StaffConstraint. Throws error if invalid.

```typescript
const constraint = createStaffConstraint({
  startTime: new Date('2025-11-17T15:00:00'),
  endTime: new Date('2025-11-17T17:00:00'),
  preference: 'unavailable',
  reason: 'School pickup',
});
```

#### `validateStaffConstraint(constraint: unknown): ValidationError[]`
Validates a StaffConstraint and returns errors.

```typescript
const errors = validateStaffConstraint(data);
if (errors.length > 0) {
  console.log('Validation errors:', errors);
}
```

#### `isStaffConstraint(obj: unknown): boolean`
Type guard to check if object is a valid StaffConstraint.

```typescript
if (isStaffConstraint(data)) {
  console.log(data.preference);
}
```

#### `isPreferenceLevel(value: unknown): boolean`
Type guard to check if value is a valid PreferenceLevel.

```typescript
if (isPreferenceLevel('preferred')) {
  // value is a valid preference level
}
```

### Time-Based Utilities

#### `getConstraintDuration(constraint: StaffConstraint): number`
Calculates duration of the constraint in hours.

```typescript
const hours = getConstraintDuration(constraint);  // e.g., 2.0
```

#### `isTimeInConstraint(constraint: StaffConstraint, time: Date): boolean`
Checks if a specific time falls within the constraint.

```typescript
const isIn = isTimeInConstraint(constraint, new Date('2025-11-17T16:00:00'));
```

#### `doConstraintsOverlap(constraint1, constraint2): boolean`
Checks if two constraints overlap in time.

```typescript
if (doConstraintsOverlap(constraint1, constraint2)) {
  console.log('Constraints overlap');
}
```

#### `doesConstraintContainTimeSlot(constraint, slotStart, slotEnd): boolean`
Checks if a constraint completely contains a time slot.

```typescript
const contains = doesConstraintContainTimeSlot(
  constraint,
  new Date('2025-11-17T15:30:00'),
  new Date('2025-11-17T16:30:00')
);
```

#### `doesTimeSlotOverlapConstraint(slotStart, slotEnd, constraint): boolean`
Checks if a time slot overlaps with a constraint.

```typescript
const overlaps = doesTimeSlotOverlapConstraint(
  slotStart,
  slotEnd,
  constraint
);
```

### Filtering and Grouping

#### `filterConstraintsByPreference(constraints, preference): StaffConstraint[]`
Returns constraints with a specific preference level.

```typescript
const unavailable = filterConstraintsByPreference(constraints, 'unavailable');
```

#### `getUnavailableConstraints(constraints): StaffConstraint[]`
Returns all unavailable constraints (blocking constraints).

```typescript
const unavailable = getUnavailableConstraints(staff.constraints || []);
```

#### `getPreferredConstraints(constraints): StaffConstraint[]`
Returns all preferred constraints.

```typescript
const preferred = getPreferredConstraints(staff.constraints || []);
```

#### `groupConstraintsByPreference(constraints): Map<PreferenceLevel, StaffConstraint[]>`
Groups constraints by preference level.

```typescript
const grouped = groupConstraintsByPreference(constraints);
grouped.forEach((constraints, preference) => {
  console.log(`${preference}: ${constraints.length} constraints`);
});
```

#### `groupConstraintsByDate(constraints): Map<string, StaffConstraint[]>`
Groups constraints by date (YYYY-MM-DD).

```typescript
const byDate = groupConstraintsByDate(constraints);
byDate.forEach((constraints, dateStr) => {
  console.log(`${dateStr}: ${constraints.length} constraints`);
});
```

#### `sortConstraintsByStartTime(constraints): StaffConstraint[]`
Returns constraints sorted by start time (ascending).

```typescript
const sorted = sortConstraintsByStartTime(constraints);
```

#### `getConstraintsInDateRange(constraints, rangeStart, rangeEnd): StaffConstraint[]`
Returns constraints that overlap with a date range.

```typescript
const weekConstraints = getConstraintsInDateRange(
  constraints,
  new Date('2025-11-17T00:00:00'),
  new Date('2025-11-23T23:59:59')
);
```

### Scheduling Decision Support

#### `hasUnavailableConflict(slotStart, slotEnd, constraints): boolean`
Checks if a time slot conflicts with any unavailable constraints.

```typescript
const canSchedule = !hasUnavailableConflict(
  slotStart,
  slotEnd,
  staff.constraints || []
);
```

#### `getTimeSlotPreference(slotStart, slotEnd, constraints): PreferenceLevel | null`
Gets the effective preference level for a time slot.

Returns the most restrictive preference if multiple constraints apply:
- Priority: `unavailable` > `not_preferred` > `neutral` > `preferred`
- Returns `null` if no constraints apply

```typescript
const preference = getTimeSlotPreference(slotStart, slotEnd, constraints);

if (preference === 'unavailable') {
  console.log('Cannot schedule during this time');
} else if (preference === 'preferred') {
  console.log('Good time to schedule');
}
```

#### `calculatePreferenceScore(slotStart, slotEnd, constraints): number`
Calculates a numeric score for a time slot. Higher scores are better.

**Score Values:**
- `unavailable`: -100 (should not be scheduled)
- `not_preferred`: -10
- `neutral`: 0
- `preferred`: 10
- no constraint: 0

```typescript
const score = calculatePreferenceScore(slotStart, slotEnd, constraints);

if (score >= 10) {
  console.log('Excellent choice');
} else if (score < -50) {
  console.log('Should not schedule');
}
```

### Statistics and Analysis

#### `getConstraintStats(constraints): ConstraintStats`
Returns comprehensive statistics about a set of constraints.

```typescript
interface ConstraintStats {
  totalConstraints: number;
  totalHours: number;
  unavailableHours: number;
  notPreferredHours: number;
  neutralHours: number;
  preferredHours: number;
  constraintsByPreference: Map<PreferenceLevel, number>;
  earliestConstraint: Date | null;
  latestConstraint: Date | null;
}

const stats = getConstraintStats(constraints);
console.log(`Total unavailable hours: ${stats.unavailableHours}`);
console.log(`Total preferred hours: ${stats.preferredHours}`);
```

#### `getConstraintsSummary(constraints): string`
Returns a formatted summary string.

```typescript
const summary = getConstraintsSummary(constraints);
console.log(summary);
// Output:
// Total Constraints: 5
// Total Hours: 32.0
//   Unavailable: 8.0 hours
//   Not Preferred: 8.0 hours
//   Neutral: 8.0 hours
//   Preferred: 8.0 hours
// Period: 11/17/2025, 7:00:00 AM - 11/19/2025, 5:00:00 PM
```

## Usage Examples

### Creating a Staff Member with Constraints

```typescript
import { createStaffMember, createStaffConstraint } from './types';

const nurse = createStaffMember({
  name: 'Nurse Emily Chen',
  rank: 3,
  startOfService: new Date('2020-06-01'),
  qualifications: ['RN', 'BLS', 'Pediatrics'],
  constraints: [
    // Unavailable for school pickup
    createStaffConstraint({
      startTime: new Date('2025-11-17T15:00:00'),
      endTime: new Date('2025-11-17T17:00:00'),
      preference: 'unavailable',
      reason: 'School pickup',
    }),
    // Prefers morning shifts
    createStaffConstraint({
      startTime: new Date('2025-11-17T07:00:00'),
      endTime: new Date('2025-11-17T15:00:00'),
      preference: 'preferred',
      reason: 'Prefers mornings',
    }),
  ],
});
```

### Checking if Staff Can Be Scheduled

```typescript
import { hasUnavailableConflict, calculatePreferenceScore } from './types';

function canScheduleStaff(
  staff: StaffMember,
  slotStart: Date,
  slotEnd: Date
): { canSchedule: boolean; score: number; reason: string } {
  const constraints = staff.constraints || [];

  const hasConflict = hasUnavailableConflict(slotStart, slotEnd, constraints);
  const score = calculatePreferenceScore(slotStart, slotEnd, constraints);

  if (hasConflict) {
    return {
      canSchedule: false,
      score,
      reason: 'Staff is unavailable during this time',
    };
  }

  if (score >= 10) {
    return {
      canSchedule: true,
      score,
      reason: 'Staff prefers this time',
    };
  } else if (score <= -10) {
    return {
      canSchedule: true,
      score,
      reason: 'Staff prefers not to work this time',
    };
  }

  return {
    canSchedule: true,
    score,
    reason: 'No preference',
  };
}

const result = canScheduleStaff(
  nurse,
  new Date('2025-11-17T15:00:00'),
  new Date('2025-11-17T23:00:00')
);

console.log(`Can schedule: ${result.canSchedule}`);
console.log(`Score: ${result.score}`);
console.log(`Reason: ${result.reason}`);
```

### Ranking Candidates by Preference

```typescript
import { StaffMember, calculatePreferenceScore } from './types';

function rankCandidatesByPreference(
  candidates: StaffMember[],
  slotStart: Date,
  slotEnd: Date
) {
  return candidates
    .map((staff) => ({
      staff,
      score: calculatePreferenceScore(
        slotStart,
        slotEnd,
        staff.constraints || []
      ),
    }))
    .filter((candidate) => candidate.score > -100) // Exclude unavailable
    .sort((a, b) => b.score - a.score); // Sort by preference (best first)
}

const ranked = rankCandidatesByPreference(
  staffList,
  new Date('2025-11-17T07:00:00'),
  new Date('2025-11-17T15:00:00')
);

ranked.forEach((candidate, index) => {
  console.log(
    `${index + 1}. ${candidate.staff.name} (score: ${candidate.score})`
  );
});
```

### Finding Available Time Slots

```typescript
import { getUnavailableConstraints } from './types';

function findAvailableSlots(
  staff: StaffMember,
  dayStart: Date,
  dayEnd: Date,
  slotDurationHours: number
): Date[] {
  const unavailable = getUnavailableConstraints(staff.constraints || []);
  const availableSlots: Date[] = [];

  let currentTime = new Date(dayStart);
  const slotDuration = slotDurationHours * 60 * 60 * 1000; // Convert to ms

  while (currentTime < dayEnd) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration);

    const hasConflict = unavailable.some((constraint) =>
      doesTimeSlotOverlapConstraint(currentTime, slotEnd, constraint)
    );

    if (!hasConflict && slotEnd <= dayEnd) {
      availableSlots.push(new Date(currentTime));
    }

    currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // Advance 1 hour
  }

  return availableSlots;
}
```

### Common Constraint Patterns

```typescript
// Pattern 1: Unavailable for recurring appointment
const weeklyAppointment: StaffConstraint[] = [
  {
    startTime: new Date('2025-11-17T14:00:00'),
    endTime: new Date('2025-11-17T15:00:00'),
    preference: 'unavailable',
    reason: 'Weekly therapy appointment',
  },
  {
    startTime: new Date('2025-11-24T14:00:00'),
    endTime: new Date('2025-11-24T15:00:00'),
    preference: 'unavailable',
    reason: 'Weekly therapy appointment',
  },
];

// Pattern 2: Shift preference pattern
const morningPersonConstraints: StaffConstraint[] = [
  {
    startTime: new Date('2025-11-17T06:00:00'),
    endTime: new Date('2025-11-17T14:00:00'),
    preference: 'preferred',
    reason: 'Morning person',
  },
  {
    startTime: new Date('2025-11-17T22:00:00'),
    endTime: new Date('2025-11-18T06:00:00'),
    preference: 'not_preferred',
    reason: 'Prefers to avoid nights',
  },
];

// Pattern 3: Weekend availability
const weekendOnlyConstraints: StaffConstraint[] = [
  {
    startTime: new Date('2025-11-17T00:00:00'), // Monday
    endTime: new Date('2025-11-21T23:59:59'),   // Friday
    preference: 'unavailable',
    reason: 'Weekends only - full-time student',
  },
];

// Pattern 4: Part-time with specific days
const partTimeConstraints: StaffConstraint[] = [
  {
    startTime: new Date('2025-11-17T00:00:00'),
    endTime: new Date('2025-11-17T23:59:59'),
    preference: 'unavailable',
    reason: 'Not available Mondays',
  },
  {
    startTime: new Date('2025-11-19T00:00:00'),
    endTime: new Date('2025-11-19T23:59:59'),
    preference: 'unavailable',
    reason: 'Not available Wednesdays',
  },
];
```

## Validation Rules

1. **startTime**: Must be a valid Date object
2. **endTime**: Must be a valid Date, must be after startTime
3. **preference**: Must be one of the valid PreferenceLevel values
4. **reason** (optional): Must be a string if provided

## Best Practices

### 1. Use Unavailable for Hard Constraints
Only use `'unavailable'` for times when staff absolutely cannot work. Use `'not_preferred'` for times they'd rather avoid.

```typescript
// Good
{ preference: 'unavailable', reason: 'Medical appointment' }

// Less ideal - use 'not_preferred' instead
{ preference: 'unavailable', reason: 'Would rather not work evenings' }
```

### 2. Provide Reasons for Context
Always include a reason to help with debugging and schedule explanation.

```typescript
// Good
{
  startTime: new Date('2025-11-17T15:00:00'),
  endTime: new Date('2025-11-17T17:00:00'),
  preference: 'unavailable',
  reason: 'School pickup',
}

// Less helpful
{
  startTime: new Date('2025-11-17T15:00:00'),
  endTime: new Date('2025-11-17T17:00:00'),
  preference: 'unavailable',
}
```

### 3. Balance Preferences with Needs
Consider using `'neutral'` and `'not_preferred'` to provide flexibility while still expressing preferences.

```typescript
const balanced: StaffConstraint[] = [
  { preference: 'preferred', ... },     // Best times
  { preference: 'neutral', ... },       // Acceptable times
  { preference: 'not_preferred', ... }, // Less ideal but possible
  { preference: 'unavailable', ... },   // Cannot work
];
```

### 4. Check for Conflicts During Assignment
Always check for unavailable conflicts before assigning a slot.

```typescript
if (hasUnavailableConflict(slotStart, slotEnd, staff.constraints || [])) {
  console.error('Cannot assign: staff is unavailable');
  return;
}
```

## Integration with Scheduling Algorithm

The constraint model is designed to work with scheduling algorithms:

```typescript
function assignSlot(
  slot: StaffSlot,
  candidates: StaffMember[]
): StaffMember | null {
  // Filter out unavailable staff
  const available = candidates.filter(
    (staff) =>
      !hasUnavailableConflict(
        slot.startTime,
        slot.endTime,
        staff.constraints || []
      )
  );

  if (available.length === 0) {
    return null; // No one available
  }

  // Sort by preference score (highest first)
  const ranked = available.sort((a, b) => {
    const scoreA = calculatePreferenceScore(
      slot.startTime,
      slot.endTime,
      a.constraints || []
    );
    const scoreB = calculatePreferenceScore(
      slot.startTime,
      slot.endTime,
      b.constraints || []
    );
    return scoreB - scoreA;
  });

  // Return best candidate
  return ranked[0];
}
```

## Future Enhancements

Potential extensions:
- Constraint templates for common patterns
- Recurring constraint patterns (e.g., "every Monday")
- Constraint priorities for conflict resolution
- Soft vs. hard constraints
- Maximum hours per week integration
- Rest period requirements
- Preference strength levels (weak/strong preferred)
