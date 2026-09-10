/**
 * Suggested creators to join.
 *
 * WHY THIS SCREEN EXISTS
 *   `PartyCrewFeedScreen.tsx` rendered an "Explore Creators" button in its
 *   empty state that pushed `/(tabs)/explore`. That tab was deleted on
 *   2026-09-05 and the call site was never updated, so the button reached
 *   expo-router's unmatched screen. It is reachable in two taps from a cold
 *   launch, by a signed-out user, because the PartyCrew tab carries no auth
 *   gate and its feed hook short-circuits to an empty list. That is the exact
 *   path an App Review tester takes.
 *
 *   The tab was removed because there was no discovery endpoint behind it.
 *   That was true of *event* discovery and remains true. It was never true of
 *   creator discovery: `GET /api/users/suggested` exists, is authenticated,
 *   ranks by mutual crew and events hosted, and `api.users.suggested()` has
 *   wrapped it in @partyhause/core the whole time with no call site.
 *
 *   So this is a screen, not a tab. It is reached from the one empty state
 *   that needs it, which keeps the promise the tab bar makes accurate while
 *   giving the button a true destination.
 *
 * AUTH IS CHECKED, NOT ASSUMED
 *   The route that backs this requires auth. A signed-out visitor arriving
 *   from the ungated PartyCrew tab gets told to sign in rather than an empty
 *   list, which would read as "there are no creators".
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { SuggestedUser } from '@partyhause/core';
import { JoinCrewButton } from '@/components/partycrew/JoinCrewButton';
import { api } from '@/lib/client';

/** docs/BRAND.md section 4. */
const BRAND = {
  coral: '#FF5233',
  ink: '#26201D',
  paper: '#FBFAF9',
  muted: '#6A5E58',
  hairline: '#EBE7E5',
};

type LoadState = 'loading' | 'ready' | 'signed-out' | 'failed';

export default function DiscoverScreen() {
  const router = useRouter();
  const [creators, setCreators] = useState<SuggestedUser[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!(await api.auth.isAuthenticated())) {
      setState('signed-out');
      return;
    }

    const { data, error: failure } = await api.users.suggested();

    if (failure) {
      setError(failure.message);
      setState('failed');
      return;
    }

    setCreators(data ?? []);
    setError(null);
    setState('ready');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const body = () => {
    if (state === 'loading') {
      return (
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={BRAND.coral} />
        </View>
      );
    }

    if (state === 'signed-out') {
      return (
        <View style={styles.centred}>
          <Ionicons name="person-circle-outline" size={64} color={BRAND.hairline} />
          <Text style={styles.emptyTitle}>Sign in to find creators</Text>
          <Text style={styles.emptyBody}>
            Suggestions are based on who you already crew with, so they need an account.
          </Text>
          <TouchableOpacity style={styles.primary} onPress={() => router.replace('/')}>
            <Text style={styles.primaryText}>Go to sign in</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (state === 'failed') {
      return (
        <View style={styles.centred}>
          <Ionicons name="cloud-offline-outline" size={64} color={BRAND.hairline} />
          <Text style={styles.emptyTitle}>Could not load suggestions</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <TouchableOpacity style={styles.primary} onPress={() => void load()}>
            <Text style={styles.primaryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={creators}
        keyExtractor={(item) => item.id}
        contentContainerStyle={creators.length === 0 ? styles.flexGrow : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
        renderItem={({ item }) => (
          <CreatorRow creator={item} onOpen={() => router.push(`/profile/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.centred}>
            <Ionicons name="sparkles-outline" size={64} color={BRAND.hairline} />
            <Text style={styles.emptyTitle}>No suggestions yet</Text>
            <Text style={styles.emptyBody}>
              Suggestions appear as more hosts join. Create an event in the meantime and
              invite the people you already know.
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Discover Creators', headerShown: true }} />
      {body()}
    </View>
  );
}

/** One suggested creator, with the reason the server ranked them. */
function CreatorRow({ creator, onOpen }: { creator: SuggestedUser; onOpen: () => void }) {
  const initial = (creator.display_name || creator.username || '?').charAt(0).toUpperCase();

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} onPress={onOpen} accessibilityRole="button">
        {creator.avatar_url ? (
          <Image source={{ uri: creator.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <View style={styles.rowText}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1}>
              {creator.display_name}
            </Text>
            {creator.is_verified ? (
              <Ionicons name="checkmark-circle" size={15} color={BRAND.coral} />
            ) : null}
          </View>
          <Text style={styles.username} numberOfLines={1}>
            @{creator.username}
          </Text>
          {creator.reason ? (
            <Text style={styles.reason} numberOfLines={1}>
              {creator.reason}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <JoinCrewButton creatorId={creator.id} variant="compact" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.paper },
  flexGrow: { flexGrow: 1 },
  list: { paddingVertical: 8 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.ink,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: BRAND.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primary: {
    backgroundColor: BRAND.coral,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BRAND.hairline,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: BRAND.hairline },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.coral },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  rowText: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 16, fontWeight: '600', color: BRAND.ink, flexShrink: 1 },
  username: { fontSize: 13, color: BRAND.muted, marginTop: 1 },
  reason: { fontSize: 12, color: BRAND.coral, marginTop: 3 },
});
