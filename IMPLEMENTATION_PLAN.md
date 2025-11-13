# TypeScript Staffing Schedule Generator - Implementation Plan

## Overview
Create a TypeScript function that generates optimal staffing schedules by matching staff members with availability to staffing requirements within a given time window.

## 1. Project Setup

### 1.1 Initialize Node.js/TypeScript Project
- Create `package.json` with project metadata
- Install TypeScript as dev dependency
- Install necessary dependencies:
  - `date-fns` or `dayjs` for date manipulation
  - `zod` for runtime validation (optional but recommended)
- Install development dependencies:
  - `@types/node`
  - `jest` and `@types/jest` for testing
  - `ts-jest` for TypeScript testing
  - `eslint` and `prettier` for code quality

### 1.2 TypeScript Configuration
- Create `tsconfig.json` with strict mode enabled
- Configure module resolution, target (ES2020+)
- Set up source and output directories

### 1.3 Project Structure
```
src/
├── types/           # Type definitions
├── validators/      # Input validation
├── scheduler/       # Core scheduling logic
├── utils/          # Helper functions
└── index.ts        # Main entry point
```

## 2. Type Definitions

### 2.1 Core Types (`src/types/index.ts`)

```typescript
// Time-related types
type TimeSlot = {
  start: Date;
  end: Date;
};

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// Staff member with availability
type StaffMember = {
  id: string;
  name: string;
  skills: string[];           // e.g., ['nurse', 'pediatrics']
  availability: Availability[];
  maxHoursPerWeek?: number;
  maxConsecutiveDays?: number;
  preferences?: StaffPreferences;
};

type Availability = {
  dayOfWeek: DayOfWeek;
  timeSlots: TimeSlot[];
} | {
  specificDate: Date;
  timeSlots: TimeSlot[];
} | {
  dateRange: TimeSlot;       // Available during entire range
};

type StaffPreferences = {
  preferredShifts?: ('morning' | 'afternoon' | 'evening' | 'night')[];
  avoidConsecutiveDays?: boolean;
  preferredDaysOff?: DayOfWeek[];
};

// Staffing requirements
type StaffingRequirement = {
  id: string;
  timeSlot: TimeSlot;
  requiredSkills: string[];
  numberOfStaffNeeded: number;
  priority?: number;          // Higher priority requirements filled first
  constraints?: RequirementConstraints;
};

type RequirementConstraints = {
  mustHaveSkills?: string[];  // At least one person must have these
  preferredStaff?: string[];  // Staff IDs to prefer for this requirement
  excludedStaff?: string[];   // Staff IDs to exclude
};

// Schedule output
type Schedule = {
  assignments: Assignment[];
  unfilledRequirements: UnfilledRequirement[];
  metadata: ScheduleMetadata;
};

type Assignment = {
  requirementId: string;
  staffId: string;
  timeSlot: TimeSlot;
  assignedAt: Date;
};

type UnfilledRequirement = {
  requirementId: string;
  timeSlot: TimeSlot;
  reason: string;
  partiallyFilled: number;    // How many staff assigned vs needed
};

type ScheduleMetadata = {
  generatedAt: Date;
  totalRequirements: number;
  filledRequirements: number;
  utilizationByStaff: Map<string, StaffUtilization>;
};

type StaffUtilization = {
  totalHours: number;
  assignmentCount: number;
  utilizationPercentage: number;
};

// Main function input
type ScheduleInput = {
  timeWindow: TimeSlot;
  staff: StaffMember[];
  requirements: StaffingRequirement[];
  options?: SchedulingOptions;
};

type SchedulingOptions = {
  algorithm?: 'greedy' | 'balanced' | 'priority-based';
  allowOvertime?: boolean;
  minimizeConsecutiveDays?: boolean;
  respectPreferences?: boolean;
};
```

## 3. Core Implementation

### 3.1 Main Scheduling Function (`src/scheduler/generateSchedule.ts`)

```typescript
function generateSchedule(input: ScheduleInput): Schedule
```

**Algorithm Overview:**
1. **Validation Phase** - Validate all inputs
2. **Preprocessing Phase** - Sort requirements, build availability index
3. **Assignment Phase** - Match staff to requirements
4. **Optimization Phase** - Balance workload, respect preferences
5. **Reporting Phase** - Generate metadata and unfilled list

### 3.2 Algorithm Options

#### 3.2.1 Greedy Algorithm (Default)
- Sort requirements by priority and time
- For each requirement, find first available qualified staff
- Fast but may not be optimal

#### 3.2.2 Balanced Algorithm
- Tries to distribute hours evenly across staff
- Sort staff by current assignment count
- Assign to least-utilized qualified staff

