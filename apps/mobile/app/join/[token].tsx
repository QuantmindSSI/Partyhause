/**
 * RSVP from an invitation link.
 *
 * WHY THIS SCREEN EXISTS
 *   Invitation emails link to `https://partyhause.com/join/<token>`. The web
 *   app has handled that path for a while (`/join/:token` in `src/App.tsx`);
 *   mobile had no route for it at all. That is what made publishing an
 *   apple-app-site-association file unsafe: claiming `/join/*` for the app
 *   without a screen behind it would have opened the app to expo-router's
 *   unmatched screen instead of opening Safari, and Apple's CDN caches the
 *   association, so the mistake would outlive the fix.
 *
 *   This screen is the prerequisite. With it in place, `/join/*` can be
 *   claimed honestly.
 *
 * IT MUST WORK SIGNED OUT
 *   The guest replying to an invitation has no account. The token in the URL is
 *   the credential, which is why `/api/rsvp` sits outside `requireAuth` and why
 *   nothing here checks `api.auth.isAuthenticated()`. Adding a sign-in wall
 *   would break the only flow this screen exists to serve.
 *
 * THE REVISION IS NOT DECORATION
 *   `respond` echoes the revision `resolve` returned. If the record moved in
 *   between, because the guest also replied on the web or the host edited them,
 *   the server answers 409 and this screen re-reads rather than overwriting.
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { RsvpChoice, RsvpInvitation } from '@partyhause/core';
import { api } from '@/lib/client';
import { getWebBaseUrl } from '@/lib/api';

/** docs/BRAND.md section 4. */
const BRAND = {
  coral: '#FF5233',
  coralDark: '#C02A16',
  magenta: '#EC4699',
  ink: '#26201D',
  paper: '#FBFAF9',
  muted: '#6A5E58',
  hairline: '#EBE7E5',
  success: '#0B835B',
};

const CHOICES: Array<{ value: RsvpChoice; label: string; icon: string; colour: string }> = [
  { value: 'accepted', label: "I'm going", icon: 'checkmark-circle', colour: BRAND.success },
  { value: 'maybe', label: 'Maybe', icon: 'help-circle', colour: BRAND.magenta },
  { value: 'declined', label: "Can't make it", icon: 'close-circle', colour: BRAND.muted },
];

/**
 * Turn an RSVP error code into something the guest can act on.
 *
 * @param code Error code from the service, if any.
 * @param fallback The server's message.
 * @returns Human-facing text.
 */
function describeError(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'RSVP_UNAVAILABLE':
      return 'This invitation is no longer available. It may have expired, been withdrawn, or the event may have been cancelled. Ask your host for a new link.';
    case 'REVISION_CONFLICT':
      return 'This invitation was updated somewhere else. We have reloaded it, so please choose again.';
    case 'INVALID_RSVP_STATUS':
    case 'INVALID_REVISION':
      return 'That response could not be recorded. Reload the invitation and try again.';
    case 'RSVP_RATE_LIMITED':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'RSVP_ROUTE_NOT_FOUND':
      return 'The RSVP service is unavailable right now. Please try again shortly.';
    default:
      return fallback;
  }
}

/**
 * @param iso ISO-8601 timestamp.
 * @param timezone IANA zone from the event, used so the time reads as the host
 *   set it rather than as the guest's phone happens to be configured.
 * @returns A readable date and time, or null when the input is unusable.
 */
function formatWhen(iso: string, timezone: string): string | null {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;

  try {
    return parsed.toLocaleString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone || undefined,
    });
  } catch {
    // An unknown IANA zone throws rather than falling back, and a broken date
    // line must not take the whole invitation down with it.
    return parsed.toLocaleString();
  }
}

