/**
 * Explore Tab - PartyCrew Feed
 * Shows content from creators in your PartyCrew (timeline view)
 */

import React from 'react';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { PartyCrewFeedScreen } from '@/components/screens/PartyCrewFeedScreen';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PartyCrew</Text>
        <Text style={styles.headerSubtitle}>Content from your crew</Text>
      </View>

      {/* PartyCrew Feed */}
      <PartyCrewFeedScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});
