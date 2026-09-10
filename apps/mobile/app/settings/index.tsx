/**
 * Account settings, and the only place a user can delete their account.
 *
 * WHY THIS SCREEN EXISTS
 *   App Store guideline 5.1.1(v) requires any app that creates accounts to
 *   offer deletion from inside the app. PartyHause creates accounts on the
 *   signup screen and offered no way to remove one: there was no `app/settings/`
 *   directory at all, and the signed-in header carried exactly three controls
 *   (Profile, Drafts, Sign Out).
 *
 *   The server had supported this the whole time. `POST /api/mvp/account/
 *   deletion-intent` and `POST /api/mvp/account/deletion` were written and
 *   tested, and `createAccountResource` in @partyhause/core wrapped both. What
 *   was missing was one line in `createApiClient`, which never called it, and a
 *   screen. Both now exist.
 *
 * THE TWO-STEP FLOW IS THE SERVER'S, NOT DECORATION
 *   `deletion-intent` re-authenticates with the current password and returns a
 *   receipt that expires in 15 minutes. `deletion` consumes that receipt and
 *   requires the literal string DELETE. Splitting the UI the same way means a
 *   mistyped confirmation cannot be replayed into an erasure, and the password
 *   prompt makes an unlocked, unattended phone insufficient to destroy an
 *   account.
 *
 * LEGAL LINKS COME FROM THE CONSTANT, NOT THE SUMMARY
 *   `api.account.summary()` returns the canonical URLs, but it is a network
 *   call that can fail. Privacy and Terms must be reachable from inside a
 *   signed-in session regardless, so they render from LEGAL_URLS and the
 *   summary only enriches the account details above them.
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LEGAL_URLS, type AccountLegalSummary } from '@partyhause/core';
import { api } from '@/lib/client';

/** docs/BRAND.md section 4. */
const BRAND = {
  coral: '#FF5233',
  coralDark: '#C02A16',
  ink: '#26201D',
  paper: '#FBFAF9',
  muted: '#6A5E58',
  hairline: '#EBE7E5',
  danger: '#C02A16',
};

/** The literal the server demands; anything else is a 400. */
const CONFIRMATION_WORD = 'DELETE';

type DeletionStage = 'idle' | 'reauth' | 'confirm';

/**
 * Turn an API error code into something a person can act on.
 *
 * The server's messages are accurate but written for an API consumer. Each
 * branch here names the remedy, because "Deletion request cannot be resumed"
 * does not tell anyone what to press next.
 *
 * @param code Error code from the account service, if any.
 * @param fallback The server's own message, used when the code is unmapped.
 * @returns Human-facing text.
 */
function describeDeletionError(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'PASSWORD_REQUIRED':
      return 'Enter your current password to continue.';
    case 'PASSWORD_REAUTH_FAILED':
      return 'That password is not correct. Nothing has been deleted.';
    case 'ACCOUNT_NOT_ACTIVE':
      return 'This account cannot be deleted right now. Contact support if that seems wrong.';
    case 'DELETION_CONFIRMATION_INVALID':
      return `Type ${CONFIRMATION_WORD} exactly, in capitals.`;
    case 'DELETION_CONFIRMATION_EXPIRED':
      return 'That confirmation window closed. Start again with your password.';
    case 'DELETION_RECEIPT_NOT_FOUND':
    case 'DELETION_STATE_INVALID':
      return 'That request is no longer valid. Start again with your password.';
    case 'DELETION_RATE_LIMITED':
      return 'Too many attempts. Wait a few minutes and try again.';
    default:
      return fallback;
  }
}

/** @returns True when the error means the held receipt is unusable. */
function receiptIsDead(code: string | undefined): boolean {
  return (
    code === 'DELETION_CONFIRMATION_EXPIRED' ||
    code === 'DELETION_RECEIPT_NOT_FOUND' ||
    code === 'DELETION_STATE_INVALID'
  );
}

/**
 * @param iso ISO-8601 timestamp, or null.
 * @returns A short readable date, or null when the input is unusable.
 */
