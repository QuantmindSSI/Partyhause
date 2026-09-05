/**
 * Shared field primitives for the event-template forms.
 *
 * Why this exists
 * ---------------
 * Six of the thirteen template forms shipped as 27-line stubs that rendered
 * "Coming Soon" and then called `onValidation(true)` with an empty payload, so
 * the create wizard advanced past them having collected nothing. That is
 * `GAP-EVT-05` in the iOS gap register, marked BLOCKER.
 *
 * The seven working forms are 445 to 1,456 lines each and are almost entirely
 * the same JSX repeated: a label, a bordered TextInput, a chip row, a toggle.
 * Writing six more in that style would have added roughly 2,400 lines of
 * duplication for six screens that differ only in their field lists.
 *
 * These primitives carry the markup and the styling once. Each form then
 * declares what it collects and how it validates, which is the part that
 * actually differs. The existing seven forms are deliberately untouched.
 *
 * Visual language is copied from FestivalForm so the six new screens are
 * indistinguishable from the ones already shipping.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  type KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './fieldStyles';

/** A labelled single-line or multi-line text input. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  required = false,
  helper,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  required?: boolean;
  helper?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={label}
      />
    </View>
  );
}

/**
 * Numeric field. Keeps the raw string in state rather than a parsed number so a
 * half-typed value is not destroyed mid-edit, and strips anything that is not a
 * digit so the value can always be parsed by the caller.
 */
export function NumberField(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  helper?: string;
}) {
  return (
    <TextField
      {...props}
      keyboardType="number-pad"
      onChangeText={(v) => props.onChangeText(v.replace(/[^0-9]/g, ''))}
    />
  );
}

/** Boolean switch with a label, used to gate dependent fields. */
export function ToggleField({
  label,
  value,
  onValueChange,
  helper,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  helper?: string;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelWrap}>
          <Text style={styles.label}>{label}</Text>
          {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
          thumbColor={value ? '#C02A16' : '#f4f3f4'}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

/**
 * Multi-select chip row.
 *
 * Selection is a plain array rather than a Set because the value is written
 * straight into the form payload and has to serialise to JSON.
 */
export function ChipMultiSelect({
  label,
  options,
  selected,
  onToggle,
  required = false,
  helper,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (next: string[]) => void;
  required?: boolean;
  helper?: string;
}) {
  const toggle = (option: string) => {
    onToggle(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option],
    );
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
      <View style={styles.chipRow}>
        {options.map((option) => {
          const isOn = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, isOn && styles.chipOn]}
              onPress={() => toggle(option)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isOn }}
              accessibilityLabel={option}
            >
              {isOn ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              <Text style={[styles.chipText, isOn && styles.chipTextOn]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Repeating single-field rows, for lists whose length the user controls.
 *
 * The last row cannot be removed, so the control never renders an empty list
 * with no way to add to it.
 */
export function RepeaterField({
  label,
  rows,
  onChange,
  placeholder,
  addLabel,
  helper,
}: {
  label: string;
  rows: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel: string;
  helper?: string;
}) {
  const setAt = (i: number, v: string) => onChange(rows.map((r, idx) => (idx === i ? v : r)));
  const removeAt = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
      {rows.map((row, i) => (
        <View key={i} style={styles.repeaterRow}>
          <TextInput
            style={[styles.input, styles.repeaterInput]}
            value={row}
            onChangeText={(v) => setAt(i, v)}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            accessibilityLabel={`${label} ${i + 1}`}
          />
          {rows.length > 1 ? (
            <TouchableOpacity
              onPress={() => removeAt(i)}
              style={styles.repeaterRemove}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label} ${i + 1}`}
            >
              <Ionicons name="close-circle" size={22} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      <TouchableOpacity
        onPress={() => onChange([...rows, ''])}
        style={styles.addButton}
        accessibilityRole="button"
        accessibilityLabel={addLabel}
      >
        <Ionicons name="add" size={18} color="#C02A16" />
        <Text style={styles.addButtonText}>{addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Groups related fields under a heading. */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
