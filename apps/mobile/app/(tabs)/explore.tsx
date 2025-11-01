import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
}

export default function ExploreScreen() {
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    fetchEventTemplates();
  }, []);

  const checkAuthStatus = async () => {
    if (!supabase) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    }
  };

  const fetchEventTemplates = async () => {
    try {
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from('event_templates')
        .select('*')
        .limit(10);

      if (error) {
        console.error('Error fetching templates:', error);
      } else {
        setTemplates(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplatePress = (template: EventTemplate) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to create events',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(tabs)') }
        ]
      );
      return;
    }
    router.push(`/events/create?templateId=${template.id}` as any);
  };

  const handleCreateFromScratch = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to create events',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(tabs)') }
        ]
      );
      return;
    }
    router.push('/events/create');
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
            color: '#1F2937',
            fontSize: 28,
            fontWeight: 'bold',
          }}>
          Explore Events
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Discover event templates or create your own
        </ThemedText>
      </ThemedView>

      {isAuthenticated && (
        <ThemedView style={styles.section}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateFromScratch}
          >
            <Text style={styles.createButtonText}>Create New Event</Text>
          </TouchableOpacity>
        </ThemedView>
      )}
      
      {!isAuthenticated && (
        <ThemedView style={styles.section}>
          <View style={styles.signInPrompt}>
            <Text style={styles.signInPromptText}>
              Sign in to create your own events
            </Text>
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      )}

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Event Templates</ThemedText>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading templates...</Text>
          </View>
        ) : (
          <View style={styles.templatesGrid}>
            {templates.length > 0 ? (
              templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => handleTemplatePress(template)}
                >
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDescription} numberOfLines={2}>
                    {template.description}
                  </Text>
                  <Text style={styles.templateCategory}>{template.category}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noTemplatesText}>
                No templates available. Create your first event!
              </Text>
            )}
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  titleContainer: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 24,
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    minHeight: 120,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  templateCategory: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  noTemplatesText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 40,
  },
  signInPrompt: {
    backgroundColor: '#EEF2FF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  signInPromptText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