#### 3.2.3 Priority-Based Algorithm
- Focuses on filling high-priority requirements first
- May leave some staff under-utilized
- Ensures critical shifts are covered

### 3.3 Key Components

#### 3.3.1 Availability Checker (`src/scheduler/availabilityChecker.ts`)
```typescript
function isStaffAvailable(
  staff: StaffMember,
  timeSlot: TimeSlot,
  currentAssignments: Assignment[]
): boolean
```
- Check if time slot falls within staff availability
- Ensure no double-booking
- Verify constraints (max hours, consecutive days)

#### 3.3.2 Skill Matcher (`src/scheduler/skillMatcher.ts`)
```typescript
function hasRequiredSkills(
  staff: StaffMember,
  requirement: StaffingRequirement
): boolean
```
- Check if staff has required skills
- Consider "must have" vs "nice to have" skills

#### 3.3.3 Constraint Validator (`src/validators/constraintValidator.ts`)
```typescript
function validateConstraints(
  assignment: Assignment,
  staff: StaffMember,
  currentAssignments: Assignment[]
): ValidationResult
```
- Check work hour limits
- Verify consecutive day constraints
- Ensure rest periods between shifts

#### 3.3.4 Workload Balancer (`src/scheduler/workloadBalancer.ts`)
```typescript
function balanceWorkload(
  assignments: Assignment[],
  staff: StaffMember[]
): Assignment[]
```
- Redistribute assignments to balance hours
- Minimize variance in staff utilization
- Optional optimization step

## 4. Utility Functions

### 4.1 Date/Time Utilities (`src/utils/dateUtils.ts`)
- `doTimesSlotsOverlap(slot1, slot2): boolean`
- `getTimeSlotDuration(slot): number` (in hours)
- `isWithinTimeWindow(slot, window): boolean`
- `getDayOfWeek(date): DayOfWeek`
- `getConsecutiveDays(assignments, staffId): number`

### 4.2 Validation Utilities (`src/validators/inputValidator.ts`)
- `validateTimeWindow(window): ValidationResult`
- `validateStaff(staff): ValidationResult`
- `validateRequirements(requirements): ValidationResult`
- Ensure no negative durations, valid dates, etc.

## 5. Algorithm Details

### 5.1 Preprocessing Steps
1. **Build Availability Index**
   - Create a map of staff → available time slots
   - Pre-compute for efficiency

2. **Sort Requirements**
   - By priority (descending)
   - Then by start time (ascending)
   - Ensures critical/early shifts filled first

3. **Create Assignment Tracking**
   - Map staff → current assignments
   - Track hours worked per staff member

### 5.2 Assignment Process

```
For each requirement R:
  qualified_staff = filter staff by:
    - Has required skills
    - Available during time slot
    - Not exceeding work limits
    - Not in excluded list

  Sort qualified_staff by:
    - Preference score (if respectPreferences enabled)
    - Current workload (if balanced algorithm)
    - Random/first (if greedy)

  Assign top N staff where N = numberOfStaffNeeded

  If < N staff available:
    Add to unfilled list with reason
```

### 5.3 Optimization Passes (Optional)

1. **Preference Optimization**
   - Swap assignments to better match preferences
   - Only if doesn't violate constraints

2. **Workload Balancing**
   - Identify over/under-utilized staff
   - Attempt to redistribute assignments

3. **Consecutive Day Minimization**
   - Swap assignments to reduce consecutive workdays
   - Respects staff preferences

## 6. Error Handling

### 6.1 Input Validation Errors
- Empty staff list
- No requirements
- Invalid time window (end before start)
- Overlapping staff availability conflicts
- Missing required fields

### 6.2 Runtime Warnings (Non-Fatal)
- Requirements that cannot be filled
- Staff with zero assignments
- Over-utilized staff
- Under-utilized staff

### 6.3 Error Response Format
```typescript
type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

type ValidationError = {
  code: string;
  message: string;
  field?: string;
};
```

## 7. Testing Strategy

### 7.1 Unit Tests
- Test each utility function independently
- Test availability checking with various scenarios
- Test skill matching logic
- Test constraint validation

### 7.2 Integration Tests
- Test complete scheduling with small datasets
- Test edge cases:
  - No available staff
  - More staff than needed
  - Conflicting constraints
  - Zero requirements

### 7.3 Test Cases to Cover
1. **Happy Path**: Perfect match of staff and requirements
2. **Under-staffed**: More requirements than available staff
3. **Over-staffed**: More staff than requirements
4. **Skill Mismatch**: No staff with required skills
5. **Time Conflicts**: Staff availability doesn't match requirements
6. **Constraint Violations**: Max hours exceeded
7. **Priority Handling**: High priority requirements filled first
8. **Preference Handling**: Staff preferences respected when possible

