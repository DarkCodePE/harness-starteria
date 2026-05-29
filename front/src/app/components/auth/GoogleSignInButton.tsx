import { useCallback } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

/**
 * Wrapper around @react-oauth/google's <GoogleLogin> that:
 *
 *  - Returns `null` when VITE_GOOGLE_CLIENT_ID is not baked into the bundle.
 *    The corresponding <GoogleOAuthProvider> in main.tsx is also skipped in
 *    that case, so this component can't be wired up to a missing provider.
 *  - Surfaces only the `credential` string (the Google ID token JWT) to the
 *    parent via onSuccess, hiding the @react-oauth/google response shape.
 *  - Routes empty credentials through `onError` so callers don't have to
 *    null-check the success path.
 *
 * The visual styling is the GIS native button. We could swap to a custom
 * trigger via the imperative API (useGoogleLogin), but the native button is
 * what most users recognize and it handles One Tap fallback automatically.
 */

export interface GoogleSignInButtonProps {
  /** Fired with the Google-signed ID token (JWT) on successful auth. */
  onSuccess: (idToken: string) => void;
  /** Fired when GIS reports an error OR the credential is empty. */
  onError?: () => void;
  /** Button label variant. Defaults to "continue_with" (looks better on signup). */
  text?: 'continue_with' | 'signin_with' | 'signup_with' | 'signin';
  /** GIS theme. */
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  /** Button width in pixels (GIS recommends >= 200). */
  width?: number;
  /** Disable while a parent flow is in flight (e.g. while the backend POST resolves). */
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'continue_with',
  theme = 'outline',
  width = 320,
  disabled = false,
}: GoogleSignInButtonProps) {
  // The provider is only mounted when VITE_GOOGLE_CLIENT_ID is present
  // (see main.tsx). Without the env, render nothing rather than throwing.
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  const handleSuccess = useCallback(
    (response: CredentialResponse) => {
      if (response.credential) {
        onSuccess(response.credential);
      } else {
        onError?.();
      }
    },
    [onSuccess, onError],
  );

  const handleError = useCallback(() => {
    onError?.();
  }, [onError]);

  return (
    <div style={disabled ? { pointerEvents: 'none', opacity: 0.5 } : undefined}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        text={text}
        theme={theme}
        width={width}
        shape="rectangular"
        logo_alignment="center"
        locale="es"
      />
    </div>
  );
}
