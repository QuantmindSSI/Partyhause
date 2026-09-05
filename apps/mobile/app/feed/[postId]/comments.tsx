/**
 * Comments on a PartyCrew post.
 *
 * PartyCrewFeedScreen's comment button used to log to the console. It now
 * navigates here, and this screen reads and writes through the endpoints added
 * to /api/feed alongside it. Creating the route in the same change as the link
 * is deliberate: a button pointing at a route that does not exist is the exact
 * navigation defect (P7) this work is closing, and it would have been trivial
 * to introduce while fixing another instance of it.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { PostComment } from '@partyhause/core';
import { api } from '@/lib/client';

const MAX_COMMENT_LENGTH = 2000;

export default function PostCommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();

  const [comments, setComments] = useState<PostComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (reset: boolean) => {
      if (!postId) return;
      const { data, error: apiError } = await api.feed.comments(postId, {
        limit: 20,
        // On a reset the cursor is dropped, otherwise a refresh resumes
        // mid-stream and silently hides anything posted since.
        cursor: reset ? undefined : cursor ?? undefined,
      });

      if (apiError) {
        setError('Comments could not be loaded.');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      setError(null);
      setComments((prev) => (reset ? data?.comments ?? [] : [...prev, ...(data?.comments ?? [])]));
      setCursor(data?.next_cursor ?? null);
      setHasMore(Boolean(data?.next_cursor));
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [postId, cursor],
  );

  useEffect(() => {
    void load(true);
    // Deliberately keyed on postId only. Including `load` would re-run on every
    // cursor change and refetch the first page after each page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || !postId || isSending) return;

    setIsSending(true);
    const { data, error: apiError } = await api.feed.comment(postId, body, replyTo?.id);
    setIsSending(false);

    if (apiError || !data) {
      // The draft is preserved on failure. Clearing it would destroy what the
      // user wrote to report a failure they did not cause.
      Alert.alert('Not posted', 'Your comment did not send. It is still here, try again.');
      return;
    }

    // Append rather than refetch: the server returned the created row, so the
    // list is already correct and a refetch would discard scroll position.
    setComments((prev) => [...prev, data.comment]);
    setDraft('');
    setReplyTo(null);
  };

  const renderComment = ({ item }: { item: PostComment }) => {
    const author = item.user?.display_name || item.user?.username || 'Someone';
    const isReply = Boolean(item.parent_comment_id);
    return (
      <View style={[styles.comment, isReply && styles.replyIndent]}>
        <View style={styles.commentHeader}>
          <Text style={styles.author}>{author}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.body}>{item.body}</Text>
        <TouchableOpacity
          onPress={() => setReplyTo(item)}
          accessibilityRole="button"
          accessibilityLabel={`Reply to ${author}`}
        >
          <Text style={styles.replyAction}>Reply</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Comments', headerBackTitle: 'Feed' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
      >
        {isLoading ? (
          <ActivityIndicator style={styles.loading} size="large" color="#C02A16" />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            renderItem={renderComment}
            contentContainerStyle={comments.length === 0 ? styles.emptyWrap : styles.list}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  setCursor(null);
                  void load(true);
                }}
                tintColor="#C02A16"
              />
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (hasMore && !isLoading) void load(false);
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubble-outline" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  {error ?? 'No comments yet. Say the first thing.'}
                </Text>
                {error ? (
                  <TouchableOpacity onPress={() => void load(true)} accessibilityRole="button">
                    <Text style={styles.retry}>Try again</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            }
          />
        )}

        {replyTo ? (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText} numberOfLines={1}>
              Replying to {replyTo.user?.display_name || replyTo.user?.username || 'someone'}
            </Text>
            <TouchableOpacity
              onPress={() => setReplyTo(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancel reply"
            >
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={replyTo ? 'Write a reply' : 'Add a comment'}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={MAX_COMMENT_LENGTH}
            accessibilityLabel={replyTo ? 'Reply text' : 'Comment text'}
          />
          <TouchableOpacity
            onPress={submit}
            disabled={!draft.trim() || isSending}
            style={[styles.send, (!draft.trim() || isSending) && styles.sendDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Post comment"
            accessibilityState={{ disabled: !draft.trim() || isSending }}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 24 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 10, padding: 32 },
  emptyText: { color: '#6b7280', fontSize: 15, textAlign: 'center' },
  retry: { color: '#C02A16', fontWeight: '600', fontSize: 15 },
  comment: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  replyIndent: { paddingLeft: 24, borderLeftWidth: 2, borderLeftColor: '#f3f4f6' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  author: { fontWeight: '600', color: '#1f2937', fontSize: 15 },
  timestamp: { color: '#9ca3af', fontSize: 13 },
  body: { color: '#374151', fontSize: 15, lineHeight: 21 },
  replyAction: { color: '#C02A16', fontSize: 13, fontWeight: '600', marginTop: 6 },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  replyBannerText: { color: '#6b7280', fontSize: 13, flex: 1 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C02A16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: '#d1d5db' },
});
