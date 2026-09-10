import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Linking } from 'react-native';
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  LEGAL_URLS,
  MINIMUM_ACCOUNT_AGE,
} from '@partyhause/core';
import { api } from '@/lib/client';

interface AuthScreenProps {
  onBackToLanding: () => void;
  onAuthSuccess: () => void;
}

/** Matches the server's rule (server/routes/auth.ts). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthScreen = ({ onBackToLanding, onAuthSuccess }: AuthScreenProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  /**
   * Signup consent, captured rather than assumed.
   *
   * `api.auth.signUp` requires a SignupConsent, and the server records the
   * accepted document versions against the account. Passing `ageEligible: true`
   * without asking would make the stored record a statement the user never
   * made, which is worse than having no record: it is a false one, and it is
   * the record that would be produced if the assertion were ever challenged.
   */
  const [ageEligible, setAgeEligible] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  /**
   * Account-recovery state.
   *
   * Mobile had no recovery path of any kind. `api.auth.forgotPassword` and
   * `api.auth.resendVerification` both existed in @partyhause/core and neither
   * had a call site, so a user who forgot their password, or who signed up and
   * never clicked the confirmation link, was permanently locked out of the app
   * with no control anywhere on this screen to do anything about it.
   */
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  /** Set when login answers 403 EMAIL_NOT_VERIFIED, so we offer a resend first. */
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [recoveryBusy, setRecoveryBusy] = useState(false);

  /**
   * Request a password-reset link.
   *
   * Also the way out for an account whose address was never confirmed:
   * POST /api/auth/reset-password sets email_verified on success, because a
   * single-use link delivered to the mailbox proves the same control the
   * confirmation link does.
   *
   * The wording stays conditional because the server answers identically for a
   * registered and an unregistered address, and stating "we sent it" would
   * leak the difference.
   */
  const handleForgotPassword = async () => {
    const target = (unverifiedEmail ?? email).trim();
    if (!EMAIL_RE.test(target)) {
      setMessage({ type: 'error', text: 'Enter the email address on your account first.' });
      return;
    }

    setRecoveryBusy(true);
    setMessage(null);
    const { error } = await api.auth.forgotPassword(target);
    setRecoveryBusy(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setRecoveryOpen(false);
    setMessage({
      type: 'success',
      text: `If an account exists for ${target}, a reset link is on its way. It expires in an hour, and using it also confirms your email address.`,
    });
  };

  /** Re-send the confirmation email. Anonymous: a locked-out user has no session. */
  const handleResendVerification = async () => {
    const target = (unverifiedEmail ?? email).trim();
    if (!EMAIL_RE.test(target)) {
      setMessage({ type: 'error', text: 'Enter the email address on your account first.' });
      return;
    }

    setRecoveryBusy(true);
    setMessage(null);
    const { error } = await api.auth.resendVerification(target);
    setRecoveryBusy(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({
      type: 'success',
      text: `Confirmation email sent to ${target}. Check your inbox and spam folder.`,
    });
  };

  /**
   * Sign in. This is the only path that produces a session.
   *
   * The client has persisted the token and the cached user together by the
   * time this resolves, so handing control to `onAuthSuccess` is safe here.
   */
  const performSignIn = async () => {
    const { error } = await api.auth.signIn(email.trim(), password.trim());

    if (error) {
      // A correct password on an unconfirmed address is not a credential
      // failure and must not be shown as one: the remedy is a resend, not a
      // retry. The server marks it explicitly rather than leaving the client
      // to guess from a status code.
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email.trim());
        setRecoveryOpen(false);
        setMessage({
          type: 'error',
          text: 'Your password was correct, but this email has not been confirmed yet.',
        });
        return;
      }
      setUnverifiedEmail(null);
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setMessage({ type: 'success', text: 'Welcome back!' });
    onAuthSuccess();
  };

  /**
   * Create an account. This deliberately does NOT sign the user in.
   *
   * `POST /api/auth/signup` returns no token on purpose
   * (`server/routes/auth.ts:347-350`): the address has to be confirmed first,
   * because the route previously handed a 7-day credential to a mailbox nobody
   * had proven they controlled.
   *
   * This used to call `onAuthSuccess()` under a message reading "Signing you
   * in...". That ran `checkAuth`, which found no token, and dropped the new
   * user back on the marketing landing screen with the message unmounted
   * before it could be read. The server's own instruction, "check your email",
   * sat unread on `result.data.message`. An App Store reviewer creating a test
   * account hit that on their first interaction.
   *
   * So: switch to the sign-in form, seed `unverifiedEmail` so the resend panel
   * is already open, and say what actually happened.
   */
  const performSignUp = async () => {
    // Precondition, re-asserted at the point of use. `SignupConsent.ageEligible`
    // is typed as the literal `true`, not `boolean`, so a consent record
    // claiming otherwise is unrepresentable. Checking here rather than casting
    // keeps that guarantee real, and makes this function safe to call
    // independently of the submit guard in handleAuth.
    if (!ageEligible || !legalAccepted) {
      setMessage({
        type: 'error',
        text: `Confirm you are at least ${MINIMUM_ACCOUNT_AGE} and accept the Terms and Privacy Policy.`,
      });
      return;
    }

    const address = email.trim();
    const { data, error } = await api.auth.signUp(
      address,
      password.trim(),
      name.trim() || address.split('@')[0],
      {
        // The captured value, not a literal `true`. The submit guard above
        // already blocks an unchecked box, but recording consent the user did
        // not give would make the stored attestation a false one.
        ageEligible,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
      },
    );

    if (error) {
      setUnverifiedEmail(null);
      setMessage({ type: 'error', text: error.message });
      return;
    }

    // Move to the sign-in form with the confirmation panel already showing.
    setIsLogin(true);
    setPassword('');
    setAgeEligible(false);
    setLegalAccepted(false);
    setRecoveryOpen(false);
    setUnverifiedEmail(address);

    // 'unavailable' means the account exists but no mail went out. Reporting
    // that as success would send the user to an inbox that will stay empty.
    if (data?.verificationDelivery === 'unavailable') {
      setMessage({
        type: 'error',
        text: `Account created, but the confirmation email to ${address} could not be sent. Use "Resend confirmation email" below.`,
      });
      return;
    }

    setMessage({
      type: 'success',
      text:
        data?.message ??
        `Account created. Check ${address} for a confirmation link, then sign in.`,
    });
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Please enter email and password' });
      return;
    }

    if (!isLogin && !name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your name' });
      return;
    }

    if (!isLogin && (!ageEligible || !legalAccepted)) {
      setMessage({
        type: 'error',
        text: `Confirm you are at least ${MINIMUM_ACCOUNT_AGE} and accept the Terms and Privacy Policy.`,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // The two flows are deliberately not a ternary any more. They differ in
      // the one way that matters: sign-in establishes a session and sign-up
      // does not, so they cannot share a success path.
      if (isLogin) {
        await performSignIn();
      } else {
        await performSignUp();
      }
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error
          ? error.message
          : `Failed to ${isLogin ? 'sign in' : 'sign up'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={onBackToLanding}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>🎉</Text>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back!' : 'Join PartyHause'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Sign in to continue' : 'Create your account to get started'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />

              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => setAgeEligible((v) => !v)}
                disabled={loading}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ageEligible }}
              >
                <View style={[styles.checkbox, ageEligible && styles.checkboxChecked]}>
                  {ageEligible ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={styles.consentText}>
                  I confirm I am at least {MINIMUM_ACCOUNT_AGE} years old.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => setLegalAccepted((v) => !v)}
                disabled={loading}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: legalAccepted }}
              >
                <View style={[styles.checkbox, legalAccepted && styles.checkboxChecked]}>
                  {legalAccepted ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={styles.consentText}>
                  I accept the{' '}
                  <Text style={styles.consentLink} onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
                    Terms
                  </Text>{' '}
                  and{' '}
                  <Text style={styles.consentLink} onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Account recovery. Login only: neither action means anything while
              creating an account. */}
          {isLogin && unverifiedEmail && (
            <View style={styles.recoveryBox}>
              <Text style={styles.recoveryTitle}>Confirm your email to sign in</Text>
              <Text style={styles.recoveryBody}>
                {unverifiedEmail} has not been confirmed yet.
              </Text>
              <TouchableOpacity
                style={[styles.recoveryPrimary, recoveryBusy && styles.buttonDisabled]}
                onPress={handleResendVerification}
                disabled={recoveryBusy || loading}
              >
                {recoveryBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Resend confirmation email</Text>
                )}
              </TouchableOpacity>
              {/* The second way out, and the one that works when the
                  confirmation email never arrives: a reset link proves the same
                  control of the mailbox and confirms the address on use. */}
              <TouchableOpacity
                style={styles.recoverySecondary}
                onPress={handleForgotPassword}
                disabled={recoveryBusy || loading}
              >
                <Text style={styles.recoverySecondaryText}>Email me a reset link instead</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLogin && !unverifiedEmail && !recoveryOpen && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setRecoveryOpen(true);
                setMessage(null);
              }}
              disabled={loading}
            >
              <Text style={styles.linkText}>Forgot your password?</Text>
            </TouchableOpacity>
          )}

          {isLogin && !unverifiedEmail && recoveryOpen && (
            <View style={styles.recoveryBox}>
              <Text style={styles.recoveryBody}>
                We will email a reset link to {email.trim() || 'your address'}. If you never
                confirmed your email, using that link confirms it too.
              </Text>
              <TouchableOpacity
                style={[styles.recoveryPrimary, recoveryBusy && styles.buttonDisabled]}
                onPress={handleForgotPassword}
                disabled={recoveryBusy || loading}
              >
                {recoveryBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send reset link</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.recoverySecondary}
                onPress={() => {
                  setRecoveryOpen(false);
                  setMessage(null);
                }}
                disabled={recoveryBusy}
              >
                <Text style={styles.recoverySecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setMessage(null);
              setUnverifiedEmail(null);
              setRecoveryOpen(false);
            }}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchTextBold}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>

          {message && (
            <View style={[
              styles.messageBox,
              message.type === 'success' ? styles.successBox : styles.errorBox
            ]}>
              <Text style={[
                styles.messageText,
                message.type === 'success' ? styles.successText : styles.errorText
              ]}>
                {message.text}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>
            {isLogin ? 'First time here?' : 'Why create an account?'}
          </Text>
          {isLogin ? (
            <>
              <Text style={styles.infoItem}>• Create and manage events</Text>
              <Text style={styles.infoItem}>• Invite guests and track RSVPs</Text>
              <Text style={styles.infoItem}>• Access collaborative planning tools</Text>
            </>
          ) : (
            <>
              <Text style={styles.infoItem}>• Free to use, no credit card required</Text>
              <Text style={styles.infoItem}>• Organize unlimited events</Text>
              <Text style={styles.infoItem}>• Collaborate with co-hosts</Text>
            </>
          )}
          <Text style={styles.infoNote}>
            Your data is secure and never shared with third parties.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a8a8b3',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2a2a3a',
    backgroundColor: '#1a1a24',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#FF5233',
    borderColor: '#FF5233',
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#b8b8c8',
  },
  consentLink: {
    color: '#FF5233',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  input: {
    backgroundColor: '#1a1a24',
    borderWidth: 2,
    borderColor: '#2a2a3a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#a8a8b3',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  recoveryBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a4a',
    backgroundColor: '#22222e',
    gap: 12,
  },
  recoveryTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  recoveryBody: {
    color: '#a8a8b3',
    fontSize: 14,
    lineHeight: 20,
  },
  recoveryPrimary: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  recoverySecondary: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  recoverySecondaryText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchText: {
    color: '#a8a8b3',
    fontSize: 14,
  },
  switchTextBold: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  messageBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: '#0f3a2e',
    borderColor: '#10b981',
  },
  errorBox: {
    backgroundColor: '#3a0f0f',
    borderColor: '#ef4444',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#10b981',
  },
  errorText: {
    color: '#ef4444',
  },
  info: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#a8a8b3',
    marginBottom: 8,
    paddingLeft: 8,
  },
  infoNote: {
    fontSize: 13,
    color: '#6C63FF',
    marginTop: 12,
    lineHeight: 18,
  },
});
