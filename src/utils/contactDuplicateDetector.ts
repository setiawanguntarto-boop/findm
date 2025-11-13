import { Contact } from "@/pages/Dashboard";

export interface DuplicateGroup {
  contacts: Contact[];
  confidence: 'high' | 'medium' | 'low';
  matchReasons: string[];
  score: number;
}

export interface SimilarityScore {
  email: number;
  phone: number;
  name: number;
  company: number;
  overall: number;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings (0-100)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  return Math.round((1 - distance / maxLen) * 100);
}

/**
 * Normalize phone number for comparison
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  // Remove all non-numeric characters except '+'
  const normalized = phone.replace(/[^\d+]/g, '');
  // For US numbers, consider last 10 digits
  if (normalized.length >= 10 && !normalized.startsWith('+')) {
    return normalized.slice(-10);
  }
  return normalized;
}

/**
 * Extract email domain
 */
function extractEmailDomain(email: string | null | undefined): string {
  if (!email) return '';
  const parts = email.toLowerCase().split('@');
  return parts.length > 1 ? parts[1] : '';
}

/**
 * Normalize name for comparison (remove titles, punctuation)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|dr|prof|jr|sr|ii|iii|iv)\b\.?/gi, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Calculate similarity score between two contacts
 */
export function calculateSimilarity(contact1: Contact, contact2: Contact): SimilarityScore {
  const emailScore = contact1.email && contact2.email && 
    contact1.email.toLowerCase() === contact2.email.toLowerCase() ? 100 : 0;
  
  const phone1 = normalizePhone(contact1.phone);
  const phone2 = normalizePhone(contact2.phone);
  const phoneScore = phone1 && phone2 && phone1 === phone2 ? 100 : 0;
  
  const name1 = normalizeName(contact1.name);
  const name2 = normalizeName(contact2.name);
  const nameScore = calculateStringSimilarity(name1, name2);
  
  const company1 = contact1.company?.toLowerCase().trim() || '';
  const company2 = contact2.company?.toLowerCase().trim() || '';
  const companyScore = company1 && company2 ? calculateStringSimilarity(company1, company2) : 0;
  
  // Calculate overall weighted score
  let overall = 0;
  let weights = 0;
  
  if (emailScore > 0) {
    overall += emailScore * 2; // Email is strongest indicator
    weights += 2;
  }
  if (phoneScore > 0) {
    overall += phoneScore * 2; // Phone is also strong
    weights += 2;
  }
  if (nameScore > 0) {
    overall += nameScore * 1.5;
    weights += 1.5;
  }
  if (companyScore > 0) {
    overall += companyScore * 1;
    weights += 1;
  }
  
  const finalScore = weights > 0 ? overall / weights : 0;
  
  return {
    email: emailScore,
    phone: phoneScore,
    name: nameScore,
    company: companyScore,
    overall: Math.round(finalScore),
  };
}

/**
 * Determine if two contacts are duplicates and get match reasons
 */
