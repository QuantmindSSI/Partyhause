import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TemplateFormData } from '../TemplateForm';

interface TravelFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

export default function TravelForm({ initialData = {}, onChange, onValidation }: TravelFormProps) {
  React.useEffect(() => {
    onValidation(true);
    onChange({});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>TravelForm - Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholder: { fontSize: 16, color: '#6b7280' },
});