## 8. Example Usage

```typescript
import { generateSchedule } from './scheduler';

const input = {
  timeWindow: {
    start: new Date('2025-11-17T00:00:00'),
    end: new Date('2025-11-23T23:59:59')
  },
  staff: [
    {
      id: 'staff-1',
      name: 'Alice Johnson',
      skills: ['nurse', 'emergency'],
      availability: [
        {
          dayOfWeek: 'Monday',
          timeSlots: [
            { start: new Date('2025-11-17T08:00:00'), end: new Date('2025-11-17T16:00:00') }
          ]
        }
      ],
      maxHoursPerWeek: 40
    }
  ],
  requirements: [
    {
      id: 'req-1',
      timeSlot: {
        start: new Date('2025-11-17T08:00:00'),
        end: new Date('2025-11-17T16:00:00')
      },
      requiredSkills: ['nurse'],
      numberOfStaffNeeded: 2,
      priority: 1
    }
  ],
  options: {
    algorithm: 'balanced',
    respectPreferences: true
  }
};

const schedule = generateSchedule(input);

console.log(`Filled ${schedule.metadata.filledRequirements} of ${schedule.metadata.totalRequirements} requirements`);
console.log(`Unfilled: ${schedule.unfilledRequirements.length}`);
```

## 9. Performance Considerations

### 9.1 Time Complexity
- **Greedy**: O(R × S) where R = requirements, S = staff
- **Balanced**: O(R × S × log S) due to sorting
- **Priority-based**: O(R × log R + R × S)

### 9.2 Optimization Strategies
- Pre-compute availability index
- Use efficient data structures (Maps, Sets)
- Limit optimization passes to prevent slow performance
- Consider caching for repeated scheduling

### 9.3 Scalability Limits
- Algorithm designed for: 100-1000 staff, 1000-10000 requirements
- For larger scales, consider:
  - Database integration
  - Chunked processing
  - Constraint programming libraries (e.g., Google OR-Tools)

## 10. Future Enhancements

### 10.1 Advanced Features
- **Shift swapping**: Allow staff to trade shifts
- **Recurring schedules**: Generate repeating patterns
- **Cost optimization**: Minimize overtime costs
- **Fairness metrics**: Ensure equitable distribution
- **Multi-location support**: Handle multiple facilities

### 10.2 Integration Options
- REST API wrapper
- Database persistence
- Export to calendar formats (iCal, Google Calendar)
- Email/SMS notifications

### 10.3 Algorithm Improvements
- Constraint programming solver integration
- Machine learning for preference prediction
- Genetic algorithms for large-scale optimization
- Support for partial availability (e.g., "available after 2 PM")

## 11. Implementation Phases

### Phase 1: Foundation (MVP)
1. Project setup and configuration
2. Type definitions
3. Basic validation
4. Greedy algorithm implementation
5. Simple test cases

### Phase 2: Core Features
1. All three algorithms (greedy, balanced, priority)
2. Comprehensive constraint checking
3. Preference handling
4. Complete test suite

### Phase 3: Optimization
1. Workload balancing
2. Performance optimization
3. Better error messages
4. Documentation

### Phase 4: Advanced Features (Optional)
1. Recurring schedules
2. API layer
3. Export capabilities
4. UI/reporting tools

## 12. Development Timeline Estimate

- **Phase 1**: 2-3 days
- **Phase 2**: 3-4 days
- **Phase 3**: 2-3 days
- **Phase 4**: 5-7 days (if needed)

**Total**: 1-2 weeks for core functionality, 3-4 weeks with advanced features

## 13. Dependencies

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.50.0",
    "jest": "^29.7.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0"
  }
}
```

## 14. Key Design Decisions

### 14.1 Why TypeScript?
- Strong typing prevents runtime errors
- Better IDE support and autocomplete
- Easier to maintain and refactor

### 14.2 Why Multiple Algorithms?
- Different use cases need different approaches
- Allows users to choose based on priorities
- Provides fallback options

### 14.3 Separation of Concerns
- Validators separate from core logic
- Utilities reusable across components
- Easy to test independently

### 14.4 Immutability
- Avoid mutating input data
- Return new schedule objects
- Easier to reason about and test

## 15. Documentation Requirements

- **README.md**: Quick start guide
- **API.md**: Detailed function documentation
- **EXAMPLES.md**: Common use cases
- **CONTRIBUTING.md**: Development guidelines
- **Inline comments**: JSDoc for all public functions
