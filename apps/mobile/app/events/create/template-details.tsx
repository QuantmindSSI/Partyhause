// Event Creation Wizard - Template-Specific Details Screen
// Step 2.5: Enter template-specific information

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TemplateForm, { TemplateFormData } from '@/components/forms/TemplateForm';

export default function TemplateDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [templateData, setTemplateData] = useState<TemplateFormData>({});
  const [isValid, setIsValid] = useState(false);

  const handleContinue = () => {
    if (!isValid) {
      Alert.alert('Incomplete', 'Please fill in all required fields');
      return;
    }

    // Navigate to guest import with all data
    router.push({
      pathname: '/events/create/guests',
      params: {
        ...params,
        templateSettings: JSON.stringify(templateData),
      },
    });
  };

  const handleSkip = () => {
    // Skip template-specific details and go directly to guests
    router.push({
      pathname: '/events/create/guests',
      params: {
        ...params,
        templateSettings: JSON.stringify({}),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Event Details</Text>
          <Text style={styles.subtitle}>
            {params.template ? `${String(params.template).replace('-', ' ')} specific details` : 'Additional details'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '40%' }]} />
        </View>
        <Text style={styles.progressText}>Step 2 of 5</Text>
      </View>

      {/* Template-Specific Form */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TemplateForm
          template={params.template as string}
          initialData={templateData}
          onChange={setTemplateData}
          onValidation={setIsValid}
        />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 16,
    color: '#9333ea',
    fontWeight: '600',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9333ea',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9333ea',
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
