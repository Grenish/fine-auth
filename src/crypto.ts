import { scrypt, randomBytes, timingSafeEqual } from "crypto";

/**
 * Hash a password using scrypt
 * Format: salt:hash (both hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16);

    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(`${salt.toString("hex")}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verify a password against a stored hash
 * Uses timing-safe comparison to prevent timing attacks
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [saltHex, hashHex] = storedHash.split(":");

    if (!saltHex || !hashHex) {
      resolve(false);
      return;
    }

    const salt = Buffer.from(saltHex, "hex");
    const storedKey = Buffer.from(hashHex, "hex");

    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      // Timing-safe comparison
      resolve(timingSafeEqual(storedKey, derivedKey));
    });
  });
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
