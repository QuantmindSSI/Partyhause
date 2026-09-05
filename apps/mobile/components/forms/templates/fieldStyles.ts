/**
 * Styles and pure helpers for the template form fields.
 *
 * Separate from fields.tsx so that file exports components and nothing else.
 * A module mixing components with constants breaks React Fast Refresh, which
 * turns every style tweak into a full reload.
 */

import { StyleSheet } from 'react-native';

/** Drops blank entries and trims the rest, so empty rows never reach the payload. */
export function cleanList(rows: string[]): string[] {
  return rows.map((r) => r.trim()).filter((r) => r.length > 0);
}

export const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  // coral-700 from docs/BRAND.md. 5.86:1 with white, and distinct from the
  // danger red so a required marker is not mistaken for an error.
  required: { color: '#C02A16' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: { minHeight: 80, paddingTop: 12 },
  helperText: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleLabelWrap: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: '#C02A16', borderColor: '#C02A16' },
  chipText: { fontSize: 14, color: '#4b5563' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  repeaterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  repeaterInput: { flex: 1 },
  repeaterRemove: { padding: 4 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  addButtonText: { fontSize: 15, fontWeight: '600', color: '#C02A16' },
});
