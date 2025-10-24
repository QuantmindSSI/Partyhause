import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Contacts from 'expo-contacts';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  plus_ones: number;
}

export default function GuestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
    plus_ones: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Add guest manually
  const addGuest = () => {
    if (!newGuest.name.trim()) {
      Alert.alert('Error', 'Please enter a guest name');
      return;
    }

    const guest: Guest = {
      id: Date.now().toString(),
      ...newGuest,
    };

    setGuests([...guests, guest]);
    setNewGuest({ name: '', email: '', phone: '', plus_ones: 0 });
  };

  // Remove guest
  const removeGuest = (id: string) => {
    setGuests(guests.filter(g => g.id !== id));
  };

  // Import from contacts
  const importFromContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot access contacts');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
      });

      if (data.length === 0) {
        Alert.alert('No Contacts', 'No contacts found');
        return;
      }

      // Convert contacts to guests
      const importedGuests: Guest[] = data.slice(0, 50).map((contact) => ({
        id: contact.id || Date.now().toString() + Math.random(),
        name: contact.name || 'Unknown',
        email: contact.emails?.[0]?.email || '',
        phone: contact.phoneNumbers?.[0]?.number || '',
        plus_ones: 0,
      }));

      setGuests([...guests, ...importedGuests]);
      Alert.alert('Success', `Imported ${importedGuests.length} contacts`);
    } catch (error) {
      Alert.alert('Error', 'Failed to import contacts');
    }
  };

  // Import from CSV
  const importFromCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      // In production, parse CSV file here
      Alert.alert('Coming Soon', 'CSV import will be available soon');
    } catch (error) {
      Alert.alert('Error', 'Failed to import CSV file');
    }
  };

  // Continue to next step
  const handleContinue = () => {
    if (guests.length === 0) {
      Alert.alert(
        'No Guests',
        'You can add guests later, or add some now.',
        [
          { text: 'Add Guests', style: 'cancel' },
          {
            text: 'Skip',
            onPress: () => router.push({
              pathname: '/events/create/timeline',
              params: { ...params, guestCount: '0' },
            }),
          },
        ]
      );
      return;
    }

    // Pass guest data to next screen
    router.push({
      pathname: '/events/create/timeline',
      params: { 
        ...params, 
        guests: JSON.stringify(guests),
        guestCount: guests.length.toString(),
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Guest List</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressLine} />
        <View style={styles.progressDot} />
        <View style={styles.progressLine} />
        <View style={styles.progressDot} />
      </View>
      <Text style={styles.stepText}>Step 3 of 5</Text>

      {/* Import Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Import Guests</Text>
        <View style={styles.importButtons}>
          <TouchableOpacity
            style={styles.importButton}
            onPress={importFromContacts}
          >
            <Ionicons name="people" size={24} color="#6366F1" />
            <Text style={styles.importButtonText}>From Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.importButton}
            onPress={importFromCSV}
          >
            <Ionicons name="document" size={24} color="#6366F1" />
            <Text style={styles.importButtonText}>Import CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Add Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Manually</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Guest Name *"
          value={newGuest.name}
          onChangeText={(text) => setNewGuest({ ...newGuest, name: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={newGuest.email}
          onChangeText={(text) => setNewGuest({ ...newGuest, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={newGuest.phone}
          onChangeText={(text) => setNewGuest({ ...newGuest, phone: text })}
          keyboardType="phone-pad"
        />

        <View style={styles.plusOneContainer}>
          <Text style={styles.plusOneLabel}>Plus Ones</Text>
          <View style={styles.plusOneControls}>
            <TouchableOpacity
              style={styles.plusOneButton}
              onPress={() =>
                setNewGuest({
                  ...newGuest,
                  plus_ones: Math.max(0, newGuest.plus_ones - 1),
                })
              }
            >
              <Ionicons name="remove" size={20} color="#6366F1" />
            </TouchableOpacity>
            <Text style={styles.plusOneValue}>{newGuest.plus_ones}</Text>
            <TouchableOpacity
              style={styles.plusOneButton}
              onPress={() =>
                setNewGuest({ ...newGuest, plus_ones: newGuest.plus_ones + 1 })
              }
            >
              <Ionicons name="add" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addGuest}>
          <Ionicons name="person-add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add Guest</Text>
        </TouchableOpacity>
      </View>

      {/* Guest List */}
      {guests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Guest List ({guests.length})
          </Text>
          {guests.map((guest) => (
            <View key={guest.id} style={styles.guestCard}>
              <View style={styles.guestInfo}>
                <Text style={styles.guestName}>{guest.name}</Text>
                {guest.email ? (
                  <Text style={styles.guestDetail}>{guest.email}</Text>
                ) : null}
                {guest.phone ? (
                  <Text style={styles.guestDetail}>{guest.phone}</Text>
                ) : null}
                {guest.plus_ones > 0 ? (
                  <Text style={styles.guestPlusOne}>+{guest.plus_ones}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => removeGuest(guest.id)}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#6366F1',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#6366F1',
  },
  stepText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  importButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    gap: 8,
  },
  importButtonText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  plusOneContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  plusOneLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  plusOneControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  plusOneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusOneValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  guestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  guestDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  guestPlusOne: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
