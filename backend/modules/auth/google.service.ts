// Wrapper around google-auth-library that verifies an ID token from GIS
// (Google Identity Services, the "Continue with Google" flow on the frontend)
// against the audience we registered in GCP Console.
//
// Why a thin wrapper:
//   1. Keep `google-auth-library` imports localized so the rest of the auth
//      module doesn't depend on its surface.
//   2. Translate the lib's errors into our canonical AppError envelope.
//   3. Normalize the payload to the subset of fields the rest of the system
//      cares about (sub, email, email_verified, name, picture).
//
// References:
//   - https://developers.google.com/identity/sign-in/web/backend-auth
//   - https://github.com/googleapis/google-auth-library-nodejs#verifying-id-tokens
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../../shared/errors/AppError';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';

export interface GooglePayload {
  /** Google's stable user id ("sub" claim). Unique per Google account, never reused. */
  googleId: string;
  email: string;
  emailVerified: boolean;
  /** Display name (may be empty for some Google accounts). */
  name: string;
  /** Profile picture URL (may be undefined). */
  picture?: string;
}

let cachedClient: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!config.googleClientId) {
    throw AppError.googleNotConfigured();
  }
  if (!cachedClient) {
    cachedClient = new OAuth2Client(config.googleClientId);
  }
  return cachedClient;
}

/**
 * Verify a Google ID token signed by Google's well-known JWKS.
 * Validates: signature, expiry, issuer (accounts.google.com),
 * and audience (must match config.googleClientId).
 *
 * Throws AppError(401, AUTH_GOOGLE_INVALID_TOKEN) on any verification failure.
 *
 * Does NOT enforce email_verified — that check lives one layer up so the
 * service can produce a different error code (AUTH_GOOGLE_EMAIL_UNVERIFIED)
 * with a more actionable hint.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GooglePayload> {
  const client = getClient();

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Google ID token verification failed');
    throw AppError.googleInvalidToken();
  }

  const payload = ticket.getPayload();
  if (!payload) {
    throw AppError.googleInvalidToken();
  }

  // Defensive: google-auth-library already validates issuer for the standard
  // accounts URL, but assert explicitly so a future lib update can't silently
  // accept tokens from a wider issuer pool.
  if (
    payload.iss !== 'accounts.google.com' &&
    payload.iss !== 'https://accounts.google.com'
  ) {
    logger.warn({ iss: payload.iss }, 'Google ID token has unexpected issuer');
    throw AppError.googleInvalidToken();
  }

  if (!payload.sub || !payload.email) {
    throw AppError.googleInvalidToken();
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: (payload.name || '').trim(),
    picture: payload.picture,
  };
}

// Exposed for tests so they can stub the lazy client.
export function _resetGoogleClientForTests(): void {
  cachedClient = null;
}
