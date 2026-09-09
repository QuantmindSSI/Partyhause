import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AccountDeletion } from '@partyhause/core/mvp';

import { getDeletionReceipt, removeDeletionReceipt } from '@/auth/deletion-receipt';
import { api } from '@/lib/client';

const BRAND_MARK = require('../../assets/images/splash-icon.png');

interface LandingScreenProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

const productSteps = [
  {
    number: '01',
    title: 'Create a private event',
    description: 'Set the time and place, then keep every event detail in one host view.',
  },
  {
    number: '02',
    title: 'Keep the essentials together',
    description: 'Review the event time, timezone, location, and current lifecycle state.',
  },
  {
    number: '03',
    title: 'Return when plans change',
    description: 'Your server-backed drafts remain available from the event list on your iPhone.',
  },
] as const;

export function LandingScreen({ onGetStarted, onSignIn }: LandingScreenProps) {
  const [deletion, setDeletion] = useState<AccountDeletion | null>(null);
  const [deletionReceipt, setDeletionReceipt] = useState<string | null>(null);
  const [checkingDeletion, setCheckingDeletion] = useState(false);

  useEffect(() => {
    let active = true;
    void getDeletionReceipt().then(async (receipt) => {
      if (!active || !receipt) return;
      setDeletionReceipt(receipt);
      const result = await api.account.deletionStatus(receipt);
      if (!active) return;
      if (result.data) {
        setDeletion(result.data);
        if (result.data.status === 'completed') await removeDeletionReceipt();
      } else if (result.error?.status === 404) {
        await removeDeletionReceipt();
      }
    }).catch((error) => {
      if (__DEV__) console.warn('[account] deletion status could not be loaded', error);
    });
    return () => { active = false; };
  }, []);

  async function retryDeletion(): Promise<void> {
    if (!deletionReceipt) return;
    setCheckingDeletion(true);
    const result = await api.account.confirmDeletion(deletionReceipt);
    setCheckingDeletion(false);
    if (!result.data) return;
    setDeletion(result.data.deletion);
    if (result.data.deletion.status === 'completed') await removeDeletionReceipt();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandLockup}>
            <Image
              source={BRAND_MARK}
              style={styles.brandMark}
              accessibilityLabel="PartyHause"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.brandName}>PartyHause</Text>
          </View>
          {onSignIn ? (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.signInButton}
              onPress={onSignIn}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PRIVATE EVENTS, CLEARLY ORGANIZED</Text>
          <Text style={styles.title}>Raise the roof.{`\n`}Keep hold of the details.</Text>
          <Text style={styles.subtitle}>
            Create private event drafts and keep the details organized in one focused host app.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={onGetStarted}
          >
            <Text style={styles.primaryButtonText}>Create an Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.steps}>
          {productSteps.map((step) => (
            <View key={step.number} style={styles.step}>
              <Text style={styles.stepNumber}>{step.number}</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyTitle}>Private by default</Text>
          <Text style={styles.privacyText}>
            New events start as private drafts and are not listed in social or public discovery.
          </Text>
        </View>
        {deletion ? (
          <View style={styles.deletionNotice}>
            <Text style={styles.deletionTitle}>
              {deletion.status === 'completed' ? 'Account deletion completed' : 'Account deletion in progress'}
            </Text>
            <Text style={styles.deletionText}>
              {deletion.status === 'completed'
                ? 'Your PartyHause account and primary data were erased.'
                : `Your account remains inaccessible. Primary erasure is due by ${new Date(deletion.eraseBy).toLocaleString()}.`}
            </Text>
            {deletion.retryable ? (
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.retryDeletionButton}
                onPress={() => { void retryDeletion(); }}
                disabled={checkingDeletion}
              >
                <Text style={styles.retryDeletionText}>{checkingDeletion ? 'Retrying...' : 'Retry Deletion'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181311',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  brandName: {
    color: '#FBFAF9',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  signInButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  signInText: {
    color: '#FFA694',
    fontSize: 16,
    fontWeight: '700',
  },
  hero: {
    paddingTop: 56,
    paddingBottom: 52,
  },
  eyebrow: {
    color: '#FF7D66',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 18,
  },
  title: {
    color: '#FBFAF9',
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginBottom: 20,
  },
  subtitle: {
    maxWidth: 520,
    color: '#D8D2CF',
    fontSize: 18,
    lineHeight: 27,
    marginBottom: 30,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#C02A16',
    borderRadius: 14,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  steps: {
    borderTopWidth: 1,
    borderTopColor: '#39312D',
  },
  step: {
    minHeight: 112,
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#39312D',
  },
  stepNumber: {
    color: '#FF7D66',
    fontSize: 13,
    fontWeight: '800',
    paddingTop: 3,
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    color: '#FBFAF9',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 7,
  },
  stepDescription: {
    color: '#ABA09B',
    fontSize: 15,
    lineHeight: 22,
  },
  privacyNote: {
    marginTop: 28,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#26201D',
    borderWidth: 1,
    borderColor: '#514743',
  },
  privacyTitle: {
    color: '#FBFAF9',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  privacyText: {
    color: '#D8D2CF',
    fontSize: 14,
    lineHeight: 21,
  },
  deletionNotice: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FCE8E4',
    borderWidth: 1,
    borderColor: '#F4B5AA',
  },
  deletionTitle: { color: '#7A1D13', fontSize: 16, fontWeight: '900', marginBottom: 6 },
  deletionText: { color: '#514743', fontSize: 14, lineHeight: 21 },
  retryDeletionButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 8 },
  retryDeletionText: { color: '#972317', fontSize: 14, fontWeight: '800' },
});
