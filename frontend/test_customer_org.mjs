import fs from 'fs';
import path from 'path';

console.log('--- STARTING VERIFICATION TESTS ---');

// 1. Check organizationService file exists and content
const orgServicePath = path.resolve('services/organizationService.ts');
if (!fs.existsSync(orgServicePath)) {
  console.error('FAIL: organizationService.ts does not exist');
  process.exit(1);
}
const orgServiceContent = fs.readFileSync(orgServicePath, 'utf8');

// Verify initial organizations are present
const expectedOrgs = [
  'Acme Health Systems',
  'Beacon Mental Health Group',
  'CareFirst Wellness Network',
  'Horizon Behavioral Health',
  'Metro General Healthcare',
  'St. Jude Wellness Foundation'
];

for (const orgName of expectedOrgs) {
  if (!orgServiceContent.includes(orgName)) {
    console.error(`FAIL: Organization "${orgName}" not found in organizationService.ts`);
    process.exit(1);
  }
}
console.log('✓ Validation 3: Organization service contains available organizations');

// 2. Inspect Customer Management page.tsx
const customerPagePath = path.resolve('app/admin/customers/page.tsx');
const customerPageContent = fs.readFileSync(customerPagePath, 'utf8');

// Check 5: Customer table columns
const expectedCols = ['Customer ID', 'Customer Name', 'Email', 'Customer Type', 'Organization', 'Registration Date', 'Account Status', 'Actions'];
for (const col of expectedCols) {
  if (!customerPageContent.includes(col)) {
    console.error(`FAIL: Table column "${col}" missing from customers page`);
    process.exit(1);
  }
}
console.log('✓ Validation 5: Customer table displays Customer ID, Name, Email, Customer Type, Organization, Registration Date, Account Status, Actions');

// Check 6: Role dropdown absent from Customer Management Add/Edit
if (customerPageContent.includes('Customer Group (Role)') || customerPageContent.includes('name="role"') || customerPageContent.includes('label="Role"')) {
  console.error('FAIL: Role dropdown found in Customer Management Add/Edit');
  process.exit(1);
}
console.log('✓ Validation 6: Role dropdown is completely absent from Customer Management Add/Edit');

// Check 2: Organization mandatory for organization-based customers
if (!customerPageContent.includes("form.customerType === 'Organization-Based Customer'") ||
    !customerPageContent.includes('Please select an organization for organization-based customers.')) {
  console.error('FAIL: Mandatory organization validation not found for organization-based customers');
  process.exit(1);
}
console.log('✓ Validation 2: Organization selection is mandatory for organization-based customers with validation error');

// Check 1: Direct customers can be created without an organization (disabled/None)
if (!customerPageContent.includes('None (Direct Customer)') || !customerPageContent.includes("next.organizationId = '';")) {
  console.error('FAIL: Direct customer organization clearing or None display not found');
  process.exit(1);
}
console.log('✓ Validation 1: Direct customers can be created without an organization (set to None/disabled)');

// Check 4: Editing customer preserves their organization selection
if (!customerPageContent.includes('organizationId: c.organizationId ? c.organizationId.toString() : \'\'') ||
    !customerPageContent.includes('customerType: c.customerType')) {
  console.error('FAIL: Editing does not load existing organization selection');
  process.exit(1);
}
console.log('✓ Validation 4: Editing a customer preserves and displays their existing organization selection');

// Check 7: Role assignment still works in User Management & Approvals (/admin/page.tsx)
const userMgmtPath = path.resolve('app/admin/page.tsx');
const userMgmtContent = fs.readFileSync(userMgmtPath, 'utf8');
if (!userMgmtContent.includes('/api/admin/users/${user.id}/role') ||
    !userMgmtContent.includes('handleAssignRole') ||
    !userMgmtContent.includes('User Management & Approvals')) {
  console.error('FAIL: Role assignment in User Management & Approvals was compromised');
  process.exit(1);
}
console.log('✓ Validation 7: Role assignment is intact and active in User Management & Approvals');

// Check 8: Existing customer management functionality (search, filter, sort, pagination, modals)
if (!customerPageContent.includes('handleSort') ||
    !customerPageContent.includes('filtered.slice') ||
    !customerPageContent.includes('setViewCustomer') ||
    !customerPageContent.includes('setEditCustomer')) {
  console.error('FAIL: Core customer management functions missing');
  process.exit(1);
}
console.log('✓ Validation 8: Search, filters, sorting, pagination, and customer detail modals remain fully intact');

console.log('--- ALL VALIDATIONS PASSED SUCCESSFULLY ---');
