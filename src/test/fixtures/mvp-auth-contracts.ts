export const MVP_AUTH_CONTRACTS = {
  signUp: {
    method: 'POST',
    path: '/api/auth/signup',
    request: {
      email: 'host@example.com',
      password: 'strong-pass',
      name: 'Host',
      ageEligible: true,
      termsVersion: '2026-09-06',
      privacyVersion: '2026-09-06',
    },
    response: {
      user: { id: 'user-1', email: 'host@example.com', name: 'Host', email_verified: false },
      verificationDelivery: 'accepted',
      message: 'Account created. Check your email for a confirmation link before signing in.',
    },
  },
  signIn: {
    method: 'POST',
    path: '/api/auth/login',
    request: { email: 'host@example.com', password: 'strong-pass' },
    response: {
      user: { id: 'user-1', email: 'host@example.com', name: 'Host', email_verified: true },
      token: 'session-token',
    },
  },
  resendVerification: {
    method: 'POST',
    path: '/api/auth/resend-verification',
    request: { email: 'host@example.com' },
    response: {
      success: true,
      message: 'If that address needs confirming and delivery succeeds, a new link will arrive shortly.',
    },
  },
  forgotPassword: {
    method: 'POST',
    path: '/api/auth/forgot-password',
    request: { email: 'host@example.com' },
    response: {
      success: true,
      message: 'If an active account exists and delivery succeeds, reset instructions will arrive shortly.',
    },
  },
  verifyEmail: {
    method: 'POST',
    path: '/api/auth/verify-email',
    request: { email: 'host@example.com', token: 'verification-token' },
    response: { success: true, message: 'Email verified successfully' },
  },
  resetPassword: {
    method: 'POST',
    path: '/api/auth/reset-password',
    request: { email: 'host@example.com', token: 'reset-token', password: 'new-strong-pass' },
    response: { success: true, message: 'Password reset successfully. Sign in with your new password.' },
  },
} as const;
