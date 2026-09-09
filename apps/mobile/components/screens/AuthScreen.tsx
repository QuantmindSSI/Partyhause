import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  LEGAL_URLS,
  MINIMUM_ACCOUNT_AGE,
} from '@partyhause/core/mvp';

import { api } from '@/lib/client';

type AuthMode = 'sign-in' | 'sign-up' | 'check-email' | 'forgot-password';
type FormMessage = { type: 'success' | 'error'; text: string };

interface AuthScreenProps {
  onBackToLanding: () => void;
  onAuthSuccess: () => void | Promise<void>;
  initialMode?: 'sign-in' | 'sign-up';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_ACKNOWLEDGEMENT =
  'If an active account exists and delivery succeeds, reset instructions will arrive shortly.';
const BRAND_MARK = require('../../assets/images/splash-icon.png');

export function AuthScreen({ onBackToLanding, onAuthSuccess, initialMode = 'sign-in' }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ageEligible, setAgeEligible] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);

  function showMode(nextMode: AuthMode): void {
    setMode(nextMode);
    setMessage(null);
  }

  function validatedEmail(): string | null {
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setMessage({ type: 'error', text: 'Enter a valid email address.' });
      return null;
    }
    return value;
  }

  async function submitSignIn(): Promise<void> {
    const submittedEmail = validatedEmail();
    if (!submittedEmail || !password) {
      if (submittedEmail) setMessage({ type: 'error', text: 'Enter your password.' });
      return;
    }

    const result = await api.auth.signIn(submittedEmail, password);
    if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
      setPendingEmail(submittedEmail);
      setPassword('');
      showMode('check-email');
      return;
    }
    if (result.error) {
      setMessage({ type: 'error', text: result.error.message });
      return;
    }

    setMessage({ type: 'success', text: 'Welcome back.' });
    await onAuthSuccess();
  }

  async function submitSignUp(): Promise<void> {
    const submittedEmail = validatedEmail();
    if (!submittedEmail) return;
    if (name.trim().length < 2) {
      setMessage({ type: 'error', text: 'Enter your name.' });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (!ageEligible || !legalAccepted) {
      setMessage({
        type: 'error',
        text: 'Confirm your age eligibility and accept the current Terms and Privacy Policy.',
      });
      return;
    }

    const result = await api.auth.signUp(submittedEmail, password, name.trim(), {
      ageEligible: true,
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
    });
    if (result.error) {
      setMessage({ type: 'error', text: result.error.message });
      return;
    }

    setPendingEmail(submittedEmail);
    setPassword('');
    setMode('check-email');
    setMessage({
      type: 'success',
      text: result.data?.message || 'Check your email for a confirmation link.',
    });
  }

  async function submitForgotPassword(): Promise<void> {
    const submittedEmail = validatedEmail();
    if (!submittedEmail) return;

    const result = await api.auth.forgotPassword(submittedEmail);
    if (result.error) {
      setMessage({ type: 'error', text: result.error.message });
      return;
    }
    setMessage({ type: 'success', text: RESET_ACKNOWLEDGEMENT });
  }

  async function resendVerification(): Promise<void> {
    if (!pendingEmail) {
      showMode('sign-in');
      setMessage({ type: 'error', text: 'Enter your email again to request a new link.' });
      return;
    }

    const result = await api.auth.resendVerification(pendingEmail);
    setMessage(result.error
      ? { type: 'error', text: result.error.message }
      : {
          type: 'success',
          text: result.data?.message || 'If confirmation is needed, a new link is on the way.',
        });
  }

  async function openLegalUrl(url: string): Promise<void> {
    try {
      await Linking.openURL(url);
    } catch {
      setMessage({ type: 'error', text: 'The browser could not be opened.' });
    }
  }

  async function run(action: () => Promise<void>): Promise<void> {
    setLoading(true);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'The request could not be completed.',
      });
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'check-email') {
    return (
      <ScreenFrame onBack={onBackToLanding}>
        <View style={styles.header}>
          <Image
            source={BRAND_MARK}
            style={styles.logo}
            accessibilityLabel="PartyHause"
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to {pendingEmail}. Confirm it, then return here to sign in.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => { void run(resendVerification); }}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.buttonText}>Resend Confirmation</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => {
            setEmail(pendingEmail);
            showMode('sign-in');
          }}
          disabled={loading}
        >
          <Text style={styles.switchTextBold}>Back to Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => {
            setEmail('');
            setPendingEmail('');
            showMode('sign-up');
          }}
          disabled={loading}
        >
          <Text style={styles.switchText}>Use a different email</Text>
        </TouchableOpacity>
        <MessageBox message={message} />
      </ScreenFrame>
    );
  }

  const isSignUp = mode === 'sign-up';
  const isForgotPassword = mode === 'forgot-password';
  const title = isSignUp ? 'Create your account' : isForgotPassword ? 'Reset your password' : 'Welcome back';
  const subtitle = isSignUp
    ? 'Start planning your next event.'
    : isForgotPassword
      ? 'Enter your email and we will send reset instructions.'
      : 'Sign in to continue.';
  const submit = isSignUp ? submitSignUp : isForgotPassword ? submitForgotPassword : submitSignIn;
  const buttonLabel = isSignUp ? 'Create Account' : isForgotPassword ? 'Send Reset Link' : 'Sign In';

  return (
    <ScreenFrame onBack={onBackToLanding}>
      <View style={styles.header}>
        <Image
          source={BRAND_MARK}
          style={styles.logo}
          accessibilityLabel="PartyHause"
          accessibilityIgnoresInvertColors
        />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.form}>
        {isSignUp && (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#666666"
              value={name}
              onChangeText={setName}
              maxLength={100}
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
          placeholderTextColor="#666666"
          value={email}
          onChangeText={setEmail}
          maxLength={254}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
        />

        {!isForgotPassword && (
          <>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder={isSignUp ? 'At least 8 characters' : 'Enter your password'}
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              maxLength={128}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </>
        )}

        {isSignUp && (
          <View style={styles.consentGroup}>
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ageEligible }}
              style={styles.consentRow}
              onPress={() => setAgeEligible((current) => !current)}
              disabled={loading}
            >
              <View style={[styles.checkbox, ageEligible && styles.checkboxChecked]}>
                <Text style={styles.checkmark}>{ageEligible ? 'x' : ''}</Text>
              </View>
              <Text style={styles.consentText}>
                I confirm I am at least {MINIMUM_ACCOUNT_AGE} years old.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: legalAccepted }}
              style={styles.consentRow}
              onPress={() => setLegalAccepted((current) => !current)}
              disabled={loading}
            >
              <View style={[styles.checkbox, legalAccepted && styles.checkboxChecked]}>
                <Text style={styles.checkmark}>{legalAccepted ? 'x' : ''}</Text>
              </View>
              <Text style={styles.consentText}>I accept the current legal terms.</Text>
            </TouchableOpacity>
            <View style={styles.legalLinks}>
              <Text
                accessibilityRole="link"
                style={styles.legalLink}
                onPress={() => { void openLegalUrl(LEGAL_URLS.terms); }}
              >
                Terms of Service
              </Text>
              <Text style={styles.legalSeparator}>and</Text>
              <Text
                accessibilityRole="link"
                style={styles.legalLink}
                onPress={() => { void openLegalUrl(LEGAL_URLS.privacy); }}
              >
                Privacy Policy
              </Text>
            </View>
          </View>
        )}

        {!isSignUp && !isForgotPassword && (
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => showMode('forgot-password')}
            disabled={loading}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => { void run(submit); }}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.buttonText}>{buttonLabel}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => showMode(isSignUp ? 'sign-in' : isForgotPassword ? 'sign-in' : 'sign-up')}
          disabled={loading}
        >
          <Text style={styles.switchText}>
            {isSignUp
              ? 'Already have an account? '
              : isForgotPassword
                ? 'Remembered your password? '
                : "Don't have an account? "}
            <Text style={styles.switchTextBold}>
              {isSignUp || isForgotPassword ? 'Sign In' : 'Sign Up'}
            </Text>
          </Text>
        </TouchableOpacity>

        <MessageBox message={message} />
      </View>
    </ScreenFrame>
  );
}

