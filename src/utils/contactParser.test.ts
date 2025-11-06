import { describe, it, expect } from 'vitest';
import { 
  parseCSV, 
  parseVCF, 
  parseCSVWithMapping, 
  getCSVHeaders, 
  needsManualMapping,
  parseContactFile 
} from './contactParser';

describe('CSV Formula Injection Prevention', () => {
  it('should sanitize values starting with equals sign', () => {
    const csv = `name,email,company\n=1+1,test@example.com,Acme Corp`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("'=1+1");
  });

  it('should sanitize values starting with plus sign', () => {
    const csv = `name,email,phone\n+cmd|calc,test@example.com,123456`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("'+cmd|calc");
  });

  it('should sanitize values starting with minus sign', () => {
    const csv = `name,email,company\n-2+3,test@example.com,Test Inc`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("'-2+3");
  });

  it('should sanitize values starting with at sign', () => {
    const csv = `name,email,company\n@SUM(A1:A10),test@example.com,Evil Corp`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("'@SUM(A1:A10)");
  });

  it('should sanitize formula injection in all fields', () => {
    const csv = `name,email,phone,company,title,notes\n=EVIL(),+malicious@test.com,-123456,@COMPANY(),=JOB,+NOTE`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("'=EVIL()");
    expect(contacts[0].email).toBe("'+malicious@test.com");
    expect(contacts[0].phone).toBe("'-123456");
    expect(contacts[0].company).toBe("'@COMPANY()");
    expect(contacts[0].title).toBe("'=JOB");
    expect(contacts[0].notes).toBe("'+NOTE");
  });

  it('should not sanitize normal values', () => {
    const csv = `name,email,phone\nJohn Doe,john@example.com,+1234567890`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[0].email).toBe("john@example.com");
    // Phone should be sanitized as it starts with +
    expect(contacts[0].phone).toBe("'+1234567890");
  });

  it('should sanitize formulas in VCF files', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:=EVIL()
EMAIL:test@example.com
TEL:+1234567890
ORG:@COMPANY()
TITLE:-TITLE
NOTE:+NOTE
END:VCARD`;
    
    const contacts = parseVCF(vcf);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("'=EVIL()");
    expect(contacts[0].email).toBe("test@example.com");
    expect(contacts[0].phone).toBe("'+1234567890");
    expect(contacts[0].company).toBe("'@COMPANY()");
    expect(contacts[0].title).toBe("'-TITLE");
    expect(contacts[0].notes).toBe("'+NOTE");
  });

  it('should sanitize formulas with custom field mapping', () => {
    const csv = `First,Last,Contact\n=EVIL(),+MALICIOUS,@EMAIL`;
    const mapping = {
      'First': 'name',
      'Last': 'name',
      'Contact': 'email'
    };
    
    const contacts = parseCSVWithMapping(csv, mapping);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("'=EVIL() '+MALICIOUS");
    expect(contacts[0].email).toBe("'@EMAIL");
  });
});

describe('CSV Parsing', () => {
  it('should parse basic CSV with standard headers', () => {
    const csv = `name,email,phone\nJohn Doe,john@example.com,555-0100\nJane Smith,jane@example.com,555-0200`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(2);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[0].email).toBe("john@example.com");
    expect(contacts[1].name).toBe("Jane Smith");
  });

  it('should parse CSV with quoted values containing commas', () => {
    const csv = `name,company\n"Doe, John","Acme, Inc."`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("Doe, John");
    expect(contacts[0].company).toBe("Acme, Inc.");
  });

  it('should handle CSV with first and last name columns', () => {
    const csv = `first name,last name,email\nJohn,Doe,john@example.com`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[0].email).toBe("john@example.com");
  });

  it('should handle CSV with various header formats', () => {
    const csv = `Full Name,E-mail,Mobile,Organization,Job Title,Comment\nJohn Doe,john@example.com,555-0100,Acme Corp,CEO,Important client`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[0].email).toBe("john@example.com");
    expect(contacts[0].phone).toBe("555-0100");
    expect(contacts[0].company).toBe("Acme Corp");
    expect(contacts[0].title).toBe("CEO");
    expect(contacts[0].notes).toBe("Important client");
  });

  it('should skip rows without a name', () => {
    const csv = `name,email\n,noname@example.com\nJohn Doe,john@example.com`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
  });

  it('should handle empty CSV', () => {
    const csv = ``;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(0);
  });

  it('should handle CSV with only headers', () => {
    const csv = `name,email,phone`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(0);
  });

  it('should trim whitespace from values', () => {
    const csv = `name,email\n  John Doe  ,  john@example.com  `;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[0].email).toBe("john@example.com");
  });
});

describe('CSV Custom Field Mapping', () => {
  it('should map custom headers to contact fields', () => {
    const csv = `Full Name,Contact Email,Work Phone\nJohn Doe,john@example.com,555-0100`;
    const mapping = {
      'Full Name': 'name',
      'Contact Email': 'email',
      'Work Phone': 'phone'
    };
    
    const contacts = parseCSVWithMapping(csv, mapping);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[0].email).toBe("john@example.com");
    expect(contacts[0].phone).toBe("555-0100");
  });

  it('should ignore fields marked as ignore', () => {
    const csv = `name,extra,email\nJohn Doe,ignored,john@example.com`;
    const mapping = {
      'name': 'name',
      'extra': 'ignore',
      'email': 'email'
    };
    
    const contacts = parseCSVWithMapping(csv, mapping);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[0].email).toBe("john@example.com");
    expect(contacts[0]).not.toHaveProperty('extra');
  });

  it('should concatenate multiple fields to name', () => {
    const csv = `First,Middle,Last\nJohn,Q,Doe`;
    const mapping = {
      'First': 'name',
      'Middle': 'name',
      'Last': 'name'
    };
    
    const contacts = parseCSVWithMapping(csv, mapping);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Q Doe");
  });
});

describe('VCF Parsing', () => {
  it('should parse single vCard', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
EMAIL:john@example.com
TEL:555-0100
ORG:Acme Corp
TITLE:CEO
NOTE:Important client
END:VCARD`;
    
    const contacts = parseVCF(vcf);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[0].email).toBe("john@example.com");
    expect(contacts[0].phone).toBe("555-0100");
    expect(contacts[0].company).toBe("Acme Corp");
    expect(contacts[0].title).toBe("CEO");
    expect(contacts[0].notes).toBe("Important client");
  });

  it('should parse multiple vCards', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
EMAIL:john@example.com
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Jane Smith
EMAIL:jane@example.com
END:VCARD`;
    
    const contacts = parseVCF(vcf);
    
    expect(contacts).toHaveLength(2);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[1].name).toBe("Jane Smith");
  });

  it('should use N field when FN is missing', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
N:Doe;John;;;
EMAIL:john@example.com
END:VCARD`;
    
    const contacts = parseVCF(vcf);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
  });

  it('should skip vCards without name', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
EMAIL:noname@example.com
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:John Doe
EMAIL:john@example.com
END:VCARD`;
    
    const contacts = parseVCF(vcf);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
  });
});

describe('CSV Headers Detection', () => {
  it('should extract headers and sample data', () => {
    const csv = `name,email,phone
John Doe,john@example.com,555-0100
Jane Smith,jane@example.com,555-0200
Bob Johnson,bob@example.com,555-0300`;
    
    const result = getCSVHeaders(csv);
    
    expect(result.headers).toEqual(['name', 'email', 'phone']);
    expect(result.data).toHaveLength(3);
    expect(result.data[0]).toEqual(['John Doe', 'john@example.com', '555-0100']);
  });

  it('should limit sample data to 5 rows', () => {
    const csv = `name,email
Row1,email1
Row2,email2
Row3,email3
Row4,email4
Row5,email5
Row6,email6
Row7,email7`;
    
    const result = getCSVHeaders(csv);
    
    expect(result.headers).toEqual(['name', 'email']);
    expect(result.data).toHaveLength(5);
  });

  it('should handle empty CSV', () => {
    const csv = ``;
    const result = getCSVHeaders(csv);
    
    expect(result.headers).toEqual([]);
    expect(result.data).toEqual([]);
  });
});

describe('Manual Mapping Detection', () => {
  it('should not require mapping for VCF files', async () => {
    const file = new File(['BEGIN:VCARD\nFN:John\nEND:VCARD'], 'test.vcf', { type: 'text/vcard' });
    const needsMapping = await needsManualMapping(file);
    
    expect(needsMapping).toBe(false);
  });

  it('should not require mapping for CSV with name field', async () => {
    const csv = 'name,email\nJohn,john@example.com';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const needsMapping = await needsManualMapping(file);
    
    expect(needsMapping).toBe(false);
  });

  it('should require mapping for CSV without name field', async () => {
    const csv = 'contact,address\nJohn,123 Main St';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const needsMapping = await needsManualMapping(file);
    
    expect(needsMapping).toBe(true);
  });

  it('should require mapping for empty CSV', async () => {
    const csv = '';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const needsMapping = await needsManualMapping(file);
    
    expect(needsMapping).toBe(true);
  });
});

describe('Auto File Format Detection', () => {
  it('should detect and parse CSV files', async () => {
    const csv = 'name,email\nJohn Doe,john@example.com';
    const file = new File([csv], 'contacts.csv', { type: 'text/csv' });
    const contacts = await parseContactFile(file);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
  });

  it('should detect and parse VCF files by extension', async () => {
    const vcf = 'BEGIN:VCARD\nFN:John Doe\nEMAIL:john@example.com\nEND:VCARD';
    const file = new File([vcf], 'contacts.vcf', { type: 'text/vcard' });
    const contacts = await parseContactFile(file);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
  });

  it('should detect VCF content even without proper extension', async () => {
    const vcf = 'BEGIN:VCARD\nFN:John Doe\nEND:VCARD';
    const file = new File([vcf], 'contacts.txt', { type: 'text/plain' });
    const contacts = await parseContactFile(file);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
  });

  it('should throw error for unsupported file format', async () => {
    const file = new File(['random content'], 'contacts.txt', { type: 'text/plain' });
    
    await expect(parseContactFile(file)).rejects.toThrow('Unsupported file format');
  });
});

describe('Edge Cases', () => {
  it('should handle CSV with missing values', () => {
    const csv = `name,email,phone,company\nJohn Doe,,555-0100,\nJane Smith,jane@example.com,,Acme`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(2);
    expect(contacts[0].email).toBeUndefined();
    expect(contacts[0].phone).toBe("555-0100");
    expect(contacts[1].phone).toBeUndefined();
    expect(contacts[1].company).toBe("Acme");
  });

  it('should handle CSV with extra commas', () => {
    const csv = `name,email,extra1,extra2,extra3\nJohn Doe,john@example.com,,,`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("John Doe");
  });

  it('should handle malformed CSV lines', () => {
    const csv = `name,email\nJohn Doe,john@example.com\nIncomplete Line\nJane Smith,jane@example.com`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(2);
    expect(contacts[0].name).toBe("John Doe");
    expect(contacts[1].name).toBe("Jane Smith");
  });

  it('should handle VCF with multiple email and phone fields', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
EMAIL;TYPE=WORK:work@example.com
EMAIL;TYPE=HOME:home@example.com
TEL;TYPE=WORK:555-0100
TEL;TYPE=CELL:555-0200
END:VCARD`;
    
    const contacts = parseVCF(vcf);
    
    expect(contacts).toHaveLength(1);
    // Should capture first occurrence
    expect(contacts[0].email).toBe("work@example.com");
    expect(contacts[0].phone).toBe("555-0100");
  });

  it('should handle CSV with special characters in quoted values', () => {
    const csv = `name,notes\n"John ""The Boss"" Doe","Meeting at 9:00, don't forget!"`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe('John "The Boss" Doe');
  });

  it('should handle very long field values', () => {
    const longValue = 'A'.repeat(10000);
    const csv = `name,notes\nJohn Doe,${longValue}`;
    const contacts = parseCSV(csv);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].notes).toBe(longValue);
  });
});
