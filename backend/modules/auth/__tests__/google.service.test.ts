import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/AppError';

// We stub google-auth-library's OAuth2Client.verifyIdToken at the module
// boundary. The service code imports OAuth2Client once and instantiates a
// single client lazily; _resetGoogleClientForTests() ensures each test gets
// a fresh client wired to the current mock implementation.
const verifyIdTokenMock = vi.fn();

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: verifyIdTokenMock,
  })),
}));

// Ensure the verify path has a client_id to construct the client.
// (config reads GOOGLE_CLIENT_ID once at module load — we set it here before
// importing the service.)
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

// Late imports so the env var above lands before config reads it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyGoogleIdToken, _resetGoogleClientForTests } = await import('../google.service');

function makePayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    iss: 'https://accounts.google.com',
    sub: '1234567890',
    email: 'jane@example.com',
    email_verified: true,
    name: 'Jane Doe',
    picture: 'https://lh3.googleusercontent.com/a/abc',
    aud: 'test-client-id.apps.googleusercontent.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

function makeTicket(payload: unknown) {
  return { getPayload: () => payload };
}

describe('modules/auth/google.service', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    _resetGoogleClientForTests();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyGoogleIdToken (happy path)', () => {
    it('returns normalized GooglePayload for a valid token', async () => {
      verifyIdTokenMock.mockResolvedValueOnce(makeTicket(makePayload()));

      const result = await verifyGoogleIdToken('valid-token-string');

      expect(result).toEqual({
        googleId: '1234567890',
        email: 'jane@example.com',
        emailVerified: true,
        name: 'Jane Doe',
        picture: 'https://lh3.googleusercontent.com/a/abc',
      });
    });

    it('lowercases the email', async () => {
      verifyIdTokenMock.mockResolvedValueOnce(
        makeTicket(makePayload({ email: 'Mixed.Case@Example.com' })),
      );

      const result = await verifyGoogleIdToken('valid-token-string');

      expect(result.email).toBe('mixed.case@example.com');
    });

    it('passes audience to the underlying client', async () => {
      verifyIdTokenMock.mockResolvedValueOnce(makeTicket(makePayload()));

      await verifyGoogleIdToken('valid-token-string');

      expect(verifyIdTokenMock).toHaveBeenCalledWith({
        idToken: 'valid-token-string',
        audience: 'test-client-id.apps.googleusercontent.com',
      });
    });

    it('returns emailVerified: false when google reports unverified', async () => {
      verifyIdTokenMock.mockResolvedValueOnce(
        makeTicket(makePayload({ email_verified: false })),
      );

      const result = await verifyGoogleIdToken('valid-token-string');

      expect(result.emailVerified).toBe(false);
    });
  });

  describe('verifyGoogleIdToken (rejections)', () => {
    it('throws AUTH_GOOGLE_INVALID_TOKEN when verifyIdToken rejects', async () => {
      verifyIdTokenMock.mockRejectedValueOnce(new Error('Wrong number of segments'));

      try {
        await verifyGoogleIdToken('garbage');
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(401);
        expect((err as AppError).code).toBe('AUTH_GOOGLE_INVALID_TOKEN');
      }
    });

    it('throws AUTH_GOOGLE_INVALID_TOKEN when payload is null', async () => {
      verifyIdTokenMock.mockResolvedValueOnce(makeTicket(null));

      await expect(verifyGoogleIdToken('weird-token')).rejects.toMatchObject({
        statusCode: 401,
        code: 'AUTH_GOOGLE_INVALID_TOKEN',
      });
    });

    it('throws AUTH_GOOGLE_INVALID_TOKEN when issuer is unexpected', async () => {
      verifyIdTokenMock.mockResolvedValueOnce(
        makeTicket(makePayload({ iss: 'https://attacker.example.com' })),
      );

      await expect(verifyGoogleIdToken('valid-shape')).rejects.toMatchObject({
        code: 'AUTH_GOOGLE_INVALID_TOKEN',
      });
    });

    it('throws AUTH_GOOGLE_INVALID_TOKEN when sub is missing', async () => {
      verifyIdTokenMock.mockResolvedValueOnce(
        makeTicket(makePayload({ sub: undefined })),
      );

      await expect(verifyGoogleIdToken('valid-shape')).rejects.toMatchObject({
        code: 'AUTH_GOOGLE_INVALID_TOKEN',
      });
    });

    it('throws AUTH_GOOGLE_INVALID_TOKEN when email is missing', async () => {
      verifyIdTokenMock.mockResolvedValueOnce(
        makeTicket(makePayload({ email: undefined })),
      );

      await expect(verifyGoogleIdToken('valid-shape')).rejects.toMatchObject({
        code: 'AUTH_GOOGLE_INVALID_TOKEN',
      });
    });
  });
});
