import { ParsedContact } from "./contactParser";

export interface ValidationIssue {
  field: string;
  issue: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  issues: ValidationIssue[];
}

export interface ValidatedContact extends ParsedContact {
  validation: ValidationResult;
}

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Phone number validation (international format)
const PHONE_REGEX = /^[\d\s\-\+\(\)\.]+$/;

// Validate email address
export const validateEmail = (email: string): ValidationIssue | null => {
  if (!email || !email.trim()) return null;

  const trimmedEmail = email.trim();

  // Check length
  if (trimmedEmail.length > 254) {
    return {
      field: 'email',
      issue: 'Email address is too long (max 254 characters)',
      severity: 'error',
    };
  }

  // Check format
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      field: 'email',
      issue: 'Invalid email format',
      severity: 'error',
    };
  }

  // Check for common typos
  const commonTypos = ['.con', '.cm', '.om', '@gmial', '@gmai', '@yahooo'];
  if (commonTypos.some(typo => trimmedEmail.includes(typo))) {
    return {
      field: 'email',
      issue: 'Email may contain a typo (e.g., .con instead of .com)',
      severity: 'warning',
    };
  }

  return null;
};

// Validate phone number
export const validatePhone = (phone: string): ValidationIssue | null => {
  if (!phone || !phone.trim()) return null;

  const trimmedPhone = phone.trim();

  // Check if contains only valid characters
  if (!PHONE_REGEX.test(trimmedPhone)) {
    return {
      field: 'phone',
      issue: 'Phone number contains invalid characters',
      severity: 'error',
    };
  }

  // Extract digits only
  const digitsOnly = trimmedPhone.replace(/\D/g, '');

  // Check minimum length (at least 7 digits for local numbers)
  if (digitsOnly.length < 7) {
    return {
      field: 'phone',
      issue: 'Phone number is too short (minimum 7 digits)',
      severity: 'error',
    };
  }

  // Check maximum length
  if (digitsOnly.length > 15) {
    return {
      field: 'phone',
      issue: 'Phone number is too long (maximum 15 digits)',
      severity: 'error',
    };
  }

  // Warn if no country code
  if (!trimmedPhone.startsWith('+') && digitsOnly.length >= 10) {
    return {
      field: 'phone',
      issue: 'Phone number may be missing country code (e.g., +1)',
      severity: 'warning',
    };
  }

  return null;
};

// Validate name
export const validateName = (name: string): ValidationIssue | null => {
  if (!name || !name.trim()) {
    return {
      field: 'name',
      issue: 'Name is required',
      severity: 'error',
    };
  }

  const trimmedName = name.trim();

  // Check minimum length
  if (trimmedName.length < 2) {
    return {
      field: 'name',
      issue: 'Name is too short (minimum 2 characters)',
      severity: 'error',
    };
  }

  // Check maximum length
  if (trimmedName.length > 100) {
    return {
      field: 'name',
      issue: 'Name is too long (maximum 100 characters)',
      severity: 'error',
    };
  }

  // Check for numbers (warning only)
  if (/\d/.test(trimmedName)) {
    return {
      field: 'name',
      issue: 'Name contains numbers',
      severity: 'warning',
    };
  }

  // Check for all caps (warning only)
  if (trimmedName === trimmedName.toUpperCase() && trimmedName.length > 3) {
    return {
      field: 'name',
      issue: 'Name is in all caps - consider proper casing',
      severity: 'warning',
    };
  }

  return null;
};

// Validate company name
export const validateCompany = (company: string): ValidationIssue | null => {
  if (!company || !company.trim()) return null;

  const trimmedCompany = company.trim();

  // Check maximum length
  if (trimmedCompany.length > 150) {
    return {
      field: 'company',
      issue: 'Company name is too long (maximum 150 characters)',
      severity: 'warning',
    };
  }

  return null;
};

// Validate job title
export const validateTitle = (title: string): ValidationIssue | null => {
  if (!title || !title.trim()) return null;

  const trimmedTitle = title.trim();

  // Check maximum length
  if (trimmedTitle.length > 100) {
    return {
      field: 'title',
      issue: 'Job title is too long (maximum 100 characters)',
      severity: 'warning',
    };
  }

  return null;
};

// Validate notes
export const validateNotes = (notes: string): ValidationIssue | null => {
  if (!notes || !notes.trim()) return null;

  const trimmedNotes = notes.trim();

  // Check maximum length
  if (trimmedNotes.length > 5000) {
    return {
      field: 'notes',
      issue: 'Notes are too long (maximum 5000 characters)',
      severity: 'warning',
    };
  }

  return null;
};

// Validate a single contact
export const validateContact = (contact: ParsedContact): ValidationResult => {
  const issues: ValidationIssue[] = [];

  // Validate each field
  const nameIssue = validateName(contact.name);
  if (nameIssue) issues.push(nameIssue);

  const emailIssue = contact.email ? validateEmail(contact.email) : null;
  if (emailIssue) issues.push(emailIssue);

  const phoneIssue = contact.phone ? validatePhone(contact.phone) : null;
  if (phoneIssue) issues.push(phoneIssue);

  const companyIssue = contact.company ? validateCompany(contact.company) : null;
  if (companyIssue) issues.push(companyIssue);

  const titleIssue = contact.title ? validateTitle(contact.title) : null;
  if (titleIssue) issues.push(titleIssue);

  const notesIssue = contact.notes ? validateNotes(contact.notes) : null;
  if (notesIssue) issues.push(notesIssue);

  // Check if contact has at least one contact method (email or phone)
  if (!contact.email && !contact.phone) {
    issues.push({
      field: 'contact',
      issue: 'No email or phone number provided',
      severity: 'warning',
    });
  }

  const hasErrors = issues.some(issue => issue.severity === 'error');
  const hasWarnings = issues.some(issue => issue.severity === 'warning');

  return {
    isValid: !hasErrors,
    hasWarnings,
    issues,
  };
};

// Validate all contacts
export const validateContacts = (contacts: ParsedContact[]): ValidatedContact[] => {
  return contacts.map(contact => ({
    ...contact,
    validation: validateContact(contact),
  }));
};

// Get validation summary
export const getValidationSummary = (validatedContacts: ValidatedContact[]) => {
  const total = validatedContacts.length;
  const valid = validatedContacts.filter(c => c.validation.isValid).length;
  const invalid = total - valid;
  const withWarnings = validatedContacts.filter(c => c.validation.hasWarnings).length;

  return {
    total,
    valid,
    invalid,
    withWarnings,
  };
};
