import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  authSessionReducer,
  INITIAL_AUTH_SESSION,
  resolveSessionValidation,
  type AuthSessionState,
} from '@/auth/session';
import { api, subscribeToSessionRejection } from '@/lib/client';
import { saveDeletionReceipt } from '@/auth/deletion-receipt';

type AuthSessionContextValue = AuthSessionState & {
  refresh(): Promise<void>;
  signOut(): Promise<void>;
  finishAccountDeletion(receipt: string): Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [session, dispatch] = useReducer(authSessionReducer, INITIAL_AUTH_SESSION);
  const queryClient = useQueryClient();
  const validationId = useRef(0);

  const clearPrivateQueries = useCallback(async () => {
    try {
      await queryClient.cancelQueries();
    } catch (error) {
      console.error('[auth] failed to cancel private queries', error);
    }
    queryClient.clear();
  }, [queryClient]);

  const rejectSession = useCallback(async (rejectedToken?: string) => {
    if (rejectedToken) {
      try {
        await api.auth.clearSessionIfToken(rejectedToken);
        const currentToken = await api.auth.getToken();
        if (currentToken && currentToken !== rejectedToken) return;
      } catch (error) {
        await clearPrivateQueries();
        dispatch({ type: 'UNAVAILABLE', message: 'Secure credentials could not be removed. Try again.' });
        console.error('[auth] failed to clear rejected credentials', error);
        return;
      }
    }
    validationId.current += 1;
    dispatch({ type: 'CHECK_STARTED' });
    let cleanupFailed = false;
    if (!rejectedToken) {
      try {
        await api.auth.clearSession();
      } catch (error) {
        cleanupFailed = true;
        console.error('[auth] failed to remove rejected credentials', error);
      }
    }
    await clearPrivateQueries();
    dispatch(cleanupFailed
      ? { type: 'UNAVAILABLE', message: 'Secure credentials could not be removed. Try again.' }
      : { type: 'REJECTED' });
  }, [clearPrivateQueries]);

  const refresh = useCallback(async () => {
    const currentValidation = ++validationId.current;
    dispatch({ type: 'CHECK_STARTED' });

    try {
      const token = await api.auth.getToken();
      if (!token) {
        try {
          await api.auth.clearSession();
        } finally {
          await clearPrivateQueries();
        }
        if (currentValidation === validationId.current) dispatch({ type: 'NO_TOKEN' });
        return;
      }

      const result = await api.auth.me();
      if (currentValidation !== validationId.current) return;
      const event = resolveSessionValidation(token, result);
      if (event.type === 'REJECTED') {
        await rejectSession();
        return;
      }
      dispatch(event);
    } catch (error) {
      if (currentValidation !== validationId.current) return;
      dispatch({
        type: 'UNAVAILABLE',
        message: error instanceof Error ? error.message : 'Unable to validate this session.',
      });
    }
  }, [clearPrivateQueries, rejectSession]);

  const signOut = useCallback(async () => {
    validationId.current += 1;
    dispatch({ type: 'CHECK_STARTED' });
    let cleanupFailed = false;
    try {
      await api.auth.signOut();
    } catch (error) {
      cleanupFailed = true;
      console.error('[auth] sign out cleanup failed', error);
    } finally {
      await clearPrivateQueries();
      dispatch(cleanupFailed
        ? { type: 'UNAVAILABLE', message: 'Secure credentials could not be removed. Try again.' }
        : { type: 'REJECTED' });
    }
  }, [clearPrivateQueries]);

  const finishAccountDeletion = useCallback(async (receipt: string) => {
    validationId.current += 1;
    try {
      await api.auth.clearSession();
    } catch (error) {
      console.error('[account] failed to remove revoked credentials', error);
    }
    await clearPrivateQueries();
    try {
      await saveDeletionReceipt(receipt);
    } catch (error) {
      console.error('[account] failed to persist the deletion receipt', error);
    }
    dispatch({ type: 'REJECTED' });
  }, [clearPrivateQueries]);

  useEffect(() => {
    const unsubscribe = subscribeToSessionRejection(rejectSession);
    void refresh();
    return () => {
      validationId.current += 1;
      unsubscribe();
    };
  }, [refresh, rejectSession]);

  return (
    <AuthSessionContext.Provider value={{ ...session, refresh, signOut, finishAccountDeletion }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

// The hook must share this module's private context with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return context;
}