function isDuplicatePair(
  contact1: Contact,
  contact2: Contact,
  dismissedPairs: Set<string>
): { isDuplicate: boolean; confidence: 'high' | 'medium' | 'low'; reasons: string[]; score: number } | null {
  // Check if this pair has been dismissed
  const pairKey1 = `${contact1.id}-${contact2.id}`;
  const pairKey2 = `${contact2.id}-${contact1.id}`;
  if (dismissedPairs.has(pairKey1) || dismissedPairs.has(pairKey2)) {
    return null;
  }
  
  const similarity = calculateSimilarity(contact1, contact2);
  const reasons: string[] = [];
  
  // High confidence matches (exact matches on key fields)
  if (similarity.email === 100) {
    reasons.push('Same email address');
    return { isDuplicate: true, confidence: 'high', reasons, score: 100 };
  }
  
  if (similarity.phone === 100) {
    reasons.push('Same phone number');
    return { isDuplicate: true, confidence: 'high', reasons, score: 100 };
  }
  
  // Strong matches (exact name + company or very similar name + phone/email)
  if (similarity.name >= 90 && similarity.company >= 90) {
    reasons.push('Same name and company');
    return { isDuplicate: true, confidence: 'high', reasons, score: 95 };
  }
  
  if (similarity.name >= 85 && similarity.phone === 100) {
    reasons.push('Same phone with similar name');
    return { isDuplicate: true, confidence: 'high', reasons, score: 92 };
  }
  
  if (similarity.name >= 85 && contact1.email && contact2.email && 
      extractEmailDomain(contact1.email) === extractEmailDomain(contact2.email)) {
    reasons.push('Similar name with same email domain');
    return { isDuplicate: true, confidence: 'high', reasons, score: 88 };
  }
  
  // Medium confidence matches (fuzzy matching)
  if (similarity.name >= 75 && similarity.company >= 80) {
    reasons.push('Similar name and company');
    return { isDuplicate: true, confidence: 'medium', reasons, score: 75 };
  }
  
  if (similarity.name >= 80 && similarity.company >= 60) {
    reasons.push('Very similar name with company match');
    return { isDuplicate: true, confidence: 'medium', reasons, score: 72 };
  }
  
  // Lower threshold for initials vs full name
  const name1 = normalizeName(contact1.name);
  const name2 = normalizeName(contact2.name);
  const hasInitials = name1.length <= 3 || name2.length <= 3 || 
                      name1.includes('.') || name2.includes('.');
  
  if (hasInitials && similarity.name >= 60 && 
      (similarity.phone === 100 || similarity.company >= 85)) {
    reasons.push('Name variation (initials) with matching details');
    return { isDuplicate: true, confidence: 'medium', reasons, score: 68 };
  }
  
  // Low confidence - similar names only
  if (similarity.name >= 85) {
    reasons.push('Very similar or same name');
    return { isDuplicate: true, confidence: 'low', reasons, score: 60 };
  }
  
  return null;
}

/**
 * Find all duplicate groups in a contact list
 */
export function findDuplicateGroups(
  contacts: Contact[],
  dismissedPairs: Set<string> = new Set()
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < contacts.length; i++) {
    if (processed.has(contacts[i].id)) continue;
    
    const group: Contact[] = [contacts[i]];
    const matchReasons: string[] = [];
    let highestScore = 0;
    let highestConfidence: 'high' | 'medium' | 'low' = 'low';
    
    for (let j = i + 1; j < contacts.length; j++) {
      if (processed.has(contacts[j].id)) continue;
      
      const match = isDuplicatePair(contacts[i], contacts[j], dismissedPairs);
      
      if (match?.isDuplicate) {
        group.push(contacts[j]);
        processed.add(contacts[j].id);
        
        // Track highest confidence and score
        if (match.score > highestScore) {
          highestScore = match.score;
          highestConfidence = match.confidence;
        }
        
        // Add unique reasons
        match.reasons.forEach(reason => {
          if (!matchReasons.includes(reason)) {
            matchReasons.push(reason);
          }
        });
      }
    }
    
    // Only create a group if we found duplicates
    if (group.length > 1) {
      processed.add(contacts[i].id);
      groups.push({
        contacts: group,
        confidence: highestConfidence,
        matchReasons,
        score: highestScore,
      });
    }
  }
  
  // Sort groups by confidence and score
  return groups.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    return confDiff !== 0 ? confDiff : b.score - a.score;
  });
}

/**
 * Get dismissed pairs from localStorage
 */
export function getDismissedPairs(userId: string): Set<string> {
  try {
    const stored = localStorage.getItem(`dismissed-duplicates-${userId}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Save dismissed pairs to localStorage
 */
export function saveDismissedPair(userId: string, contactId1: string, contactId2: string): void {
  try {
    const dismissed = getDismissedPairs(userId);
    dismissed.add(`${contactId1}-${contactId2}`);
    dismissed.add(`${contactId2}-${contactId1}`);
    localStorage.setItem(`dismissed-duplicates-${userId}`, JSON.stringify([...dismissed]));
  } catch (error) {
    console.error('Failed to save dismissed pair:', error);
  }
}
