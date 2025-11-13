/**
 * Example usage of the StaffMember data model.
 */

import {
  StaffMember,
  createStaffMember,
  calculateYearsOfService,
  hasQualification,
  hasAllQualifications,
  validateStaffMember,
} from '../types';

// Example 1: Creating a staff member
const staff1: StaffMember = {
  name: 'Dr. Sarah Johnson',
  rank: 5,
  startOfService: new Date('2018-03-15'),
  qualifications: ['MD', 'Board Certified', 'Emergency Medicine', 'ACLS'],
};

console.log('Staff Member 1:', staff1);

// Example 2: Using the factory function with validation
try {
  const staff2 = createStaffMember({
    name: 'Nurse Emily Chen',
    rank: 3,
    startOfService: new Date('2020-06-01'),
    qualifications: ['RN', 'BLS', 'Pediatrics'],
  });

  console.log('Staff Member 2:', staff2);
} catch (error) {
  console.error('Failed to create staff member:', error);
}

// Example 3: Calculating years of service
const yearsOfService = calculateYearsOfService(staff1);
console.log(`${staff1.name} has ${yearsOfService.toFixed(1)} years of service`);

// Example 4: Checking qualifications
const hasACLS = hasQualification(staff1, 'ACLS');
console.log(`Has ACLS certification: ${hasACLS}`);

const hasRequiredQuals = hasAllQualifications(staff1, ['MD', 'Emergency Medicine']);
console.log(`Has all required qualifications: ${hasRequiredQuals}`);

// Example 5: Validating data
const invalidData = {
  name: '',
  rank: -1,
  startOfService: new Date('2022-01-01'),
  qualifications: ['RN', 123], // Invalid: number in qualifications
};

const errors = validateStaffMember(invalidData);
if (errors.length > 0) {
  console.log('Validation errors:');
  errors.forEach((error) => {
    console.log(`  - ${error.field}: ${error.message}`);
  });
}

// Example 6: Array of staff members
const staffTeam: StaffMember[] = [
  {
    name: 'Dr. Michael Torres',
    rank: 7,
    startOfService: new Date('2015-01-10'),
    qualifications: ['MD', 'Surgery', 'Board Certified', 'Trauma'],
  },
  {
    name: 'Nurse Patricia Williams',
    rank: 4,
    startOfService: new Date('2019-08-20'),
    qualifications: ['RN', 'ICU', 'CCRN', 'BLS', 'ACLS'],
  },
  {
    name: 'Paramedic James Brown',
    rank: 2,
    startOfService: new Date('2021-11-05'),
    qualifications: ['EMT-P', 'BLS', 'ACLS', 'PALS'],
  },
];

// Example 7: Filtering by rank
const seniorStaff = staffTeam.filter((member) => member.rank >= 4);
console.log(`\nSenior staff (rank >= 4):`);
seniorStaff.forEach((member) => {
  console.log(`  - ${member.name} (Rank ${member.rank})`);
});

// Example 8: Finding staff with specific qualifications
const aclsCertified = staffTeam.filter((member) => hasQualification(member, 'ACLS'));
console.log(`\nACLS certified staff:`);
aclsCertified.forEach((member) => {
  console.log(`  - ${member.name}`);
});

// Example 9: Sorting by years of service
const sortedByExperience = [...staffTeam].sort((a, b) => {
  return calculateYearsOfService(b) - calculateYearsOfService(a);
});

console.log(`\nStaff sorted by experience:`);
sortedByExperience.forEach((member) => {
  const years = calculateYearsOfService(member).toFixed(1);
  console.log(`  - ${member.name}: ${years} years`);
});
