import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { supabase, requireSupabase } from '@/lib/supabase';

interface AuthScreenProps {
  onBackToLanding: () => void;
  onAuthSuccess: () => void;
}

export const AuthScreen = ({ onBackToLanding, onAuthSuccess }: AuthScreenProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Please enter email and password' });
      return;
    }

    if (!isLogin && !name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your name' });
      return;
    }

    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase not configured' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const client = requireSupabase();

      if (isLogin) {
        // Sign In
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: '🎉 Welcome back!',
        });

        // Auth state listener will handle navigation
      } else {
        // Sign Up
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              name: name.trim() || email.split('@')[0],
              full_name: name.trim() || email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: '🎉 Account created! Signing you in...',
        });

        // Auth state listener will handle navigation
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || `Failed to ${isLogin ? 'sign in' : 'sign up'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={onBackToLanding}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>🎉</Text>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back!' : 'Join PartyHause'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Sign in to continue' : 'Create your account to get started'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setMessage(null);
            }}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchTextBold}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>

          {message && (
            <View style={[
              styles.messageBox,
              message.type === 'success' ? styles.successBox : styles.errorBox
            ]}>
              <Text style={[
                styles.messageText,
                message.type === 'success' ? styles.successText : styles.errorText
              ]}>
                {message.text}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>
            {isLogin ? 'First time here?' : 'Why create an account?'}
          </Text>
          {isLogin ? (
            <>
              <Text style={styles.infoItem}>• Create and manage events</Text>
              <Text style={styles.infoItem}>• Invite guests and track RSVPs</Text>
              <Text style={styles.infoItem}>• Access collaborative planning tools</Text>
            </>
          ) : (
            <>
              <Text style={styles.infoItem}>• Free to use, no credit card required</Text>
              <Text style={styles.infoItem}>• Organize unlimited events</Text>
              <Text style={styles.infoItem}>• Collaborate with co-hosts</Text>
            </>
          )}
          <Text style={styles.infoNote}>
            Your data is secure and never shared with third parties.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a8a8b3',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a24',
    borderWidth: 2,
    borderColor: '#2a2a3a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchText: {
    color: '#a8a8b3',
    fontSize: 14,
  },
  switchTextBold: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  messageBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: '#0f3a2e',
    borderColor: '#10b981',
  },
  errorBox: {
    backgroundColor: '#3a0f0f',
    borderColor: '#ef4444',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#10b981',
  },
  errorText: {
    color: '#ef4444',
  },
  info: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#a8a8b3',
    marginBottom: 8,
    paddingLeft: 8,
  },
  infoNote: {
    fontSize: 13,
    color: '#6C63FF',
    marginTop: 12,
    lineHeight: 18,
  },
});
