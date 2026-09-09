import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { LEGAL_URLS } from '@partyhause/core/mvp';

import { api } from '@/lib/client';
import { useAuthSession } from '@/providers/AuthSessionProvider';

const LEGAL_LINKS = [
  { label: 'Privacy Policy', url: LEGAL_URLS.privacy },
  { label: 'Terms of Service', url: LEGAL_URLS.terms },
  { label: 'Support', url: LEGAL_URLS.support },
] as const;

export default function AccountScreen() {
  const { signOut } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
  const account = useQuery({
    queryKey: ['account-summary'],
    queryFn: async () => {
      const result = await api.account.summary();
      if (result.error) throw new Error(result.error.message);
      if (!result.data) throw new Error('Account summary was empty');
      return result.data;
    },
  });

  async function openUrl(url: string): Promise<void> {
    try {
      await Linking.openURL(url);
    } catch {
      setMessage('The browser could not be opened. Try again from partyhause.com.');
    }
  }

  async function handleSignOut(): Promise<void> {
    await signOut();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={23} color="#FBFAF9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {account.isLoading ? <ActivityIndicator size="large" color="#C02A16" /> : null}
        {account.isError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{account.error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { void account.refetch(); }}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {account.data ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>SIGNED IN AS</Text>
              <Text style={styles.name}>{account.data.account.name || 'PartyHause host'}</Text>
              <Text style={styles.email}>{account.data.account.email}</Text>
              <Text style={styles.verified}>Email verified</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Legal and support</Text>
              <Text style={styles.detail}>
                Accepted Terms {account.data.legal.acceptedTermsVersion || 'not recorded'} and Privacy {account.data.legal.acceptedPrivacyVersion || 'not recorded'}.
              </Text>
              {LEGAL_LINKS.map((link) => (
                <TouchableOpacity
                  key={link.url}
                  accessibilityRole="link"
                  style={styles.rowButton}
                  onPress={() => { void openUrl(link.url); }}
                >
                  <Text style={styles.rowText}>{link.label}</Text>
                  <Ionicons name="open-outline" size={19} color="#972317" />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.signOutButton} onPress={() => { void handleSignOut(); }}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => router.push('/account/delete' as Href)}>
              <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>
          </>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAF9' },
  header: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#181311',
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FBFAF9', fontSize: 28, fontWeight: '900', paddingBottom: 5 },
  content: { gap: 16, padding: 20, paddingBottom: 42 },
  card: { padding: 20, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE7E5' },
  label: { color: '#972317', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  name: { color: '#26201D', fontSize: 24, fontWeight: '900', marginTop: 10 },
  email: { color: '#514743', fontSize: 15, marginTop: 4 },
  verified: { color: '#237A57', fontSize: 13, fontWeight: '700', marginTop: 12 },
  sectionTitle: { color: '#26201D', fontSize: 19, fontWeight: '900', marginBottom: 8 },
  detail: { color: '#6A5E58', fontSize: 13, lineHeight: 20, marginBottom: 10 },
  rowButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EBE7E5',
  },
  rowText: { color: '#972317', fontSize: 15, fontWeight: '700' },
  signOutButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#26201D' },
  signOutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  deleteButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#C02A16' },
  deleteText: { color: '#C02A16', fontSize: 16, fontWeight: '800' },
  errorCard: { padding: 18, borderRadius: 14, backgroundColor: '#FFF2F0' },
  errorText: { color: '#972317', textAlign: 'center' },
  retryButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  retryText: { color: '#972317', fontWeight: '800' },
  message: { color: '#972317', textAlign: 'center' },
});
