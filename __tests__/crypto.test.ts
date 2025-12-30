import { describe, test, expect } from "bun:test";
import {
  signSessionId,
  verifySessionId,
  generateSessionId,
} from "../src/crypto";

describe("Crypto - Session Signing", () => {
  const secret = "test-secret-123";

  test("should sign and verify a session ID", async () => {
    const sessionId = generateSessionId();
    const token = await signSessionId(sessionId, secret);

    expect(token).not.toBe(sessionId);
    expect(token).toContain(".");

    const verifiedId = await verifySessionId(token, secret);
    expect(verifiedId).toBe(sessionId);
  });

  test("should fail verification with wrong secret", async () => {
    const sessionId = generateSessionId();
    const token = await signSessionId(sessionId, secret);
    const wrongSecret = "wrong-secret";

    const verifiedId = await verifySessionId(token, wrongSecret);
    expect(verifiedId).toBeNull();
  });

  test("should fail verification for tampered token", async () => {
    const sessionId = generateSessionId();
    const token = await signSessionId(sessionId, secret);

    // Tamper with the signature part
    const tamperedToken = token + "a";

    const verifiedId = await verifySessionId(tamperedToken, secret);
    expect(verifiedId).toBeNull();
  });

  test("should fail verification for malformed token", async () => {
    const verifiedId = await verifySessionId(
      "malformed-token-without-dot",
      secret
    );
    expect(verifiedId).toBeNull();
  });
});
