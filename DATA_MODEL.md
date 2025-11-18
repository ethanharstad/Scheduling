# StaffMember Data Model

## Overview

The `StaffMember` interface represents a staff member in the scheduling system with essential information needed for scheduling and qualification tracking.

## Type Definition

```typescript
interface StaffMember {
  name: string;              // Full name of the staff member
  rank: number;              // Numeric rank (0 or positive)
  startOfService: Date;      // Date when service started
  qualifications: string[];  // List of qualifications/certifications
}
```

## Fields

### `name: string`
- **Description**: The full name of the staff member
- **Validation**: Must be a non-empty string
- **Example**: `"Dr. Sarah Johnson"`, `"Nurse Emily Chen"`

### `rank: number`
- **Description**: Numeric rank indicating seniority or authority level
- **Validation**: Must be a finite, non-negative number
- **Usage**: Higher rank may indicate more experience, seniority, or authority
- **Example**: `5`, `3`, `7`

### `startOfService: Date`
- **Description**: The date when the staff member began their service
- **Validation**: Must be a valid Date object
- **Usage**: Used to calculate years of service, seniority, and experience
- **Example**: `new Date('2018-03-15')`

### `qualifications: string[]`
- **Description**: Array of qualification codes, certifications, or skills
- **Validation**: Must be an array where all elements are strings
- **Usage**: Used for matching staff to requirements that need specific qualifications
- **Examples**:
  - Medical: `["MD", "Board Certified", "Emergency Medicine", "ACLS"]`
  - Nursing: `["RN", "BLS", "Pediatrics", "ICU"]`
  - Paramedic: `["EMT-P", "BLS", "ACLS", "PALS"]`

## API Functions

### Creation and Validation

#### `createStaffMember(data)`
Creates a validated StaffMember object. Throws an error if validation fails.

```typescript
const staff = createStaffMember({
  name: 'Dr. Sarah Johnson',
  rank: 5,
  startOfService: new Date('2018-03-15'),
  qualifications: ['MD', 'Board Certified', 'Emergency Medicine'],
});
```

#### `validateStaffMember(member)`
Validates a StaffMember object and returns an array of validation errors.

```typescript
const errors = validateStaffMember(data);
if (errors.length > 0) {
  errors.forEach(error => {
    console.log(`${error.field}: ${error.message}`);
  });
}
```

#### `isStaffMember(obj)`
Type guard to check if an object is a valid StaffMember.

```typescript
if (isStaffMember(data)) {
  // TypeScript knows data is a StaffMember here
  console.log(data.name);
}
```

### Utility Functions

#### `calculateYearsOfService(member, asOfDate?)`
Calculates years of service for a staff member.

```typescript
const years = calculateYearsOfService(staff);
console.log(`${years.toFixed(1)} years of service`);

// As of specific date
const yearsAsOf = calculateYearsOfService(staff, new Date('2023-01-01'));
```

#### `hasQualification(member, qualification)`
Checks if a staff member has a specific qualification.

```typescript
if (hasQualification(staff, 'ACLS')) {
  console.log('Staff member is ACLS certified');
}
```

#### `hasAllQualifications(member, qualifications)`
Checks if a staff member has all specified qualifications.

```typescript
const qualified = hasAllQualifications(staff, ['MD', 'Emergency Medicine']);
if (qualified) {
  console.log('Staff member meets all requirements');
}
```

#### `hasAnyQualification(member, qualifications)`
Checks if a staff member has at least one of the specified qualifications.

```typescript
const hasAny = hasAnyQualification(staff, ['BLS', 'ACLS', 'PALS']);
```

## Usage Examples

### Creating Staff Members

```typescript
import { StaffMember, createStaffMember } from './types';

// Direct creation
const doctor: StaffMember = {
  name: 'Dr. Michael Torres',
  rank: 7,
  startOfService: new Date('2015-01-10'),
  qualifications: ['MD', 'Surgery', 'Board Certified', 'Trauma'],
};

// Using factory function with validation
const nurse = createStaffMember({
  name: 'Nurse Patricia Williams',
  rank: 4,
  startOfService: new Date('2019-08-20'),
  qualifications: ['RN', 'ICU', 'CCRN', 'BLS', 'ACLS'],
});
```

