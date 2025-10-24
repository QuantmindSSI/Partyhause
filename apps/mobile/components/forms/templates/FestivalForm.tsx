import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { TemplateFormData } from '../TemplateForm';

interface FestivalFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

const TICKET_TIERS = ['General Admission', 'VIP', 'Platinum', 'Backstage Pass'];
const CAMPING_OPTIONS = ['Tent Camping', 'RV Spots', 'Glamping', 'Car Camping'];

export default function FestivalForm({ initialData = {}, onChange, onValidation }: FestivalFormProps) {
  const [duration, setDuration] = useState(initialData.duration || '');
  const [scheduleFile, setScheduleFile] = useState<any>(initialData.schedule_file || null);
  const [stages, setStages] = useState<Array<{name: string; location: string}>>(
    initialData.stages || [{ name: '', location: '' }]
  );
  const [ticketTiers, setTicketTiers] = useState<string[]>(initialData.ticket_tiers || []);
  const [hasCamping, setHasCamping] = useState(initialData.has_camping || false);
  const [campingOptions, setCampingOptions] = useState<string[]>(initialData.camping_options || []);
  const [foodVendors, setFoodVendors] = useState(initialData.food_vendors || '');
  const [amenities, setAmenities] = useState(initialData.amenities || '');
  const [transportation, setTransportation] = useState(initialData.transportation || '');

  useEffect(() => {
    const formData: TemplateFormData = {
      duration: duration ? parseInt(duration) : 1,
      schedule_file: scheduleFile,
      stages: stages.filter(s => s.name.trim()),
      ticket_tiers: ticketTiers,
      has_camping: hasCamping,
      camping_options: hasCamping ? campingOptions : [],
      food_vendors: foodVendors,
      amenities,
      transportation,
    };

    onChange(formData);

    // Validation: duration and at least one stage required
    const isValid = duration && parseInt(duration) > 0 && stages.some(s => s.name.trim());
    onValidation(isValid);
  }, [duration, scheduleFile, stages, ticketTiers, hasCamping, campingOptions, foodVendors, amenities, transportation]);

  const pickScheduleFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-excel', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScheduleFile(result.assets[0]);
        Alert.alert('Success', 'Schedule file uploaded!');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const addStage = () => {
    setStages([...stages, { name: '', location: '' }]);
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const updateStage = (index: number, field: 'name' | 'location', value: string) => {
    const updated = [...stages];
    updated[index][field] = value;
    setStages(updated);
  };

  const toggleTicketTier = (tier: string) => {
    if (ticketTiers.includes(tier)) {
      setTicketTiers(ticketTiers.filter(t => t !== tier));
    } else {
      setTicketTiers([...ticketTiers, tier]);
    }
  };

  const toggleCampingOption = (option: string) => {
    if (campingOptions.includes(option)) {
      setCampingOptions(campingOptions.filter(o => o !== option));
    } else {
      setCampingOptions([...campingOptions, option]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Festival Duration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Festival Duration</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Number of Days *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 3"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Schedule Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Festival Schedule</Text>
        <Text style={styles.helperText}>
          Upload a CSV, Excel, or PDF file with your festival lineup and schedule
        </Text>
        
        <TouchableOpacity style={styles.uploadButton} onPress={pickScheduleFile}>
          <Ionicons name="cloud-upload" size={24} color="#9333ea" />
          <Text style={styles.uploadButtonText}>
            {scheduleFile ? scheduleFile.name : 'Upload Schedule File'}
          </Text>
        </TouchableOpacity>

        {scheduleFile && (
          <View style={styles.fileInfo}>
            <Ionicons name="document" size={20} color="#10b981" />
            <Text style={styles.fileName}>{scheduleFile.name}</Text>
            <TouchableOpacity onPress={() => setScheduleFile(null)}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.note}>
          💡 Alternative: You can also build the schedule manually after creating the event
        </Text>
      </View>

      {/* Stages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stages *</Text>
        <Text style={styles.helperText}>Define your festival stages and their locations</Text>

        {stages.map((stage, index) => (
          <View key={index} style={styles.stageRow}>
            <View style={styles.stageInputs}>
              <TextInput
                style={[styles.input, styles.stageInput]}
                placeholder="Stage name (e.g., Main Stage)"
                value={stage.name}
                onChangeText={(value) => updateStage(index, 'name', value)}
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={[styles.input, styles.stageInput]}
                placeholder="Location (e.g., North Field)"
                value={stage.location}
                onChangeText={(value) => updateStage(index, 'location', value)}
                placeholderTextColor="#9ca3af"
              />
            </View>
            {stages.length > 1 && (
              <TouchableOpacity onPress={() => removeStage(index)} style={styles.removeButton}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={addStage} style={styles.addButton}>
          <Ionicons name="add-circle" size={20} color="#9333ea" />
          <Text style={styles.addButtonText}>Add Another Stage</Text>
        </TouchableOpacity>
      </View>

      {/* Ticket Tiers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ticket Tiers</Text>
        <Text style={styles.helperText}>Select the ticket types available</Text>
        <View style={styles.checkboxGroup}>
          {TICKET_TIERS.map((tier) => (
            <TouchableOpacity
              key={tier}
              style={styles.checkboxRow}
              onPress={() => toggleTicketTier(tier)}
            >
              <View style={[styles.checkbox, ticketTiers.includes(tier) && styles.checkboxChecked]}>
                {ticketTiers.includes(tier) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{tier}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Camping */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Ionicons name="bonfire" size={20} color="#9333ea" />
            <Text style={styles.sectionTitle}>Camping Available</Text>
          </View>
          <Switch
            value={hasCamping}
            onValueChange={setHasCamping}
            trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
            thumbColor={hasCamping ? '#9333ea' : '#f3f4f6'}
          />
        </View>

        {hasCamping && (
          <>
            <Text style={styles.helperText}>Select camping options available</Text>
            <View style={styles.checkboxGroup}>
              {CAMPING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.checkboxRow}
                  onPress={() => toggleCampingOption(option)}
                >
                  <View style={[styles.checkbox, campingOptions.includes(option) && styles.checkboxChecked]}>
                    {campingOptions.includes(option) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Food Vendors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Food Vendors</Text>
        <View style={styles.field}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="List food vendors or types (e.g., BBQ, Vegan, Mexican, Food Trucks)"
            value={foodVendors}
            onChangeText={setFoodVendors}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Amenities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.field}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Water stations, First aid, ATMs, Lockers, Charging stations..."
            value={amenities}
            onChangeText={setAmenities}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Transportation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transportation & Parking</Text>
        <View style={styles.field}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Parking info, Shuttle service, Rideshare drop-off locations..."
            value={transportation}
            onChangeText={setTransportation}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  note: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f3e8ff',
    borderWidth: 2,
    borderColor: '#9333ea',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333ea',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stageInputs: {
    flex: 1,
    gap: 8,
  },
  stageInput: {
    marginBottom: 0,
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9333ea',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxGroup: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
});
