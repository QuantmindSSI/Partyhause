import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { api } from '@/lib/client';
import { useAuthSession } from '@/providers/AuthSessionProvider';
import { saveDeletionReceipt } from '@/auth/deletion-receipt';

const IMPACT = [
  'Your account, profile, and every event you host will be permanently erased.',
  'Hosted guest records, invitation links, RSVP responses, and attendance records will be erased.',
  'All PartyHause sessions will stop working immediately after confirmation.',
  "Delivered email cannot be recalled. Guest details independently entered by another host remain under that host's event.",
  'A receipt without your name or email remains for 365 days. Current database backups expire after 7 days.',
] as const;

export default function DeleteAccountScreen() {
  const { finishAccountDeletion } = useAuthSession();
  const [password, setPassword] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [eraseBy, setEraseBy] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestIntent(): Promise<void> {
    if (!reviewed) {
      setError('Review the impact and confirm that you understand it.');
      return;
    }
    if (!password) {
      setError('Enter your current password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await api.account.createDeletionIntent(password);
    setSubmitting(false);
    if (result.error || !result.data) {
      setError(result.error?.message || 'Deletion could not be prepared.');
      return;
    }
    setReceipt(result.data.receipt);
    setEraseBy(result.data.eraseBy);
    setPassword('');
  }

  async function confirmDeletion(): Promise<void> {
    if (!receipt || confirmation !== 'DELETE') {
      setError('Type DELETE exactly to permanently delete your account.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await saveDeletionReceipt(receipt);
    } catch {
      setSubmitting(false);
      setError('The deletion receipt could not be stored securely. Try again.');
      return;
    }
    const result = await api.account.confirmDeletion(receipt);
    if (result.error || !result.data?.accepted) {
      setSubmitting(false);
      setError(result.error?.message || 'Deletion could not be accepted.');
      return;
    }
    await finishAccountDeletion(receipt);
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()} disabled={submitting}>
          <Ionicons name="arrow-back" size={23} color="#FBFAF9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.warningCard}>
          <Text style={styles.warningLabel}>PERMANENT ACTION</Text>
          <Text style={styles.title}>This cannot be undone.</Text>
          {IMPACT.map((item) => (
            <View key={item} style={styles.impactRow}>
              <Text style={styles.bullet}>-</Text>
              <Text style={styles.impactText}>{item}</Text>
            </View>
          ))}
        </View>

        {!receipt ? (
          <>
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: reviewed }}
              style={styles.reviewRow}
              onPress={() => setReviewed((current) => !current)}
              disabled={submitting}
            >
              <View style={[styles.checkbox, reviewed && styles.checkboxChecked]}>
                <Text style={styles.checkmark}>{reviewed ? 'x' : ''}</Text>
              </View>
              <Text style={styles.reviewText}>I understand what will be permanently deleted.</Text>
            </TouchableOpacity>
            <Text style={styles.label}>Current password</Text>
            <TextInput
              style={styles.input}
              value={password}
              accessibilityLabel="Current password"
              onChangeText={setPassword}
              secureTextEntry
              maxLength={128}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
            <TouchableOpacity
              style={[styles.dangerButton, submitting && styles.disabled]}
              onPress={() => { void requestIntent(); }}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.dangerButtonText}>Continue</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.confirmCard}>
            <Text style={styles.title}>Final confirmation</Text>
            <Text style={styles.copy}>
              Type DELETE below. Once accepted, access is revoked immediately and primary deletion completes no later than {eraseBy ? new Date(eraseBy).toLocaleString() : '24 hours'}.
            </Text>
            <Text style={styles.label}>Type DELETE</Text>
            <TextInput
              style={styles.input}
              value={confirmation}
              accessibilityLabel="Type DELETE to confirm account deletion"
              onChangeText={setConfirmation}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!submitting}
            />
            <TouchableOpacity
              style={[styles.dangerButton, (submitting || confirmation !== 'DELETE') && styles.disabled]}
              onPress={() => { void confirmDeletion(); }}
              disabled={submitting || confirmation !== 'DELETE'}
            >
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.dangerButtonText}>Permanently Delete Account</Text>}
            </TouchableOpacity>
          </View>
        )}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={submitting}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAF9' },
  header: { minHeight: 112, flexDirection: 'row', alignItems: 'flex-end', gap: 14, paddingHorizontal: 20, paddingBottom: 18, backgroundColor: '#181311' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FBFAF9', fontSize: 28, fontWeight: '900', paddingBottom: 5 },
  content: { padding: 20, paddingBottom: 44 },
  warningCard: { padding: 20, borderRadius: 18, backgroundColor: '#FFF2F0', borderWidth: 1, borderColor: '#F4B5AA' },
  warningLabel: { color: '#972317', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#26201D', fontSize: 23, fontWeight: '900', marginTop: 8, marginBottom: 14 },
  impactRow: { flexDirection: 'row', gap: 10, marginTop: 9 },
  bullet: { color: '#C02A16', fontSize: 17, lineHeight: 22 },
  impactText: { flex: 1, color: '#514743', fontSize: 14, lineHeight: 21 },
  reviewRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  checkbox: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#847771', borderRadius: 6 },
  checkboxChecked: { borderColor: '#C02A16', backgroundColor: '#C02A16' },
  checkmark: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  reviewText: { flex: 1, color: '#26201D', fontSize: 15, lineHeight: 21, fontWeight: '600' },
  confirmCard: { marginTop: 20, padding: 20, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE7E5' },
  copy: { color: '#514743', fontSize: 14, lineHeight: 21, marginBottom: 18 },
  label: { color: '#26201D', fontSize: 14, fontWeight: '800', marginTop: 10, marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#B8AEA9', borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 15, color: '#26201D', fontSize: 16 },
  dangerButton: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#B42318', marginTop: 18 },
  dangerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  error: { color: '#B42318', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 16 },
  cancelButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelText: { color: '#514743', fontSize: 15, fontWeight: '700' },
});
