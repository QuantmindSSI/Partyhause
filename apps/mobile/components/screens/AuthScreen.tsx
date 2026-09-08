import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
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

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Please enter email and password' });
      return;
    }

    if (!isLogin && !name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your name' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Both branches go through the shared client, which persists the
      // token and the cached user together on success and writes nothing on
      // failure.
      const result = isLogin
        ? await api.auth.signIn(email.trim(), password.trim())
        : await api.auth.signUp(
            email.trim(),
            password.trim(),
            name.trim() || email.split('@')[0],
          );

      if (result.error) {
        // A correct password on an unconfirmed address is not a credential
        // failure and must not be shown as one: the remedy is a resend, not a
        // retry. The server marks it explicitly rather than leaving the client
        // to guess from a status code.
        if (result.error.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(email.trim());
          setRecoveryOpen(false);
          setMessage({
            type: 'error',
            text: 'Your password was correct, but this email has not been confirmed yet.',
          });
          return;
        }
        setUnverifiedEmail(null);
        setMessage({ type: 'error', text: result.error.message });
        return;
      }

      setMessage({
        type: 'success',
        text: isLogin ? 'Welcome back!' : 'Account created. Signing you in...',
      });

      // Navigation is explicit. There is no auth-state event stream to
      // subscribe to: the token changes only when this screen signs in or
      // out, both local actions, so a listener would be a slower way to
      // observe something already known here. The client has
      // already persisted the token to AsyncStorage by this point, so the
      // session is durable before we hand control back.
      onAuthSuccess();
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
