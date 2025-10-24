// Event Creation Wizard - Template Selection Screen
// First step: Choose event template

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const TEMPLATES = [
  {
    id: 'birthday',
    name: 'Birthday Party (Adult)',
    description: 'Celebrate with cocktails & entertainment',
    icon: '🎉',
    color: '#FF6B9D',
  },
  {
    id: 'kids-birthday',
    name: 'Kids Birthday Party',
    description: 'Fun activities for children',
    icon: '🎈',
    color: '#FFB74D',
  },
  {
    id: 'wedding',
    name: 'Wedding',
    description: 'Plan your special day',
    icon: '💍',
    color: '#EC407A',
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Showcase your product',
    icon: '🚀',
    color: '#42A5F5',
  },
  {
    id: 'fundraiser',
    name: 'Fundraiser',
    description: 'Charity event with auctions',
    icon: '💰',
    color: '#66BB6A',
  },
  {
    id: 'festival',
    name: 'Music Festival',
    description: 'Multi-stage event',
    icon: '🎵',
    color: '#AB47BC',
  },
  {
    id: 'conference',
    name: 'Conference',
    description: 'Professional meetup',
    icon: '🎤',
    color: '#26A69A',
  },
  {
    id: 'travel',
    name: 'Group Travel',
    description: 'Multi-day trip planning',
    icon: '✈️',
    color: '#5C6BC0',
  },
  {
    id: 'block-party',
    name: 'Block Party',
    description: 'Community celebration',
    icon: '🏘️',
    color: '#FF7043',
  },
  {
    id: 'class',
    name: 'Class/Workshop',
    description: 'Learning experience',
    icon: '📚',
    color: '#78909C',
  },
  {
    id: 'hackathon',
    name: 'Hackathon',
    description: 'Competitive coding event',
    icon: '💻',
    color: '#8D6E63',
  },
];

export default function TemplateSelectionScreen() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      router.push({
        pathname: '/events/create/basics',
        params: { template: templateId, templateName: template.name },
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Event</Text>
        <Text style={styles.subtitle}>Choose a template to get started</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {TEMPLATES.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[styles.card, { borderColor: template.color }]}
              onPress={() => handleTemplateSelect(template.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: template.color + '20' }]}>
                <Text style={styles.icon}>{template.icon}</Text>
              </View>
              <Text style={styles.cardTitle}>{template.name}</Text>
              <Text style={styles.cardDescription}>{template.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});
