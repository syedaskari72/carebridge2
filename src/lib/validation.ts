// Pakistani CNIC and Phone Number Validation

/**
 * Validates Pakistani CNIC (Computerized National Identity Card) number
 * Format: 12345-1234567-1 (13 digits total)
 * Last digit is gender code: odd = male, even = female
 */
export function validatePakistaniCNIC(cnic: string): { isValid: boolean; error?: string } {
  if (!cnic) {
    return { isValid: false, error: "CNIC is required" };
  }

  // Normalize to digits only (remove spaces, dashes, etc.)
  const digits = cnic.replace(/\D/g, '');

  // Must have exactly 13 digits
  if (digits.length !== 13) {
    return {
      isValid: false,
      error: "CNIC must have exactly 13 digits"
    };
  }

  // Basic format validation
  const areaCode = digits.substring(0, 5);
  const serialNumber = digits.substring(5, 12);
  const genderDigit = digits.substring(12, 13);

  // Area code should not start with 0
  if (areaCode.startsWith('0')) {
    return {
      isValid: false,
      error: "CNIC area code cannot start with 0"
    };
  }

  // Validate gender digit (last digit)
  const genderCode = parseInt(genderDigit);
  if (isNaN(genderCode) || genderCode < 0 || genderCode > 9) {
    return {
      isValid: false,
      error: "Invalid gender digit"
    };
  }

  // Optional: Basic area code validation (first digit should be 1-9)
  const firstDigit = parseInt(areaCode[0]);
  if (firstDigit < 1 || firstDigit > 9) {
    return {
      isValid: false,
      error: "Invalid CNIC area code"
    };
  }

  // Serial number should not be all zeros
  if (serialNumber === '0000000') {
    return {
      isValid: false,
      error: "Invalid CNIC serial number"
    };
  }

  return { isValid: true };
}

/**
 * Validates Pakistani phone numbers
 * Supports formats: +92 300 1234567, 0300-1234567, 03001234567
 */
export function validatePakistaniPhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Pakistani mobile number patterns
  const patterns = [
    /^\+92(3[0-9]{2}|4[0-9]{2}|5[0-9]{2})\d{7}$/, // +92 format
    /^92(3[0-9]{2}|4[0-9]{2}|5[0-9]{2})\d{7}$/,   // 92 format
    /^0(3[0-9]{2}|4[0-9]{2}|5[0-9]{2})\d{7}$/,    // 0 format
    /^(3[0-9]{2}|4[0-9]{2}|5[0-9]{2})\d{7}$/      // Direct format
  ];

  const isValidFormat = patterns.some(pattern => pattern.test(cleanPhone));

  if (!isValidFormat) {
    return { 
      isValid: false, 
      error: "Invalid Pakistani phone number format. Use +92 300 1234567 or 0300-1234567" 
    };
  }

  // Extract the network code (first 3 digits after country code)
  let networkCode = '';
  if (cleanPhone.startsWith('+92')) {
    networkCode = cleanPhone.substring(3, 6);
  } else if (cleanPhone.startsWith('92')) {
    networkCode = cleanPhone.substring(2, 5);
  } else if (cleanPhone.startsWith('0')) {
    networkCode = cleanPhone.substring(1, 4);
  } else {
    networkCode = cleanPhone.substring(0, 3);
  }

  // Valid Pakistani mobile network codes (updated 2024)
  const validNetworkCodes = [
    // Jazz (Mobilink) - includes former Warid codes
    '300', '301', '302', '303', '304', '305', '306', '307', '308', '309',
    // Telenor
    '340', '341', '342', '343', '344', '345', '346', '347', '348', '349',
    // Zong
    '310', '311', '312', '313', '314', '315', '316', '317', '318', '319',
    // Ufone (correct codes)
    '330', '331', '332', '333', '334', '335', '336', '337', '338', '339',
    // Jazz (former Warid codes now under Jazz)
    '320', '321', '322', '323', '324', '325', '326', '327', '328', '329',
    // SCOM
    '355',
    // PTCL WLL (Wireless Local Loop) - sometimes used as mobile
    '042', '051', // Lahore, Islamabad landline codes that can appear in mobile format
  ];

  if (!validNetworkCodes.includes(networkCode)) {
    return { 
      isValid: false, 
      error: "Invalid Pakistani mobile network code" 
    };
  }

  return { isValid: true };
}

/**
 * Format CNIC with proper dashes (xxxxx-xxxxxxx-x)
 */
export function formatCNIC(cnic: string): string {
  const digits = cnic.replace(/\D/g, '');
  if (digits.length === 13) {
    return `${digits.substring(0, 5)}-${digits.substring(5, 12)}-${digits.substring(12)}`;
  }
  // If not 13 digits, return as-is for user to continue typing
  return cnic;
}

/**
 * Format Pakistani phone number
 */
export function formatPakistaniPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11 && digits.startsWith('0')) {
    // 03001234567 -> 0300-1234567
    return `${digits.substring(0, 4)}-${digits.substring(4)}`;
  } else if (digits.length === 10) {
    // 3001234567 -> 0300-1234567
    return `0${digits.substring(0, 3)}-${digits.substring(3)}`;
  } else if (digits.length === 12 && digits.startsWith('92')) {
    // 923001234567 -> +92 300 1234567
    return `+92 ${digits.substring(2, 5)} ${digits.substring(5)}`;
  }
  
  return phone;
}

/**
 * Get network provider from Pakistani phone number
 */
export function getNetworkProvider(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  let networkCode = '';
  
  if (cleanPhone.startsWith('92')) {
    networkCode = cleanPhone.substring(2, 5);
  } else if (cleanPhone.startsWith('0')) {
    networkCode = cleanPhone.substring(1, 4);
  } else {
    networkCode = cleanPhone.substring(0, 3);
  }

  const providers: { [key: string]: string } = {
    // Jazz (Mobilink) - original codes
    '300': 'Jazz', '301': 'Jazz', '302': 'Jazz', '303': 'Jazz', '304': 'Jazz',
    '305': 'Jazz', '306': 'Jazz', '307': 'Jazz', '308': 'Jazz', '309': 'Jazz',
    // Telenor
    '340': 'Telenor', '341': 'Telenor', '342': 'Telenor', '343': 'Telenor', '344': 'Telenor',
    '345': 'Telenor', '346': 'Telenor', '347': 'Telenor', '348': 'Telenor', '349': 'Telenor',
    // Zong
    '310': 'Zong', '311': 'Zong', '312': 'Zong', '313': 'Zong', '314': 'Zong',
    '315': 'Zong', '316': 'Zong', '317': 'Zong', '318': 'Zong', '319': 'Zong',
    // Jazz (former Warid codes now under Jazz)
    '320': 'Jazz', '321': 'Jazz', '322': 'Jazz', '323': 'Jazz', '324': 'Jazz',
    '325': 'Jazz', '326': 'Jazz', '327': 'Jazz', '328': 'Jazz', '329': 'Jazz',
    // Ufone (correct codes)
    '330': 'Ufone', '331': 'Ufone', '332': 'Ufone', '333': 'Ufone', '334': 'Ufone',
    '335': 'Ufone', '336': 'Ufone', '337': 'Ufone', '338': 'Ufone', '339': 'Ufone',
    // SCOM
    '355': 'SCOM',
    // PTCL WLL
    '042': 'PTCL', '051': 'PTCL'
  };

  return providers[networkCode] || 'Unknown';
}
