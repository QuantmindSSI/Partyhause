import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  getTemplateBackground,
  getTemplateColors,
  getTemplateDisplayName,
  getTemplateIcon,
} from '@/utils/templateBackgrounds';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.52;
const CARD_SPACING = SCREEN_WIDTH * 0.88;

interface Event {
  id: string;
  title: string;
  description?: string;
  template_type: string;
  start_date: string;
  end_date?: string;
  location?: any;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  settings?: Record<string, any>;
  host_id?: string;
}

interface EventCardProps {
  event: Event;
  position: 'left' | 'center' | 'right';
  index: number;
  totalCards: number;
  translateX: SharedValue<number>;
  velocity?: SharedValue<number>;
  onPress?: () => void;
  currentUserId?: string;
}

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const EventCard: React.FC<EventCardProps> = ({
  event,
  position,
  index,
  totalCards,
  translateX,
  velocity,
  onPress,
  currentUserId,
}) => {
  const colors = getTemplateColors(event.template_type);
  const backgroundImage = getTemplateBackground(event.template_type);
  const displayName = getTemplateDisplayName(event.template_type);
  const icon = getTemplateIcon(event.template_type);

  const isHost = currentUserId && event.host_id === currentUserId;
  const userRole = isHost ? 'HOST' : 'GUEST';

  const getCardOffsetX = () => {
    const centerOffset = (SCREEN_WIDTH / 2) - (CARD_WIDTH / 2);
    return (index * CARD_SPACING) + centerOffset;
  };

  const positionOffsetX = getCardOffsetX();

  const animatedCardStyle = useAnimatedStyle(() => {
    'worklet';
    const currentCardX = positionOffsetX + translateX.value;
    const screenCenter = SCREEN_WIDTH / 2;
    const cardCenter = currentCardX + (CARD_WIDTH / 2);
    const distanceFromCenter = Math.abs(cardCenter - screenCenter);
    const normalizedDistance = Math.min(distanceFromCenter / (SCREEN_WIDTH * 0.45), 1.0);
    const direction = (cardCenter - screenCenter) > 0 ? 1 : -1;
    
    const currentVelocity = velocity?.value || 0;
    const velocityFactor = Math.min(Math.abs(currentVelocity) / 2000, 1.0);
    
    const scale = interpolate(
      normalizedDistance,
      [0, 0.25, 0.5, 0.75, 1.0],
      [1.0, 0.96, 0.90, 0.85, 0.80],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      normalizedDistance,
      [0, 0.2, 0.5, 0.8, 1.0],
      [1.0, 0.90, 0.75, 0.60, 0.45],
      Extrapolate.CLAMP
    );
    
    const baseRotateY = interpolate(
      normalizedDistance,
      [0, 0.3, 0.6, 1.0],
      [0, -10, -22, -35],
      Extrapolate.CLAMP
    );
    const rotateY = (baseRotateY * -direction) * (1 + velocityFactor * 0.3);
    
    const rotateX = interpolate(
      velocityFactor,
      [0, 0.3, 0.6, 1.0],
      [0, -2, -4, -6],
      Extrapolate.CLAMP
    ) * (currentVelocity > 0 ? 1 : -1);
    
    const translateY = interpolate(
      normalizedDistance,
      [0, 0.3, 0.6, 1.0],
      [0, 15, 30, 50],
      Extrapolate.CLAMP
    );
    
    const zIndex = Math.round((1 - normalizedDistance) * 100);

    return {
      transform: [
        { perspective: 2200 },
        { translateX: currentCardX },
        { rotateY: `${rotateY}deg` },
        { rotateX: `${rotateX}deg` },
        { translateY },
        { scale },
      ],
      opacity,
      zIndex,
    };
  }, [positionOffsetX, translateX, velocity]);

  const getBlurRadius = () => {
    'worklet';
    const currentCardX = positionOffsetX + translateX.value;
    const screenCenter = SCREEN_WIDTH / 2;
    const cardCenter = currentCardX + (CARD_WIDTH / 2);
    const distanceFromCenter = Math.abs(cardCenter - screenCenter);
    const normalizedDistance = Math.min(distanceFromCenter / (SCREEN_WIDTH * 0.45), 1.0);
    
    return interpolate(
      normalizedDistance,
      [0, 0.2, 0.5, 0.8, 1.0],
      [0, 1, 4, 9, 15],
      Extrapolate.CLAMP
    );
  };
  
  const animatedShadowStyle = useAnimatedStyle(() => {
    'worklet';
    const currentCardX = positionOffsetX + translateX.value;
    const screenCenter = SCREEN_WIDTH / 2;
    const cardCenter = currentCardX + (CARD_WIDTH / 2);
    const distanceFromCenter = Math.abs(cardCenter - screenCenter);
    const normalizedDistance = Math.min(distanceFromCenter / (SCREEN_WIDTH * 0.45), 1.0);
    
    const shadowOpacity = interpolate(
      normalizedDistance,
      [0, 0.5, 1.0],
      [0.6, 0.4, 0.2],
      Extrapolate.CLAMP
    );
    
    const shadowRadius = interpolate(
      normalizedDistance,
      [0, 0.5, 1.0],
      [32, 20, 10],
      Extrapolate.CLAMP
    );
    
    const elevation = interpolate(
      normalizedDistance,
      [0, 0.5, 1.0],
      [20, 12, 6],
      Extrapolate.CLAMP
    );
    
    return {
      shadowOpacity,
      shadowRadius,
      elevation,
    };
  }, [positionOffsetX, translateX]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  const getLocationText = () => {
    if (!event.location) return null;
    if (typeof event.location === 'string') return event.location;
    if (event.location.name) return event.location.name;
    if (event.location.address) return event.location.address;
    return null;
  };

  return (
    <AnimatedTouchable
      style={[styles.cardContainer, animatedCardStyle]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <Animated.View style={[styles.card, animatedShadowStyle]}>
        {/* Background Image with Dynamic Blur - Less blur for center card */}
        <AnimatedImageBackground
          source={{ uri: backgroundImage }}
          style={styles.background}
          blurRadius={getBlurRadius()}
          resizeMode="cover"
        >
          {/* Dark Gradient Overlay - Stronger for better text readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.75)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Card Content */}
          <View style={styles.content}>
            {/* Header - Subtle Apple Style Badges */}
          <View style={styles.header}>
            <View style={styles.templateBadge}>
              <Ionicons name={icon as any} size={14} color="#fff" />
              <Text style={styles.templateText}>{displayName}</Text>
            </View>
            <View style={styles.headerRight}>
              {/* User Role Badge - Subtle */}
              <View style={styles.roleBadge}>
                <Ionicons name={isHost ? 'star' : 'person'} size={11} color="#fff" />
                <Text style={styles.roleText}>{userRole}</Text>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.body}>
            {/* Large, Bold Event Title - Apple Invites Style */}
            <Text style={styles.title} numberOfLines={3}>
              {event.title}
            </Text>
            
            {/* Event Details - Prominent and Clear */}
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.95)" />
                <Text style={styles.detailText}>
                  {formatDate(event.start_date)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time" size={20} color="rgba(255,255,255,0.95)" />
                <Text style={styles.detailText}>
                  {formatTime(event.start_date)}
                </Text>
              </View>

              {getLocationText() && (
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={20} color="rgba(255,255,255,0.95)" />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {getLocationText()}
                  </Text>
                </View>
              )}
            </View>
          </View>
          </View>
        </AnimatedImageBackground>
      </Animated.View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 28, // Apple Invites style - softer corners
    overflow: 'hidden',
    backgroundColor: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  background: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)', // Subtle dark background
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  templateText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    fontSize: 30, // Slightly increased from 28
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 36, // Adjusted for new font size
  },
  description: {
    fontSize: 15, // Increased from 14
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 21, // Adjusted for readability
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 16, // Larger text for Apple style
    fontWeight: '500',
    color: 'rgba(255,255,255,0.95)',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 7,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 15, // Slightly increased from 14
    borderRadius: 15, // Slightly increased from 14
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
