import bcrypt from "bcryptjs";

/**
 * Default salt rounds for bcrypt hashing
 * Higher values = more secure but slower
 * 12 is a good balance between security and performance
 */
const SALT_ROUNDS = 12;

/**
 * Minimum password length requirement
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Maximum password length to prevent DoS attacks
 */
const MAX_PASSWORD_LENGTH = 128;

/**
 * Password strength requirements
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Default password requirements for the system
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: MIN_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @param saltRounds - Number of salt rounds (default: 12)
 * @returns Hashed password
 */
export async function hashPassword(
  password: string,
  saltRounds: number = SALT_ROUNDS
): Promise<string> {
  if (!password) {
    throw new Error("Password is required");
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
  }

  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Check if a password needs to be rehashed (e.g., if salt rounds changed)
 * @param hash - Current password hash
 * @param saltRounds - Desired salt rounds
 * @returns True if password should be rehashed
 */
export function needsRehash(
  hash: string,
  saltRounds: number = SALT_ROUNDS
): boolean {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds !== saltRounds;
  } catch (error) {
    return true;
  }
}

/**
 * Validate password strength based on requirements
 * @param password - Password to validate
 * @param requirements - Password requirements (optional)
 * @returns Object with isValid flag and array of error messages
 */
export function validatePasswordStrength(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password) {
    return { isValid: false, errors: ["Password is required"] };
  }

  // Check length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
  }

  // Check for uppercase letters
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check for lowercase letters
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check for numbers
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check for special characters
  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength score (0-4)
 * @param password - Password to evaluate
 * @returns Score from 0 (very weak) to 4 (very strong)
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (!password) {
    return { score: 0, label: "Very Weak", feedback: ["Password is empty"] };
  }

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  else feedback.push("Use at least 12 characters for better security");

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("Use both uppercase and lowercase letters");
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push("Include numbers");
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push("Include special characters");
  }

  // Common password patterns (weak)
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
  ];

  if (commonPatterns.some((pattern) => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common password patterns");
  }

  // Normalize score to 0-4 range
  score = Math.min(4, Math.max(0, score));

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const label = labels[score];

  return { score, label, feedback };
}

/**
 * Generate a random password
 * @param length - Desired password length (default: 16)
 * @param includeSpecialChars - Include special characters (default: true)
 * @returns Generated password
 */
export function generateRandomPassword(
  length: number = 16,
  includeSpecialChars: boolean = true
): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let charset = lowercase + uppercase + numbers;
  if (includeSpecialChars) {
    charset += specialChars;
  }

  let password = "";

  // Ensure at least one of each required character type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  if (includeSpecialChars) {
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
  }

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Check if a password is compromised (basic checks)
 * Note: For production, consider using the "Have I Been Pwned" API
 * @param password - Password to check
 * @returns Object with isCompromised flag and reason
 */
export function checkCommonPasswords(password: string): {
  isCompromised: boolean;
  reason?: string;
} {
  // Common weak passwords
  const commonPasswords = [
    "password",
    "123456",
    "123456789",
    "12345678",
    "12345",
    "1234567",
    "password123",
    "qwerty",
    "abc123",
    "monkey",
    "1234567890",
    "letmein",
    "trustno1",
    "dragon",
    "baseball",
    "iloveyou",
    "master",
    "sunshine",
    "ashley",
    "bailey",
    "shadow",
    "superman",
    "admin",
    "admin123",
  ];

  const lowerPassword = password.toLowerCase();

  if (commonPasswords.includes(lowerPassword)) {
    return {
      isCompromised: true,
      reason: "This password is commonly used and easily guessed",
    };
  }

  // Check for simple patterns
  if (/^(.)\1+$/.test(password)) {
    return {
      isCompromised: true,
      reason: "Password contains repeated characters only",
    };
  }

  if (/^(012|123|234|345|456|567|678|789|890)+$/.test(password)) {
    return {
      isCompromised: true,
      reason: "Password contains sequential numbers",
    };
  }

  return { isCompromised: false };
}
