import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface LandingScreenProps {
  onGetStarted: () => void;
}

export const LandingScreen = ({ onGetStarted }: LandingScreenProps) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🎉 PartyHause</Text>
        <Text style={styles.tagline}>Where Every Party Becomes Legendary</Text>
        
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoText}>🎬</Text>
            <Text style={styles.videoSubtext}>Party Planning Made Simple</Text>
          </View>
        </View>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>✨ Everything You Need</Text>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📋</Text>
          <Text style={styles.featureTitle}>Smart Planning</Text>
          <Text style={styles.featureDesc}>
            Create and manage events with ease. From intimate gatherings to grand celebrations.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>👥</Text>
          <Text style={styles.featureTitle}>Guest Management</Text>
          <Text style={styles.featureDesc}>
            Track RSVPs, send invites, and keep everyone in the loop with real-time updates.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🎯</Text>
          <Text style={styles.featureTitle}>Collaborative Tools</Text>
          <Text style={styles.featureDesc}>
            PartyBoards, polls, shared itineraries, and more to make planning effortless.
          </Text>
        </View>
      </View>

      <View style={styles.cta}>
        <TouchableOpacity style={styles.primaryButton} onPress={onGetStarted}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={styles.ctaSubtext}>
          Join thousands making parties unforgettable
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    paddingBottom: 40,
  },
  hero: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#a8a8b3',
    textAlign: 'center',
    marginBottom: 32,
  },
  videoContainer: {
    width: width - 48,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a24',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
  },
  videoText: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoSubtext: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: '600',
  },
  features: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  featuresTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 15,
    color: '#a8a8b3',
    lineHeight: 22,
  },
  cta: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  ctaSubtext: {
    fontSize: 14,
    color: '#a8a8b3',
    marginTop: 16,
    textAlign: 'center',
  },
});
