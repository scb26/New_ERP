/**
 * GS1 Standard Modulo-10 Check Digit Validator & Temporal Consensus Engine
 * Supports: EAN-13, EAN-8, UPC-A (12 digits), ITF-14
 * Mathematical Guarantee: Catches 100% of single-digit substitution errors (e.g. 8 misread as 3)
 * and 89% of adjacent transposition errors.
 */

export function isValidGS1Barcode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  
  // Gate 1: Pure digits only & strict retail length whitelist (8, 12, 13, 14)
  const clean = code.trim();
  if (!/^\d+$/.test(clean)) return false;
  if (![8, 12, 13, 14].includes(clean.length)) return false;

  // Gate 2: Modulo-10 weighted calculation
  const digits = clean.split('').map(Number);
  const checkDigit = digits[digits.length - 1];
  const payloadDigits = digits.slice(0, -1);

  // Read right-to-left, alternating weights of 3 and 1
  let sum = 0;
  let weight = 3;

  for (let i = payloadDigits.length - 1; i >= 0; i--) {
    sum += payloadDigits[i] * weight;
    weight = weight === 3 ? 1 : 3;
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

/**
 * Extracts and validates any candidate barcode numbers found in a raw OCR string
 */
export function extractValidBarcodesFromText(text: string): string[] {
  if (!text) return [];
  // Find all sequences of 8 to 14 consecutive digits
  const matches = text.match(/\b\d{8,14}\b/g) || [];
  const valid: string[] = [];
  for (const candidate of matches) {
    if (isValidGS1Barcode(candidate) && !valid.includes(candidate)) {
      valid.push(candidate);
    }
  }
  return valid;
}

/**
 * Temporal Consensus Filter for Video OCR
 * Requires consecutive matching frames within a sliding time window
 * before acknowledging the reading as verified.
 */
export class OcrConsensusFilter {
  private history: { code: string; timestamp: number }[] = [];
  private lastFiredCode: string = '';
  private lastFiredTime: number = 0;
  private readonly requiredMatches: number = 2; // Fast 2-frame quorum for high speed
  private readonly windowMs: number = 600;
  private readonly cooldownMs: number = 2000;

  public processOcrCandidate(rawText: string): string | null {
    const now = Date.now();
    const candidates = extractValidBarcodesFromText(rawText);
    if (candidates.length === 0) return null;

    const candidate = candidates[0];

    // 1. Cooldown check (prevent repeated multi-billing of the same item)
    if (candidate === this.lastFiredCode && now - this.lastFiredTime < this.cooldownMs) {
      return null;
    }

    // 2. Sliding window eviction
    this.history = this.history.filter(h => now - h.timestamp <= this.windowMs);
    this.history.push({ code: candidate, timestamp: now });

    // 3. Count matching occurrences in active window
    const matches = this.history.filter(h => h.code === candidate).length;
    if (matches >= this.requiredMatches) {
      this.lastFiredCode = candidate;
      this.lastFiredTime = now;
      this.history = []; // Reset window on trigger
      return candidate;
    }

    return null;
  }

  public reset(): void {
    this.history = [];
    this.lastFiredCode = '';
    this.lastFiredTime = 0;
  }
}
