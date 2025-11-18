# Staff Scheduling Application

A full-stack TypeScript staffing schedule generator with TanStack Router frontend and comprehensive data models for managing staff assignments, constraints, and scheduling requirements.

## Overview

This project provides a robust scheduling system for managing staff assignments with:
- **TanStack Router** frontend for building the user interface
- **TypeScript data models** for staff members, requirements, and schedules
- **Comprehensive validation** with detailed error messages
- **Flexible qualification matching** and constraint handling
- **Statistical analysis** of schedules and workload distribution

## Features

### Frontend (TanStack Router)
- Modern React application with TanStack Router
- Server-side rendering (SSR) support
- File-based routing
- Tailwind CSS styling
- Cloudflare Workers deployment ready

### Data Models
- **StaffMember**: Staff information with qualifications and constraints
- **StaffConstraint**: Time-based availability and preferences
- **ScheduleRequirement**: Input requirements with time slots
- **StaffAssignment**: Staff-to-slot mappings
- **Schedule**: Complete schedules with analytics

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Building For Production

```bash
npm run build
```

This will:
1. Build the TypeScript type definitions
2. Build the frontend application

### Testing

Run all tests:

```bash
npm run test
```

Run type model tests:

```bash
npm run test:types
```

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Project Structure

```
.
├── src/
│   ├── components/          # React components
│   ├── routes/              # TanStack Router routes
│   ├── types/               # TypeScript data models
│   │   ├── StaffMember.ts
│   │   ├── StaffConstraint.ts
│   │   ├── StaffSlot.ts
│   │   ├── ScheduleRequirement.ts
│   │   ├── StaffAssignment.ts
│   │   └── Schedule.ts
│   ├── __tests__/           # Unit tests for data models
│   └── examples/            # Example usage
├── public/                  # Static assets
└── dist/                    # Build output
```

## Data Models Documentation

### StaffMember

Represents a staff member with:
- Name and numeric rank
- Start of service date
- List of qualifications/certifications
- Optional scheduling constraints

[View StaffMember Documentation →](./DATA_MODEL.md)

### StaffConstraint

Represents scheduling constraints and preferences:
- **Time period** with start and end timestamps
- **Preference level**: unavailable, not preferred, neutral, or preferred
- Optional reason/note

[View Staff Constraints Documentation →](./STAFF_CONSTRAINTS_MODEL.md)

### ScheduleRequirement & StaffSlot

Represents scheduling requirements (inputs):
- **StaffSlot**: Individual time slots with required qualifications
- **ScheduleRequirement**: Collection of slots within a time window

[View Schedule Requirements Documentation →](./SCHEDULE_REQUIREMENTS_MODEL.md)

### StaffAssignment & Schedule

Represents scheduling results (outputs):
- **StaffAssignment**: Maps a staff member to a staff slot with start/end times
- **Schedule**: Collection of assignments with unfilled slots tracking

[View Schedule Assignment Documentation →](./SCHEDULE_ASSIGNMENT_MODEL.md)

## Usage Examples

### Creating Staff Members

```typescript
import { createStaffMember } from '@/types';

const staff = createStaffMember({
  name: 'Dr. Sarah Johnson',
  rank: 5,
  startOfService: new Date('2018-03-15'),
  qualifications: ['MD', 'Board Certified', 'Emergency Medicine'],
});
```

### Defining Schedule Requirements

```typescript
import { createScheduleRequirement, createStaffSlot } from '@/types';

const requirement = createScheduleRequirement({
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
  ],
});
```

### Adding Staff Constraints

```typescript
import { createStaffConstraint } from '@/types';

const constraint = createStaffConstraint({
  startTime: new Date('2025-11-20T00:00:00'),
  endTime: new Date('2025-11-21T23:59:59'),
  preference: 'unavailable',
  reason: 'Vacation',
});
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route, create a new file in the `./src/routes` directory:

```tsx
// src/routes/schedule.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/schedule')({
  component: ScheduleComponent,
});

function ScheduleComponent() {
  return <div>Schedule Page</div>;
}
```

### Adding Links

Use the `Link` component for SPA navigation:

```tsx
import { Link } from '@tanstack/react-router';

<Link to="/schedule">View Schedule</Link>
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Testing

This project uses:
- [Vitest](https://vitest.dev/) for React component tests
- [Jest](https://jestjs.io/) for data model unit tests

### Running Tests

```bash
# Run all tests
npm run test

# Run type model tests
npm run test:types

# Run with coverage
npm run test -- --coverage
```

## Tech Stack

- **Frontend**: React 19, TanStack Router
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5.7
- **Testing**: Vitest, Jest
- **Deployment**: Cloudflare Workers
- **Build Tool**: Vite

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:types` - Build TypeScript types
- `npm run test` - Run tests
- `npm run test:types` - Run type model tests
- `npm run deploy` - Deploy to Cloudflare
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Implementation Plan

For a detailed implementation roadmap, see [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

## License

MIT

## Author

Ethan Harstad
