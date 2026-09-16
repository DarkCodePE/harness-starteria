import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoogleSignInButton } from '../GoogleSignInButton';

// Stub @react-oauth/google's <GoogleLogin>: render a button, expose onSuccess
// via a known click so we can simulate Google returning a credential.
const onSuccessSpy = vi.fn();
const onErrorSpy = vi.fn();

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({
    onSuccess,
    onError,
    text,
  }: {
    onSuccess: (res: { credential?: string }) => void;
    onError: () => void;
    text: string;
  }) => (
    <div>
      <button
        type="button"
        data-testid="google-trigger"
        onClick={() => onSuccess({ credential: 'fake-id-token' })}
      >
        {text}
      </button>
      <button
        type="button"
        data-testid="google-trigger-empty"
        onClick={() => onSuccess({})}
      >
        empty-credential
      </button>
      <button
        type="button"
        data-testid="google-trigger-error"
        onClick={() => onError()}
      >
        trigger-error
      </button>
    </div>
  ),
}));

describe('app/components/auth/GoogleSignInButton', () => {
  beforeEach(() => {
    onSuccessSpy.mockReset();
    onErrorSpy.mockReset();
    // Pretend the env is configured so the component renders.
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client.apps.googleusercontent.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders nothing when VITE_GOOGLE_CLIENT_ID is missing', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const { container } = render(<GoogleSignInButton onSuccess={onSuccessSpy} />);
    expect(container.firstChild).toBeNull();
  });

  it('passes the configured text prop down to <GoogleLogin>', () => {
    render(
      <GoogleSignInButton onSuccess={onSuccessSpy} text="signin_with" />,
    );
    expect(screen.getByTestId('google-trigger')).toHaveTextContent('signin_with');
  });

  it('defaults to continue_with', () => {
    render(<GoogleSignInButton onSuccess={onSuccessSpy} />);
    expect(screen.getByTestId('google-trigger')).toHaveTextContent('continue_with');
  });

  it('forwards the credential string to onSuccess', () => {
    render(<GoogleSignInButton onSuccess={onSuccessSpy} onError={onErrorSpy} />);
    screen.getByTestId('google-trigger').click();
    expect(onSuccessSpy).toHaveBeenCalledWith('fake-id-token');
    expect(onErrorSpy).not.toHaveBeenCalled();
  });

  it('falls through to onError when credential is empty', () => {
    render(<GoogleSignInButton onSuccess={onSuccessSpy} onError={onErrorSpy} />);
    screen.getByTestId('google-trigger-empty').click();
    expect(onSuccessSpy).not.toHaveBeenCalled();
    expect(onErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('forwards GIS errors to onError', () => {
    render(<GoogleSignInButton onSuccess={onSuccessSpy} onError={onErrorSpy} />);
    screen.getByTestId('google-trigger-error').click();
    expect(onErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('does not crash when onError is omitted and GIS errors', () => {
    render(<GoogleSignInButton onSuccess={onSuccessSpy} />);
    expect(() => {
      screen.getByTestId('google-trigger-empty').click();
      screen.getByTestId('google-trigger-error').click();
    }).not.toThrow();
  });
});
