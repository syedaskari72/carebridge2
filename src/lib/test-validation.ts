// Test file for validation functions
import { validatePakistaniCNIC, validatePakistaniPhone, formatCNIC, formatPakistaniPhone } from './validation';

// Test CNIC validation
export function testCNICValidation() {
  console.log('=== CNIC Validation Tests ===');
  
  const testCases = [
    { cnic: "42101-1234567-1", expected: true, description: "Valid Karachi CNIC" },
    { cnic: "4210112345671", expected: false, description: "No dashes" },
    { cnic: "42101-1234567-9", expected: false, description: "Invalid check digit" },
    { cnic: "35201-1234567-3", expected: true, description: "Valid Lahore CNIC" },
    { cnic: "61101-1234567-5", expected: true, description: "Valid Islamabad CNIC" },
    { cnic: "99999-1234567-1", expected: false, description: "Invalid area code" },
    { cnic: "42101-123456-1", expected: false, description: "Too few digits in middle" },
    { cnic: "4210-1234567-1", expected: false, description: "Too few digits at start" },
    { cnic: "42101-1234567-12", expected: false, description: "Too many digits at end" },
    { cnic: "", expected: false, description: "Empty CNIC" },
    { cnic: "42101 1234567 1", expected: true, description: "Spaces instead of dashes (should format)" }
  ];

  testCases.forEach(({ cnic, expected, description }) => {
    const result = validatePakistaniCNIC(cnic);
    const passed = result.isValid === expected;
    console.log(`${passed ? '✅' : '❌'} ${description}: "${cnic}" -> ${result.isValid ? 'VALID' : 'INVALID'}`);
    if (!passed) {
      console.log(`   Expected: ${expected}, Got: ${result.isValid}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  });
}

// Test phone validation
export function testPhoneValidation() {
  console.log('\n=== Phone Validation Tests ===');
  
  const testCases = [
    { phone: "+92 300 1234567", expected: true, description: "Valid Jazz number with +92" },
    { phone: "0300-1234567", expected: true, description: "Valid Jazz number with 0" },
    { phone: "03001234567", expected: true, description: "Valid Jazz number without formatting" },
    { phone: "+92 340 1234567", expected: true, description: "Valid Telenor number" },
    { phone: "+92 310 1234567", expected: true, description: "Valid Zong number" },
    { phone: "+92 320 1234567", expected: true, description: "Valid Ufone number" },
    { phone: "+92 355 1234567", expected: true, description: "Valid SCOM number" },
    { phone: "+92 299 1234567", expected: false, description: "Invalid network code" },
    { phone: "0299-1234567", expected: false, description: "Invalid network code with 0" },
    { phone: "+1 300 1234567", expected: false, description: "Wrong country code" },
    { phone: "300-123-4567", expected: false, description: "Wrong format" },
    { phone: "", expected: false, description: "Empty phone" },
    { phone: "92 300 1234567", expected: true, description: "Valid without + sign" }
  ];

  testCases.forEach(({ phone, expected, description }) => {
    const result = validatePakistaniPhone(phone);
    const passed = result.isValid === expected;
    console.log(`${passed ? '✅' : '❌'} ${description}: "${phone}" -> ${result.isValid ? 'VALID' : 'INVALID'}`);
    if (!passed) {
      console.log(`   Expected: ${expected}, Got: ${result.isValid}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  });
}

// Test formatting functions
export function testFormatting() {
  console.log('\n=== Formatting Tests ===');
  
  console.log('CNIC Formatting:');
  console.log(`"4210112345671" -> "${formatCNIC('4210112345671')}"`);
  console.log(`"42101 1234567 1" -> "${formatCNIC('42101 1234567 1')}"`);
  console.log(`"42101-1234567-1" -> "${formatCNIC('42101-1234567-1')}"`);
  
  console.log('\nPhone Formatting:');
  console.log(`"03001234567" -> "${formatPakistaniPhone('03001234567')}"`);
  console.log(`"923001234567" -> "${formatPakistaniPhone('923001234567')}"`);
  console.log(`"3001234567" -> "${formatPakistaniPhone('3001234567')}"`);
  console.log(`"+92 300 1234567" -> "${formatPakistaniPhone('+92 300 1234567')}"`);
}

// Run all tests
export function runAllValidationTests() {
  testCNICValidation();
  testPhoneValidation();
  testFormatting();
  console.log('\n=== Tests Complete ===');
}

// Browser console test function
if (typeof window !== 'undefined') {
  (window as any).testValidation = runAllValidationTests;
  console.log('Validation tests available. Run testValidation() in console to test.');
}
