import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { EventCard } from './EventCard';
import { router } from 'expo-router';
import { Event } from '@/types/event';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85; // Match EventCard width
const CARD_SPACING = SCREEN_WIDTH * 0.90; // Match EventCard spacing

interface EventCardCarouselProps {
  events: Event[];
  onEventPress?: (event: Event) => void;
  onIndexChange?: (index: number) => void;
  currentUserId?: string;
}

export const EventCardCarousel: React.FC<EventCardCarouselProps> = ({
  events,
  onEventPress,
  onIndexChange,
  currentUserId,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const velocity = useSharedValue(0);

  useEffect(() => {
    // Position the middle set of cards at the center
    // Card at index events.length should be centered on screen
    const centerOffset = (SCREEN_WIDTH / 2) - (CARD_WIDTH / 2);
    const initialOffset = -(events.length * CARD_SPACING) + centerOffset;
    translateX.value = initialOffset;
    offsetX.value = initialOffset;
  }, [events.length]);

  const handleCardPress = useCallback((index: number) => {
    const actualIndex = index % events.length;
    const event = events[actualIndex];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (onEventPress) {
      onEventPress(event);
    } else {
      router.push(`/events/${event.id}`);
    }
  }, [events, onEventPress]);

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .activeOffsetX([-5, 5])
    .failOffsetY([-20, 20])
    .onStart(() => {
      offsetX.value = translateX.value;
      velocity.value = 0;
    })
    .onUpdate((event) => {
      translateX.value = offsetX.value + event.translationX;
      velocity.value = event.velocityX;
    })
    .onEnd((event) => {
      const gestureVelocity = event.velocityX;
      velocity.value = gestureVelocity;
      let currentPosition = translateX.value;
      
      // Calculate center offset for consistent positioning
      const centerOffset = (SCREEN_WIDTH / 2) - (CARD_WIDTH / 2);
      
      // Immediately reposition if outside safe boundaries (infinite scroll)
      const middleSetStart = -events.length * CARD_SPACING + centerOffset;
      const middleSetEnd = -2 * events.length * CARD_SPACING + centerOffset;
      
      if (currentPosition > middleSetStart) {
        currentPosition -= events.length * CARD_SPACING;
        translateX.value = currentPosition;
      } else if (currentPosition < middleSetEnd) {
        currentPosition += events.length * CARD_SPACING;
        translateX.value = currentPosition;
      }
      
      // Adjust for center offset when calculating which card to snap to
      const adjustedPosition = currentPosition - centerOffset;
      const rawIndex = Math.round(-adjustedPosition / CARD_SPACING);
      let actualIndex = rawIndex % events.length;
      if (actualIndex < 0) actualIndex += events.length;
      
      // Calculate target position in the middle set with centering offset
      const normalizedIndex = (rawIndex % events.length) + events.length;
      const targetPosition = -normalizedIndex * CARD_SPACING + centerOffset;
      
      translateX.value = withSpring(
        targetPosition,
        {
          damping: 25,
          stiffness: 250,
          mass: 0.5,
          overshootClamping: false,
          velocity: gestureVelocity * 1.2,
        },
        (finished) => {
          if (finished) {
            offsetX.value = targetPosition;
            
            if (onIndexChange) {
              runOnJS(onIndexChange)(actualIndex);
            }
            
            runOnJS(setCurrentIndex)(actualIndex);
            velocity.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.4 });
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      );
      
      offsetX.value = targetPosition;
    });

  const renderCards = () => {
    if (events.length === 0) return null;
    
    const extendedEvents: Array<{ event: Event; arrayIndex: number; eventIndex: number }> = [];
    
    for (let setIndex = 0; setIndex < 3; setIndex++) {
      events.forEach((event, eventIndex) => {
        const arrayIndex = setIndex * events.length + eventIndex;
        extendedEvents.push({ event, arrayIndex, eventIndex });
      });
    }
    
    return extendedEvents.map(({ event, arrayIndex, eventIndex }) => (
      <EventCard
        key={`${event.id}-${arrayIndex}`}
        event={event}
        position="center"
        index={arrayIndex}
        totalCards={events.length}
        translateX={translateX}
        velocity={velocity}
        onPress={() => handleCardPress(eventIndex)}
        currentUserId={currentUserId}
      />
    ));
  };

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard} />
      </View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={styles.container}>
        <View style={styles.cardsContainer}>
          {renderCards()}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCard: {
    width: SCREEN_WIDTH * 0.85,
    height: 200,
    backgroundColor: 'rgba(100,100,120,0.08)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
});
