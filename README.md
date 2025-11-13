# Staffing Scheduler

A TypeScript-based staffing schedule generator that matches staff members with availability to staffing requirements within a given time window.

## Overview

This project provides a robust data model and scheduling system for managing staff assignments. It includes comprehensive type definitions, validation, and utility functions for building and analyzing staffing schedules.

## Features

- **Strongly-typed data models** for staff members, schedule requirements, and staff slots
- **Comprehensive validation** with detailed error messages
- **Flexible qualification matching** to ensure staff meet requirements
- **Time-based scheduling** with overlap detection and duration calculations
- **Statistical analysis** of schedule requirements and workload distribution
- **Multiple scheduling algorithms** (planned: greedy, balanced, priority-based)

## Data Models

### StaffMember

Represents a staff member with:
- Name and numeric rank
- Start of service date
- List of qualifications/certifications

[View StaffMember Documentation →](./DATA_MODEL.md)

### ScheduleRequirement & StaffSlot

Represents scheduling requirements with:
- **StaffSlot**: Individual time slots with required qualifications
- **ScheduleRequirement**: Collection of slots within a time window

[View Schedule Requirements Documentation →](./SCHEDULE_REQUIREMENTS_MODEL.md)

## Installation

```bash
npm install
```

## Usage

### Creating Staff Members

```typescript
import { createStaffMember } from './types';

const staff = createStaffMember({
  name: 'Dr. Sarah Johnson',
  rank: 5,
  startOfService: new Date('2018-03-15'),
  qualifications: ['MD', 'Board Certified', 'Emergency Medicine'],
});
```

### Defining Schedule Requirements

```typescript
import { createScheduleRequirement, createStaffSlot } from './types';

const schedule = createScheduleRequirement({
  id: 'week-46-2025',
  name: 'Week of November 17-23, 2025',
  scheduleStart: new Date('2025-11-17T00:00:00'),
  scheduleEnd: new Date('2025-11-23T23:59:59'),
  staffSlots: [
    createStaffSlot({
      name: 'Morning Shift Nurse',
      startTime: new Date('2025-11-17T07:00:00'),
      endTime: new Date('2025-11-17T15:00:00'),
      requiredQualifications: ['RN', 'BLS'],
    }),
    // ... more slots
  ],
});
```

### Running Examples

```typescript
// Run the staff member examples
npx tsx src/examples/staffMemberExample.ts

// Run the schedule requirement examples
npx tsx src/examples/scheduleRequirementExample.ts
```

## Project Structure

```
Scheduling/
├── src/
│   ├── types/                    # Type definitions
│   │   ├── StaffMember.ts       # Staff member model
│   │   ├── StaffSlot.ts         # Staff slot model
│   │   ├── ScheduleRequirement.ts  # Schedule requirement model
│   │   └── index.ts             # Type exports
│   ├── examples/                # Usage examples
│   │   ├── staffMemberExample.ts
│   │   └── scheduleRequirementExample.ts
│   └── index.ts                 # Main entry point
├── DATA_MODEL.md                # StaffMember documentation
├── SCHEDULE_REQUIREMENTS_MODEL.md  # Schedule requirements documentation
├── IMPLEMENTATION_PLAN.md       # Detailed implementation plan
└── README.md                    # This file
```

## Documentation

- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Comprehensive plan for the scheduling system
- **[StaffMember Model](./DATA_MODEL.md)** - Staff member data model and API reference
- **[Schedule Requirements Model](./SCHEDULE_REQUIREMENTS_MODEL.md)** - Schedule requirements and staff slots reference

## Development

### Build

```bash
npm run build
```

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Roadmap

### Phase 1: Foundation (Complete)
- ✅ Project setup and TypeScript configuration
- ✅ StaffMember data model
- ✅ StaffSlot and ScheduleRequirement data models
- ✅ Comprehensive validation and type guards
- ✅ Utility functions for analysis

### Phase 2: Core Scheduling (Planned)
- [ ] Greedy scheduling algorithm
- [ ] Balanced scheduling algorithm
- [ ] Priority-based scheduling algorithm
- [ ] Constraint validation (max hours, consecutive days)
- [ ] Schedule assignment tracking

### Phase 3: Optimization (Planned)
- [ ] Workload balancing
- [ ] Preference handling
- [ ] Performance optimization
- [ ] Comprehensive test suite

### Phase 4: Advanced Features (Future)
- [ ] Recurring schedule patterns
- [ ] Staff availability tracking
- [ ] Cost optimization
- [ ] Calendar export (iCal, etc.)
- [ ] REST API wrapper

## API Reference

### StaffMember Functions

- `createStaffMember(data)` - Create validated staff member
- `validateStaffMember(member)` - Validate and get errors
- `isStaffMember(obj)` - Type guard
- `calculateYearsOfService(member, asOfDate?)` - Calculate years of service
- `hasQualification(member, qualification)` - Check single qualification
- `hasAllQualifications(member, qualifications)` - Check all qualifications
- `hasAnyQualification(member, qualifications)` - Check any qualification

### StaffSlot Functions

- `createStaffSlot(data)` - Create validated staff slot
- `validateStaffSlot(slot)` - Validate and get errors
- `isStaffSlot(obj)` - Type guard
- `getSlotDuration(slot)` - Get duration in hours
- `doSlotsOverlap(slot1, slot2)` - Check for time overlap
- `isSlotInTimeWindow(slot, start, end)` - Check if in window
- `groupSlotsByDate(slots)` - Group by date
- `sortSlotsByStartTime(slots)` - Sort by time

### ScheduleRequirement Functions

- `createScheduleRequirement(data)` - Create validated requirement
- `validateScheduleRequirement(req)` - Validate and get errors
- `isScheduleRequirement(obj)` - Type guard
- `getTotalSlotCount(requirement)` - Get slot count
- `getTotalRequiredHours(requirement)` - Get total hours
- `getAllRequiredQualifications(requirement)` - Get unique qualifications
- `getScheduleStats(requirement)` - Get comprehensive statistics
- `getRequirementSummary(requirement)` - Get formatted summary

## Examples

See the [examples](./src/examples/) directory for complete working examples:

- **[staffMemberExample.ts](./src/examples/staffMemberExample.ts)** - Creating and working with staff members
- **[scheduleRequirementExample.ts](./src/examples/scheduleRequirementExample.ts)** - Creating and analyzing schedule requirements

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Author

Ethan Harstad