function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function AccountSettingsScreen() {
  const router = useRouter();

  const [summary, setSummary] = useState<AccountLegalSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [stage, setStage] = useState<DeletionStage>('idle');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [eraseBy, setEraseBy] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    const { data, error: failure } = await api.account.summary();
    setLoadingSummary(false);

    if (failure || !data) {
      // Deletion is still offered: it uses different endpoints, and a summary
      // that will not load must not become a reason the account cannot be
      // removed.
      setSummaryError(failure?.message ?? 'Could not load your account details.');
      return;
    }
    setSummaryError(null);
    setSummary(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSummary();
    }, [loadSummary]),
  );

  /** Step one: re-authenticate and obtain a short-lived deletion receipt. */
  const requestDeletion = async () => {
    if (!password.trim()) {
      setError('Enter your current password to continue.');
      return;
    }

    setBusy(true);
    setError(null);
    const { data, error: failure } = await api.account.createDeletionIntent(password);
    setBusy(false);

    if (failure || !data) {
      setError(describeDeletionError(failure?.code, failure?.message ?? 'Could not start deletion.'));
      return;
    }

    setReceipt(data.receipt);
    setEraseBy(data.eraseBy);
    setPassword('');
    setStage('confirm');
  };

  /** Step two: consume the receipt. This is the irreversible call. */
  const confirmDeletion = async () => {
    if (!receipt) {
      setError('That request is no longer valid. Start again with your password.');
      setStage('reauth');
      return;
    }
    if (confirmation !== CONFIRMATION_WORD) {
      setError(`Type ${CONFIRMATION_WORD} exactly, in capitals.`);
      return;
    }

    setBusy(true);
    setError(null);
    const { error: failure } = await api.account.confirmDeletion(receipt);
    setBusy(false);

    if (failure) {
      if (receiptIsDead(failure.code)) {
        setReceipt(null);
        setConfirmation('');
        setStage('reauth');
      }
      setError(describeDeletionError(failure.code, failure.message));
      return;
    }

    // The account is gone, so the token cannot be used again. signOut clears
    // the local session even when its network call fails, which it will: the
    // user row backing this token no longer exists.
    await api.auth.signOut();
    Alert.alert(
      'Account deleted',
      'Your account and its data have been scheduled for permanent erasure. You have been signed out.',
      [{ text: 'OK', onPress: () => router.replace('/') }],
    );
  };

  const cancelDeletion = () => {
    setStage('idle');
    setPassword('');
    setConfirmation('');
    setReceipt(null);
    setEraseBy(null);
    setError(null);
  };

  const memberSince = formatDate(summary?.account.createdAt);
  const eraseByLabel = formatDate(eraseBy);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.card}>
        {loadingSummary ? (
          <ActivityIndicator color={BRAND.coral} style={styles.cardLoading} />
        ) : summaryError ? (
          <View>
            <Text style={styles.errorText}>{summaryError}</Text>
            <TouchableOpacity onPress={() => void loadSummary()} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Row label="Email" value={summary?.account.email ?? '—'} />
            <Row label="Name" value={summary?.account.name ?? 'Not set'} />
            <Row
              label="Email confirmed"
              value={summary?.account.emailVerified ? 'Yes' : 'No'}
            />
            {memberSince ? <Row label="Member since" value={memberSince} /> : null}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => router.push('/settings/profile')}
      >
        <Ionicons name="person-outline" size={20} color={BRAND.ink} />
        <Text style={styles.linkRowText}>Edit profile</Text>
        <Ionicons name="chevron-forward" size={18} color={BRAND.muted} />
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>LEGAL</Text>
      <View style={styles.card}>
        <LegalLink label="Privacy Policy" url={LEGAL_URLS.privacy} />
        <LegalLink label="Terms of Service" url={LEGAL_URLS.terms} />
        <LegalLink label="Support" url={LEGAL_URLS.support} last />
      </View>

      <Text style={styles.sectionLabel}>DANGER ZONE</Text>
      <View style={[styles.card, styles.dangerCard]}>
        {stage === 'idle' ? (
          <>
            <Text style={styles.dangerTitle}>Delete this account</Text>
            <Text style={styles.dangerBody}>
              This permanently removes your account, the events you host, and your guest
              lists. It cannot be undone.
            </Text>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => {
                setStage('reauth');
                setError(null);
              }}
            >
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {stage === 'reauth' ? (
          <>
            <Text style={styles.dangerTitle}>Confirm it is you</Text>
            <Text style={styles.dangerBody}>
              Enter your current password. Nothing is deleted at this step.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor={BRAND.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
            <TouchableOpacity
              style={[styles.dangerButton, busy && styles.buttonDisabled]}
              onPress={() => void requestDeletion()}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.dangerButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelDeletion} disabled={busy} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {stage === 'confirm' ? (
          <>
            <Text style={styles.dangerTitle}>This is permanent</Text>
            <Text style={styles.dangerBody}>
              {eraseByLabel
                ? `Your data will be erased by ${eraseByLabel}. `
                : ''}
              Type {CONFIRMATION_WORD} below to finish. This confirmation expires in 15
              minutes.
            </Text>
            <TextInput
              style={styles.input}
              placeholder={CONFIRMATION_WORD}
              placeholderTextColor={BRAND.muted}
              value={confirmation}
              onChangeText={setConfirmation}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!busy}
            />
            <TouchableOpacity
              style={[
                styles.dangerButton,
                (busy || confirmation !== CONFIRMATION_WORD) && styles.buttonDisabled,
              ]}
              onPress={() => void confirmDeletion()}
              disabled={busy || confirmation !== CONFIRMATION_WORD}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.dangerButtonText}>Delete my account</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelDeletion} disabled={busy} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}

/** One label/value line inside a card. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** An external legal document. Opened in the system browser, not in-app. */
function LegalLink({ label, url, last }: { label: string; url: string; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.legalRow, last && styles.legalRowLast]}
      onPress={() => {
        void Linking.openURL(url);
      }}
    >
      <Text style={styles.legalText}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={BRAND.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.paper },
  content: { padding: 16, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: BRAND.muted,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.hairline,
    paddingHorizontal: 16,
  },
  cardLoading: { paddingVertical: 24 },
  dangerCard: { borderColor: '#F6C7BF', paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BRAND.hairline,
  },
  rowLabel: { fontSize: 15, color: BRAND.muted },
  rowValue: { fontSize: 15, color: BRAND.ink, fontWeight: '500', flexShrink: 1, marginLeft: 16 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.hairline,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 12,
  },
  linkRowText: { flex: 1, fontSize: 16, color: BRAND.ink, fontWeight: '500' },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BRAND.hairline,
  },
  legalRowLast: { borderBottomWidth: 0 },
  legalText: { fontSize: 15, color: BRAND.ink },
  dangerTitle: { fontSize: 16, fontWeight: '700', color: BRAND.ink, marginBottom: 6 },
  dangerBody: { fontSize: 14, color: BRAND.muted, lineHeight: 20, marginBottom: 14 },
  dangerButton: {
    backgroundColor: BRAND.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  cancelButton: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 15, color: BRAND.muted },
  input: {
    borderWidth: 1,
    borderColor: BRAND.hairline,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BRAND.ink,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  errorText: { fontSize: 14, color: BRAND.coralDark, marginTop: 12, lineHeight: 20 },
  retryButton: { paddingVertical: 12 },
  retryText: { fontSize: 15, color: BRAND.coral, fontWeight: '600' },
});