type Phase = 'loading' | 'ready' | 'unavailable';

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [invitation, setInvitation] = useState<RsvpInvitation | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<RsvpChoice | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setPhase('unavailable');
      setError('This link is missing its invitation code.');
      return;
    }

    const { data, error: failure } = await api.rsvp.resolve(token);

    if (failure || !data) {
      setPhase('unavailable');
      setError(describeError(failure?.code, failure?.message ?? 'This invitation could not be opened.'));
      return;
    }

    setInvitation(data);
    setPhase('ready');
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const respond = async (choice: RsvpChoice) => {
    if (!invitation || !token) return;

    setSubmitting(choice);
    setError(null);
    const { data, error: failure } = await api.rsvp.respond(
      token,
      choice,
      invitation.rsvp.revision,
    );
    setSubmitting(null);

    if (failure || !data) {
      setError(describeError(failure?.code, failure?.message ?? 'Your response was not saved.'));
      // A stale revision is recoverable: re-read so the next tap carries the
      // current one, rather than failing identically forever.
      if (failure?.code === 'REVISION_CONFLICT') await load();
      return;
    }

    setInvitation(data);
  };

  const answered = invitation && invitation.rsvp.status !== 'pending';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Invitation', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {phase === 'loading' ? (
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={BRAND.coral} />
            <Text style={styles.muted}>Opening your invitation…</Text>
          </View>
        ) : null}

        {phase === 'unavailable' ? (
          <View style={styles.centred}>
            <Ionicons name="mail-open-outline" size={64} color={BRAND.hairline} />
            <Text style={styles.title}>Invitation unavailable</Text>
            <Text style={styles.body}>{error}</Text>
            <TouchableOpacity style={styles.secondary} onPress={() => router.replace('/')}>
              <Text style={styles.secondaryText}>Go to PartyHause</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {phase === 'ready' && invitation ? (
          <>
            <Text style={styles.kicker}>YOU'RE INVITED</Text>
            <Text style={styles.eventName}>{invitation.event.name}</Text>
            <Text style={styles.hostLine}>Hosted by {invitation.event.hostName}</Text>

            <View style={styles.card}>
              <Detail
                icon="calendar-outline"
                value={formatWhen(invitation.event.start, invitation.event.timezone) ?? 'Date to be confirmed'}
              />
              <Detail icon="location-outline" value={invitation.event.location || 'Location to be confirmed'} last />
            </View>

            {answered ? (
              <View style={styles.answeredBanner}>
                <Ionicons name="checkmark-circle" size={18} color={BRAND.success} />
                <Text style={styles.answeredText}>
                  You replied “{CHOICES.find((c) => c.value === invitation.rsvp.status)?.label ?? invitation.rsvp.status}”. You can change it below.
                </Text>
              </View>
            ) : (
              <Text style={styles.prompt}>Can you make it?</Text>
            )}

            {CHOICES.map((choice) => {
              const selected = invitation.rsvp.status === choice.value;
              const busy = submitting === choice.value;
              return (
                <TouchableOpacity
                  key={choice.value}
                  style={[styles.choice, selected && { borderColor: choice.colour, borderWidth: 2 }]}
                  onPress={() => void respond(choice.value)}
                  disabled={submitting !== null}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  {busy ? (
                    <ActivityIndicator color={choice.colour} />
                  ) : (
                    <>
                      <Ionicons name={choice.icon as never} size={22} color={choice.colour} />
                      <Text style={styles.choiceText}>{choice.label}</Text>
                      {selected ? (
                        <Ionicons name="checkmark" size={18} color={choice.colour} />
                      ) : null}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.secondary}
              onPress={() => void Linking.openURL(`${getWebBaseUrl()}/join/${token}`)}
            >
              <Text style={styles.secondaryText}>Open in browser instead</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** One icon/value line inside the event card. */
function Detail({ icon, value, last }: { icon: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detail, last && styles.detailLast]}>
      <Ionicons name={icon as never} size={18} color={BRAND.muted} />
      <Text style={styles.detailText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.paper },
  content: { padding: 20, paddingBottom: 48, flexGrow: 1 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  muted: { fontSize: 14, color: BRAND.muted, marginTop: 14 },
  title: { fontSize: 20, fontWeight: '700', color: BRAND.ink, marginTop: 16, marginBottom: 8 },
  body: { fontSize: 15, color: BRAND.muted, textAlign: 'center', lineHeight: 22, marginBottom: 22 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: BRAND.coral, marginBottom: 8 },
  eventName: { fontSize: 28, fontWeight: '700', color: BRAND.ink, marginBottom: 4 },
  hostLine: { fontSize: 15, color: BRAND.muted, marginBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.hairline,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BRAND.hairline,
  },
  detailLast: { borderBottomWidth: 0 },
  detailText: { flex: 1, fontSize: 15, color: BRAND.ink },
  prompt: { fontSize: 17, fontWeight: '600', color: BRAND.ink, marginBottom: 12 },
  answeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  answeredText: { flex: 1, fontSize: 14, color: BRAND.success, lineHeight: 19 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BRAND.hairline,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
    minHeight: 56,
  },
  choiceText: { flex: 1, fontSize: 16, fontWeight: '600', color: BRAND.ink },
  error: { fontSize: 14, color: BRAND.coralDark, marginTop: 12, lineHeight: 20 },
  secondary: { paddingVertical: 16, alignItems: 'center' },
  secondaryText: { fontSize: 15, color: BRAND.muted, textDecorationLine: 'underline' },
});
