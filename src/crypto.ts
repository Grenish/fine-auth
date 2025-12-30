import {
  scrypt as scryptCallback,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
// Manual wrapper to avoid potential promisify issues in generic builds
const scrypt = (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
};

/**
 * Hash a password using scrypt
 * Format: salt:hash (both hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a password against a stored hash
 * Uses timing-safe comparison to prevent timing attacks
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const parts = storedHash.split(":");

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return false;
    }

    const saltHex = parts[0];
    const hashHex = parts[1];

    // Create fresh buffers each time
    const salt = Buffer.from(saltHex, "hex");
    const storedKey = Buffer.from(hashHex, "hex");

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    // Timing-safe comparison
    return timingSafeEqual(storedKey, derivedKey);
  } catch (error) {
    return false;
  }
}

/**
 * Generate a cryptographically secure session ID
 * Returns a 32-byte hex string (64 characters)
 */
export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generate a cryptographically secure user ID
 * Returns a 16-byte hex string (32 characters)
 */
export function generateUserId(): string {
  return randomBytes(16).toString("hex");
}