function ScreenFrame({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MessageBox({ message }: { message: FormMessage | null }) {
  if (!message) return null;
  const success = message.type === 'success';
  return (
    <View style={[styles.messageBox, success ? styles.successBox : styles.errorBox]}>
      <Text style={[styles.messageText, success ? styles.successText : styles.errorText]}>
        {message.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181311',
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
    color: '#FFA694',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: '#A8A8B3',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A24',
    borderWidth: 2,
    borderColor: '#2A2A3A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    paddingBottom: 16,
  },
  consentGroup: {
    gap: 12,
    marginBottom: 20,
  },
  consentRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#837771',
    borderRadius: 6,
  },
  checkboxChecked: {
    borderColor: '#FF7D66',
    backgroundColor: '#C02A16',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  consentText: {
    flex: 1,
    color: '#D8D2CF',
    fontSize: 14,
    lineHeight: 20,
  },
  legalLinks: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  legalLink: {
    color: '#FFA694',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: '#A8A8B3',
    fontSize: 14,
  },
  forgotText: {
    color: '#FFA694',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#C02A16',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  switchText: {
    color: '#A8A8B3',
    fontSize: 14,
    textAlign: 'center',
  },
  switchTextBold: {
    color: '#FFA694',
    fontWeight: '700',
  },
  messageBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: '#0F3A2E',
    borderColor: '#10B981',
  },
  errorBox: {
    backgroundColor: '#3A0F0F',
    borderColor: '#EF4444',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#34D399',
  },
  errorText: {
    color: '#F87171',
  },
});
