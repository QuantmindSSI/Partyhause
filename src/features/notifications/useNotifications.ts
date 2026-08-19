// Notification center data layer over /api/notifications.
//
// Polling via react-query (60s) keeps the bell badge current; the realtime
// channel upgrade (Web PubSub user groups) layers on top of these same query
// keys by invalidating them, so components never need to know the transport.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api-client';

export interface NotificationActor {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  actor: NotificationActor | null;
  event_id: string | null;
  post_id: string | null;
  action_data: Record<string, unknown> | null;
}

export const NOTIFICATIONS_KEY = ['notifications', 'list'] as const;
export const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;

const POLL_INTERVAL_MS = 60_000;

export function useNotifications(limit = 30) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, limit],
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await apiGet<{ notifications: AppNotification[] }>(
        `/api/notifications?limit=${limit}`,
      );
      if (error) throw new Error(error.message);
      return data?.notifications ?? [];
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: async (): Promise<number> => {
      const { data, error } = await apiGet<{ count: number }>('/api/notifications/unread-count');
      if (error) throw new Error(error.message);
      return data?.count ?? 0;
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ids: string[] } | { all: true }) => {
      const { data, error } = await apiPost<{ success: boolean; updated: number }>(
        '/api/notifications/mark-read',
        input,
      );
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}
