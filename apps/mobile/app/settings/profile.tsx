/**
 * Edit the signed-in user's own profile.
 *
 * WHY THIS SCREEN EXISTS
 *   `app/profile/[id].tsx:73` pushed `/settings/profile` from the owner-only
 *   "Edit Profile" button, cast to `any` so the missing route never became a
 *   type error. No `app/settings/` directory existed, so the control led to
 *   expo-router's unmatched screen. That is exactly the class of defect App
 *   Review rejects under guideline 2.1.
 *
 *   `PUT /api/users/me/profile` had existed the whole time. What was missing
 *   was a client method, added as `api.users.updateProfile`, and this screen.
 *
 * VALIDATION IS MIRRORED, NOT INVENTED
 *   The server enforces the lengths and the URL scheme
 *   (`server/routes/users.ts:73-96`). Checking the same rules here turns a
 *   round trip into an immediate message, but the server remains the authority:
 *   anything that slips through is still reported from its response rather than
 *   assumed to have succeeded.
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { UserProfileUpdate } from '@partyhause/core';
import { api } from '@/lib/client';

/** docs/BRAND.md section 4. */
const BRAND = {
  coral: '#FF5233',
  coralDark: '#C02A16',
  ink: '#26201D',
  paper: '#FBFAF9',
  muted: '#6A5E58',
  hairline: '#EBE7E5',
  success: '#0B835B',
};

/** Mirrors server/routes/users.ts:73-77. */
const LIMITS = {
  display_name: 80,
  bio: 500,
  location: 120,
  website_url: 200,
} as const;

interface FormState {
  display_name: string;
  bio: string;
  location: string;
  website_url: string;
}

const EMPTY_FORM: FormState = { display_name: '', bio: '', location: '', website_url: '' };

/**
 * Validate against the server's own rules.
 *
 * @param form Current field values.
 * @returns An error message, or null when the form is submittable.
 */
function validate(form: FormState): string | null {
  const name = form.display_name.trim();
  if (name.length === 0) return 'Display name cannot be empty.';
  if (name.length > LIMITS.display_name) {
    return `Display name must be ${LIMITS.display_name} characters or fewer.`;
  }
  if (form.bio.trim().length > LIMITS.bio) {
    return `Bio must be ${LIMITS.bio} characters or fewer.`;
  }
  if (form.location.trim().length > LIMITS.location) {
    return `Location must be ${LIMITS.location} characters or fewer.`;
  }

  const website = form.website_url.trim();
  if (website.length > LIMITS.website_url) {
    return `Website must be ${LIMITS.website_url} characters or fewer.`;
  }
  // The server refuses a scheme-less URL because the profile screen renders
  // this as a tappable link, where `javascript:` is a stored-XSS payload.
  if (website.length > 0 && !/^https?:\/\//i.test(website)) {
    return 'Website must start with http:// or https://';
  }
  return null;
}

/**
 * Fields whose value differs from what was loaded.
 *
 * Sending only what changed keeps an untouched field untouched, and the server
 * answers 400 when nothing recognisable is sent, so an unchanged form is
 * stopped here rather than turned into a confusing error.
 *
 * @param form Current values.
 * @param original Values as loaded from the server.
 * @returns A patch object, empty when nothing changed.
 */
function buildPatch(form: FormState, original: FormState): UserProfileUpdate {
  const patch: UserProfileUpdate = {};
  const keys: Array<keyof FormState> = ['display_name', 'bio', 'location', 'website_url'];
  for (const key of keys) {
    const next = form[key].trim();
    if (next !== original[key].trim()) patch[key] = next;
  }
  return patch;
}

export default function EditProfileScreen() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [original, setOriginal] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const cached = await api.auth.getCachedUser();
    if (!cached?.id) {
      setLoading(false);
      setError('You need to be signed in to edit your profile.');
      return;
    }

    const { data, error: failure } = await api.users.get(cached.id);
    setLoading(false);

    if (failure || !data) {
      setError(failure?.message ?? 'Could not load your profile.');
      return;
    }

    const loaded: FormState = {
      display_name: data.display_name ?? '',
      bio: data.bio ?? '',
      location: data.location ?? '',
      website_url: data.website_url ?? '',
    };
    setForm(loaded);
    setOriginal(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async () => {
    const invalid = validate(form);
    if (invalid) {
      setError(invalid);
      setSaved(false);
      return;
    }

    const patch = buildPatch(form, original);
    if (Object.keys(patch).length === 0) {
      setError('Nothing has changed yet.');
      setSaved(false);
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);
    const { data, error: failure } = await api.users.updateProfile(patch);
    setSaving(false);

    if (failure || !data) {
      setError(failure?.message ?? 'Could not save your profile.');
      return;
    }

    const persisted: FormState = {
      display_name: data.display_name ?? '',
      bio: data.bio ?? '',
      location: data.location ?? '',
      website_url: data.website_url ?? '',
    };
    setForm(persisted);
    setOriginal(persisted);
    setSaved(true);
  };

  const update = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BRAND.coral} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="Display name"
          value={form.display_name}
          onChangeText={update('display_name')}
          placeholder="Your name"
          maxLength={LIMITS.display_name}
          editable={!saving}
        />
        <Field
          label="Bio"
          value={form.bio}
          onChangeText={update('bio')}
          placeholder="A sentence about you"
          maxLength={LIMITS.bio}
          editable={!saving}
          multiline
        />
        <Field
          label="Location"
          value={form.location}
          onChangeText={update('location')}
          placeholder="City, country"
          maxLength={LIMITS.location}
          editable={!saving}
        />
        <Field
          label="Website"
          value={form.website_url}
          onChangeText={update('website_url')}
          placeholder="https://example.com"
          maxLength={LIMITS.website_url}
          editable={!saving}
          autoCapitalize="none"
          keyboardType="url"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saved ? <Text style={styles.saved}>Profile saved.</Text> : null}

        <TouchableOpacity
          style={[styles.primary, saving && styles.disabled]}
          onPress={() => void save()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Save changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.secondaryText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  maxLength: number;
  editable: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'url';
}

/** One labelled input with a live character budget. */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  editable,
  multiline,
  autoCapitalize,
  keyboardType,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.counter}>
          {value.trim().length}/{maxLength}
        </Text>
      </View>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={BRAND.muted}
        maxLength={maxLength}
        editable={editable}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={!keyboardType}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.paper },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.paper },
  content: { padding: 16, paddingBottom: 48 },
  field: { marginBottom: 18 },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 14, fontWeight: '600', color: BRAND.ink },
  counter: { fontSize: 12, color: BRAND.muted },
  input: {
    borderWidth: 1,
    borderColor: BRAND.hairline,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BRAND.ink,
    backgroundColor: '#FFFFFF',
  },
  inputMultiline: { minHeight: 110, textAlignVertical: 'top' },
  primary: {
    backgroundColor: BRAND.coral,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  secondary: { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { fontSize: 15, color: BRAND.muted },
  error: { fontSize: 14, color: BRAND.coralDark, marginBottom: 12, lineHeight: 20 },
  saved: { fontSize: 14, color: BRAND.success, marginBottom: 12, fontWeight: '600' },
});
