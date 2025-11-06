export interface ParsedContact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  notes?: string;
}

// Parse CSV file
export const parseCSV = (content: string): ParsedContact[] => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const contacts: ParsedContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const contact: ParsedContact = {
      name: '',
    };

    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      if (!value) return;

      // Map common CSV headers to our contact fields
      if (header.includes('name') || header.includes('full name')) {
        contact.name = value;
      } else if (header.includes('first') && header.includes('name')) {
        contact.name = value + (contact.name ? ' ' + contact.name : '');
      } else if (header.includes('last') && header.includes('name')) {
        contact.name = (contact.name ? contact.name + ' ' : '') + value;
      } else if (header.includes('email') || header.includes('e-mail')) {
        contact.email = value;
      } else if (header.includes('phone') || header.includes('mobile') || header.includes('tel')) {
        contact.phone = value;
      } else if (header.includes('company') || header.includes('organization')) {
        contact.company = value;
      } else if (header.includes('title') || header.includes('job') || header.includes('position')) {
        contact.title = value;
      } else if (header.includes('note') || header.includes('comment')) {
        contact.notes = value;
      }
    });

    // Only add contacts with at least a name
    if (contact.name) {
      contacts.push(contact);
    }
  }

  return contacts;
};

// Helper to parse CSV line handling quoted values
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

// Parse VCF (vCard) file
export const parseVCF = (content: string): ParsedContact[] => {
  const contacts: ParsedContact[] = [];
  const vCards = content.split('BEGIN:VCARD');

  for (const vCard of vCards) {
    if (!vCard.trim()) continue;

    const contact: ParsedContact = {
      name: '',
    };

    const lines = vCard.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Parse name (FN = formatted name)
      if (trimmedLine.startsWith('FN:')) {
        contact.name = trimmedLine.substring(3).trim();
      }
      // Alternative: N field (structured name)
      else if (trimmedLine.startsWith('N:') && !contact.name) {
        const parts = trimmedLine.substring(2).split(';');
        contact.name = `${parts[1] || ''} ${parts[0] || ''}`.trim();
      }
      // Email
      else if (trimmedLine.startsWith('EMAIL')) {
        const emailMatch = trimmedLine.match(/:(.*)/);
        if (emailMatch) {
          contact.email = emailMatch[1].trim();
        }
      }
      // Phone
      else if (trimmedLine.startsWith('TEL')) {
        const phoneMatch = trimmedLine.match(/:(.*)/);
        if (phoneMatch) {
          contact.phone = phoneMatch[1].trim();
        }
      }
      // Organization
      else if (trimmedLine.startsWith('ORG:')) {
        contact.company = trimmedLine.substring(4).trim();
      }
      // Title
      else if (trimmedLine.startsWith('TITLE:')) {
        contact.title = trimmedLine.substring(6).trim();
      }
      // Note
      else if (trimmedLine.startsWith('NOTE:')) {
        contact.notes = trimmedLine.substring(5).trim();
      }
    }

    // Only add contacts with at least a name
    if (contact.name) {
      contacts.push(contact);
    }
  }

  return contacts;
};

// Auto-detect file format and parse
export const parseContactFile = async (file: File): Promise<ParsedContact[]> => {
  const content = await file.text();
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.vcf') || content.includes('BEGIN:VCARD')) {
    return parseVCF(content);
  } else if (fileName.endsWith('.csv')) {
    return parseCSV(content);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or VCF file.');
  }
};
