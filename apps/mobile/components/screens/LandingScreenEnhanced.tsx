import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface LandingScreenProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

// Shared data matching web landing page
const experienceArchetypes = [
  {
    title: "The Intimate Curator",
    description: "You create meaningful moments through thoughtful details and personal connections.",
    icon: "❤️",
    colors: ['#fb7185', '#fb923c'] as const,
  },
  {
    title: "The Bold Creator",
    description: "You transform spaces and experiences with innovative ideas and creative energy.",
    icon: "🪄",
    colors: ['#a78bfa', '#ec4899'] as const,
  },
  {
    title: "The Mindful Host",
    description: "You believe in quality over quantity, creating authentic experiences that nourish the soul.",
    icon: "💡",
    colors: ['#34d399', '#14b8a6'] as const,
  },
  {
    title: "The Culture Catalyst",
    description: "You bring people together across communities, creating bridges through shared celebration.",
    icon: "☕",
    colors: ['#fbbf24', '#fb923c'] as const,
  },
];

const features = [
  {
    icon: "📅",
    title: "Smart Event Planning",
    description: "Create and manage events with ease. From intimate gatherings to grand celebrations.",
  },
  {
    icon: "📧",
    title: "Beautiful Invitations",
    description: "Send stunning email invitations that guests will love. Track opens and RSVPs in real-time.",
  },
  {
    icon: "👥",
    title: "Guest Management",
    description: "Track RSVPs, manage guest lists, and keep everyone in the loop with real-time updates.",
  },
  {
    icon: "📊",
    title: "Real-time Analytics",
    description: "Get insights into your events with detailed analytics and engagement metrics.",
  },
];

export const LandingScreen = ({ onGetStarted, onSignIn }: LandingScreenProps) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const scrollY = useSharedValue(0);
  
  const player = useVideoPlayer(require('../../assets/videos/Video_concept_lively_202509130901.mp4'), player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    // Set video as loaded since expo-video handles loading automatically
    setVideoLoaded(true);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 200],
      [1, 0.5],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Video Background */}
      <View style={styles.videoBackground}>
        <VideoView
          player={player}
          contentFit="cover"
          style={styles.video}
        />
        {/* Video Overlays - matching web styling */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
          style={styles.videoOverlay}
        />
        <LinearGradient
          colors={['rgba(234,88,12,0.15)', 'transparent', 'rgba(147,51,234,0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.videoOverlay}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.videoOverlay}
        />
        
        {/* Noise texture overlay */}
        <View style={styles.noiseOverlay} />
      </View>

      {/* Fixed Header with Blur */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <BlurView intensity={80} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <Text style={styles.headerLogo}>🎉 PartyHause</Text>
            {onSignIn && (
              <TouchableOpacity
                style={styles.signInButton}
                onPress={onSignIn}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.hero, heroAnimatedStyle]}>
          <Text style={styles.heroTitle}>
            Create Unforgettable{'\n'}Experiences
          </Text>
          <Text style={styles.heroSubtitle}>
            Transform ordinary moments into extraordinary memories
          </Text>
          
          {/* CTA Buttons */}
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onGetStarted}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6C63FF', '#5a52d5']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Text style={styles.buttonIcon}>✨</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {onSignIn && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onSignIn}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Scroll indicator */}
          <View style={styles.scrollIndicator}>
            <Text style={styles.scrollText}>Scroll to explore</Text>
            <Text style={styles.scrollIcon}>⌄</Text>
          </View>
        </Animated.View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBadge}>✨ FEATURES</Text>
            <Text style={styles.sectionTitle}>Everything You Need</Text>
            <Text style={styles.sectionSubtitle}>
              Powerful tools to create memorable events
            </Text>
          </View>
          
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Experience Archetypes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBadge}>🎭 DISCOVER YOUR STYLE</Text>
            <Text style={styles.sectionTitle}>Experience Archetypes</Text>
            <Text style={styles.sectionSubtitle}>
              Find your unique hosting personality
            </Text>
          </View>
          
          <View style={styles.archetypesContainer}>
            {experienceArchetypes.map((archetype, index) => (
              <View key={index} style={styles.archetypeCard}>
                <LinearGradient
                  colors={archetype.colors}
                  style={styles.archetypeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.archetypeContent}>
                    <Text style={styles.archetypeIcon}>{archetype.icon}</Text>
                    <Text style={styles.archetypeTitle}>{archetype.title}</Text>
                    <Text style={styles.archetypeDescription}>
                      {archetype.description}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* Social Proof Section */}
        <View style={styles.section}>
          <View style={styles.socialProof}>
            <Text style={styles.socialProofText}>
              Join thousands of hosts creating unforgettable experiences
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>10k+</Text>
                <Text style={styles.statLabel}>Events Created</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>50k+</Text>
                <Text style={styles.statLabel}>Happy Guests</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>4.9★</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Final CTA Section */}
        <View style={styles.finalCta}>
          <LinearGradient
            colors={['#6C63FF', '#5a52d5', '#4845b4']}
            style={styles.finalCtaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.finalCtaTitle}>Ready to Get Started?</Text>
            <Text style={styles.finalCtaSubtitle}>
              Create your first unforgettable event today
            </Text>
            <TouchableOpacity
              style={styles.finalCtaButton}
              onPress={onGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.finalCtaButtonText}>Start Creating</Text>
              <Text style={styles.finalCtaButtonIcon}>→</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>🎉 PartyHause</Text>
          <Text style={styles.footerTagline}>
            Making events memorable, one invitation at a time
          </Text>
          <Text style={styles.footerCopyright}>
            © 2025 PartyHause. All rights reserved.
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    width,
    height: height * 0.8,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
  },
  headerLogo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  signInButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  hero: {
    minHeight: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 56,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 60,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonIcon: {
    fontSize: 20,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollIndicator: {
    alignItems: 'center',
    gap: 8,
  },
  scrollText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  scrollIcon: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 24,
  },
  section: {
    backgroundColor: '#0a0a0f',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    marginBottom: 40,
    alignItems: 'center',
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C63FF',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 24,
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
  featureDescription: {
    fontSize: 15,
    color: '#a8a8b3',
    lineHeight: 22,
  },
  archetypesContainer: {
    gap: 20,
  },
  archetypeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  archetypeGradient: {
    padding: 2,
  },
  archetypeContent: {
    backgroundColor: '#1a1a24',
    borderRadius: 18,
    padding: 32,
  },
  archetypeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  archetypeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  archetypeDescription: {
    fontSize: 16,
    color: '#a8a8b3',
    lineHeight: 24,
  },
  socialProof: {
    alignItems: 'center',
    gap: 32,
  },
  socialProofText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6C63FF',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#a8a8b3',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a3a',
  },
  finalCta: {
    marginHorizontal: 24,
    marginVertical: 40,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  finalCtaGradient: {
    padding: 48,
    alignItems: 'center',
  },
  finalCtaTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  finalCtaSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 32,
    textAlign: 'center',
  },
  finalCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
  },
  finalCtaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  finalCtaButtonIcon: {
    color: '#fff',
    fontSize: 24,
  },
  footer: {
    backgroundColor: '#000',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  footerLogo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  footerTagline: {
    fontSize: 14,
    color: '#a8a8b3',
    textAlign: 'center',
  },
  footerCopyright: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});
