import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  createMvpIdempotencyKey,
  type MvpInvitationCandidate,
  type MvpInvitationSendItem,
  type MvpInvitationsPage,
} from '@partyhause/core/mvp';

import { api } from '@/lib/client';

function maskedEmail(email: string): string {
  const separator = email.lastIndexOf('@');
  if (separator <= 0) return 'Email unavailable';
  return `${email.slice(0, 1)}***${email.slice(separator)}`;
}

function deliveryStatusLabel(status: MvpInvitationCandidate['deliveryStatus']): string {
  if (status === 'not_sent') return 'Not sent';
  if (status === 'accepted') return 'Accepted by provider';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function resultLabel(result: MvpInvitationSendItem): string {
  if (!result.attempted && result.status === 'accepted') return 'Already accepted by provider';
  if (result.status === 'accepted') return 'Accepted by provider';
  if (result.status === 'failed') return 'Failed. Select this guest to retry.';
  return deliveryStatusLabel(result.status);
}

export default function EventInvitationsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const command = useRef<{ fingerprint: string; key: string } | null>(null);
  const [page, setPage] = useState<MvpInvitationsPage | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [results, setResults] = useState<MvpInvitationSendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!id) {
      setError('This event link is incomplete.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (refresh) setRefreshing(true);
    const response = await api.invitations.getForEvent(id);
    if (response.error || !response.data) {
      setError(response.error?.message || 'Invitations could not be loaded.');
    } else {
      setPage(response.data);
      setError(null);
      setSelected((current) => new Set(
        [...current].filter((guestId) => response.data?.candidates.some(
          (candidate) => candidate.guestId === guestId && candidate.canSend,
        )),
      ));
    }
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(candidate: MvpInvitationCandidate): void {
    if (!candidate.canSend || sending) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(candidate.guestId)) next.delete(candidate.guestId);
      else if (next.size < 50) next.add(candidate.guestId);
      return next;
    });
  }

  function commandKey(guestIds: string[]): string {
    const fingerprint = guestIds.slice().sort().join(':');
    if (command.current?.fingerprint === fingerprint) return command.current.key;
    const key = createMvpIdempotencyKey('invitation-send');
    command.current = { fingerprint, key };
    return key;
  }

  async function sendSelected(): Promise<void> {
    if (!id || selected.size === 0 || selected.size > 50) return;
    const guestIds = [...selected];
    setSending(true);
    setError(null);
    const response = await api.invitations.send(id, guestIds, commandKey(guestIds));
    setSending(false);
    if (response.error || !response.data) {
      setError(response.error?.message || 'Invitations were not sent. Your selection has been kept.');
      return;
    }
    command.current = null;
    setResults(response.data.results);
    const failed = new Set(response.data.results
      .filter((result) => result.status === 'failed')
      .map((result) => result.guestId));
    setSelected(failed);
    setPage((current) => current ? {
      ...current,
      candidates: current.candidates.map((candidate) => {
        const result = response.data?.results.find((item) => item.guestId === candidate.guestId);
        return result
          ? { ...candidate, deliveryStatus: result.status, canSend: result.status === 'failed' }
          : candidate;
      }),
    } : current);
  }

  function confirmSend(): void {
    const count = selected.size;
    if (count === 0) return;
    Alert.alert(
      `Send ${count} invitation${count === 1 ? '' : 's'}?`,
      'PartyHause will email the fixed event details and a private browser RSVP link to each selected guest.',
      [
        { text: 'Review', style: 'cancel' },
        { text: `Send ${count}`, onPress: () => { void sendSelected(); } },
      ],
    );
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#C02A16" /></View>;
  }

  if (!page) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#B42328" />
        <Text style={styles.emptyTitle}>Invitations unavailable</Text>
        <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => { setLoading(true); void load(); }} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color="#26201D" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Invitations</Text>
          <Text style={styles.headerSubtitle}>{selected.size} selected</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load(true); }} tintColor="#C02A16" />}
      >
        <View style={styles.previewCard}>
          <Text style={styles.eyebrow}>FIXED PREVIEW</Text>
          <Text style={styles.previewSubject}>{page.preview.subject}</Text>
          <Text style={styles.previewHeading}>{page.preview.heading}</Text>
          <Text style={styles.previewCopy}>{page.preview.hostName} invites each selected guest to {page.preview.eventName}.</Text>
          <View style={styles.previewDetails}>
            <Text style={styles.previewDetail}>Starts: {page.preview.start}</Text>
            <Text style={styles.previewDetail}>Ends: {page.preview.end}</Text>
            <Text style={styles.previewDetail}>Timezone: {page.preview.timezone}</Text>
            <Text style={styles.previewDetail}>Location: {page.preview.location}</Text>
          </View>
          <Text style={styles.previewCopy}>{page.preview.message}</Text>
          <View style={styles.previewAction}><Text style={styles.previewActionText}>{page.preview.actionLabel}</Text></View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose guests</Text>
          <Text style={styles.sectionCopy}>No guests are selected automatically. Accepted sends cannot be sent again.</Text>
        </View>

        {page.candidates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No guests to invite</Text>
            <Text style={styles.sectionCopy}>Add guests from the guest list, then return here.</Text>
          </View>
        ) : page.candidates.map((candidate) => {
          const checked = selected.has(candidate.guestId);
          return (
            <TouchableOpacity
              accessibilityLabel={`${candidate.name}, ${maskedEmail(candidate.email)}, ${deliveryStatusLabel(candidate.deliveryStatus)}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked, disabled: !candidate.canSend }}
              disabled={!candidate.canSend || sending}
              key={candidate.guestId}
              onPress={() => toggle(candidate)}
              style={[styles.candidate, checked && styles.candidateSelected, !candidate.canSend && styles.candidateDisabled]}
            >
              <Ionicons
                name={checked ? 'checkbox' : candidate.canSend ? 'square-outline' : 'checkmark-circle'}
                size={24}
                color={checked ? '#C02A16' : candidate.canSend ? '#847771' : '#197A4A'}
              />
              <View style={styles.candidateCopy}>
                <Text style={styles.candidateName}>{candidate.name}</Text>
                <Text style={styles.candidateEmail}>{maskedEmail(candidate.email)}</Text>
                <Text style={styles.candidateStatus}>{deliveryStatusLabel(candidate.deliveryStatus)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {results.length > 0 ? (
          <View accessibilityLiveRegion="polite" style={styles.resultsCard}>
            <Text style={styles.sectionTitle}>Server results</Text>
            {results.map((result) => (
              <View key={result.guestId} style={styles.resultRow}>
                <Text style={styles.resultName}>{result.name}</Text>
                <Text style={result.status === 'failed' ? styles.resultFailed : styles.resultAccepted}>
                  {resultLabel(result)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {error ? <Text accessibilityRole="alert" style={styles.errorNotice}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={selected.size === 0 || sending}
          onPress={confirmSend}
          style={[styles.sendButton, (selected.size === 0 || sending) && styles.disabled]}
        >
          {sending ? <ActivityIndicator color="#FFFFFF" /> : (
            <Text style={styles.sendButtonText}>Send {selected.size} invitation{selected.size === 1 ? '' : 's'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3F0' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#F7F3F0' },
  header: { minHeight: 104, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 18, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E7DEDA' },
  headerButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  headerTitle: { color: '#26201D', fontSize: 20, fontWeight: '900' },
  headerSubtitle: { color: '#6A5E58', fontSize: 12, marginTop: 2 },
  content: { padding: 18, paddingBottom: 120 },
  previewCard: { padding: 22, borderRadius: 18, backgroundColor: '#2C1712', gap: 10 },
  eyebrow: { color: '#F3AA97', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  previewSubject: { color: '#D8C6C0', fontSize: 13 },
  previewHeading: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '900' },
  previewCopy: { color: '#F4EDE9', fontSize: 15, lineHeight: 22 },
  previewDetails: { gap: 5, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#62443B' },
  previewDetail: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  previewAction: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 9, backgroundColor: '#C02A16' },
  previewActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  sectionHeader: { marginTop: 26, marginBottom: 12 },
  sectionTitle: { color: '#26201D', fontSize: 20, fontWeight: '900' },
  sectionCopy: { color: '#6A5E58', fontSize: 13, lineHeight: 19, marginTop: 5 },
  candidate: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, marginBottom: 9, borderRadius: 14, borderWidth: 1, borderColor: '#DDD3CE', backgroundColor: '#FFFFFF' },
  candidateSelected: { borderColor: '#C02A16', backgroundColor: '#FFF5F2' },
  candidateDisabled: { opacity: 0.68 },
  candidateCopy: { flex: 1 },
  candidateName: { color: '#26201D', fontSize: 16, fontWeight: '800' },
  candidateEmail: { color: '#6A5E58', fontSize: 13, marginTop: 2 },
  candidateStatus: { color: '#514743', fontSize: 12, fontWeight: '700', marginTop: 6 },
  emptyCard: { alignItems: 'center', padding: 24, borderRadius: 14, backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#26201D', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  errorText: { color: '#9F1D22', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  primaryButton: { minWidth: 180, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#C02A16' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 },
  secondaryButtonText: { color: '#972317', fontWeight: '700' },
  resultsCard: { gap: 10, marginTop: 22, padding: 17, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD3CE' },
  resultRow: { paddingTop: 9, borderTopWidth: 1, borderTopColor: '#EEE8E5' },
  resultName: { color: '#26201D', fontSize: 14, fontWeight: '800' },
  resultAccepted: { color: '#197A4A', fontSize: 13, marginTop: 3 },
  resultFailed: { color: '#A51D20', fontSize: 13, marginTop: 3 },
  errorNotice: { color: '#A51D20', lineHeight: 20, marginTop: 16, padding: 13, borderRadius: 10, backgroundColor: '#FFF0F0' },
  footer: { position: 'absolute', right: 0, bottom: 0, left: 0, padding: 16, paddingBottom: 28, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E7DEDA' },
  sendButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#C02A16' },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