### Working with Arrays

```typescript
const staffTeam: StaffMember[] = [doctor, nurse];

// Filter by rank
const seniorStaff = staffTeam.filter(member => member.rank >= 5);

// Filter by qualifications
const aclsCertified = staffTeam.filter(member =>
  hasQualification(member, 'ACLS')
);

// Sort by experience
const sortedByExperience = [...staffTeam].sort((a, b) =>
  calculateYearsOfService(b) - calculateYearsOfService(a)
);
```

### Validation

```typescript
import { validateStaffMember } from './types';

const data = {
  name: 'John Doe',
  rank: 3,
  startOfService: new Date('2020-01-01'),
  qualifications: ['RN', 'BLS'],
};

const errors = validateStaffMember(data);

if (errors.length === 0) {
  console.log('Valid staff member');
} else {
  console.log('Validation errors:', errors);
}
```

## Validation Rules

The `validateStaffMember` function checks:

1. **name**:
   - Must be a string
   - Cannot be empty (after trimming)

2. **rank**:
   - Must be a number
   - Must be finite
   - Cannot be negative

3. **startOfService**:
   - Must be a Date object
   - Must be a valid date (not NaN)

4. **qualifications**:
   - Must be an array
   - All elements must be strings

## Common Use Cases

### Scheduling Requirements

```typescript
// Find staff who meet specific requirements
function findQualifiedStaff(
  staffList: StaffMember[],
  requiredQualifications: string[],
  minimumRank: number
): StaffMember[] {
  return staffList.filter(member =>
    member.rank >= minimumRank &&
    hasAllQualifications(member, requiredQualifications)
  );
}

const qualified = findQualifiedStaff(
  staffTeam,
  ['RN', 'ICU'],
  3
);
```

### Experience-Based Selection

```typescript
// Get most experienced staff member
function getMostExperienced(staffList: StaffMember[]): StaffMember | null {
  if (staffList.length === 0) return null;

  return staffList.reduce((most, current) =>
    calculateYearsOfService(current) > calculateYearsOfService(most)
      ? current
      : most
  );
}
```

### Reporting

```typescript
// Generate staff summary
function generateStaffSummary(member: StaffMember): string {
  const years = calculateYearsOfService(member).toFixed(1);
  return `${member.name} (Rank ${member.rank}, ${years} years) - Qualifications: ${member.qualifications.join(', ')}`;
}

staffTeam.forEach(member => {
  console.log(generateStaffSummary(member));
});
```

## Type Safety

TypeScript provides compile-time type checking:

```typescript
// ✅ Valid
const staff: StaffMember = {
  name: 'John Doe',
  rank: 3,
  startOfService: new Date(),
  qualifications: ['RN'],
};

// ❌ Compile error: missing required fields
const invalid: StaffMember = {
  name: 'Jane Doe',
};

// ❌ Compile error: wrong type
const invalid2: StaffMember = {
  name: 'Bob Smith',
  rank: '3',  // Should be number, not string
  startOfService: new Date(),
  qualifications: ['RN'],
};
```

## Integration with Scheduling

The StaffMember model is designed to integrate with scheduling algorithms:

1. **Qualification Matching**: Use `hasAllQualifications()` to match staff to requirements
2. **Ranking/Priority**: Use `rank` field to prioritize staff selection
3. **Experience**: Use `calculateYearsOfService()` for seniority-based scheduling
4. **Skill Sets**: Use `qualifications` array for flexible skill matching

## Future Enhancements

Potential extensions to the data model:

- Availability schedules
- Maximum hours per week
- Preferred/blackout dates
- Contact information
- Department/location assignments
- Employment status (full-time, part-time, per diem)
- Cost/rate information
