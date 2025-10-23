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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
    const initialOffset = -events.length * CARD_SPACING;
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
      const currentPosition = translateX.value;
      
      const rawIndex = Math.round(-currentPosition / CARD_SPACING);
      let actualIndex = rawIndex % events.length;
      if (actualIndex < 0) actualIndex += events.length;
      
      const targetPosition = -rawIndex * CARD_SPACING;
      
      translateX.value = withSpring(
        targetPosition,
        {
          damping: 9,
          stiffness: 10,
          mass: 0.5,
          overshootClamping: false,
          velocity: gestureVelocity * 0.85,
        },
        (finished) => {
          if (finished) {
            const middleSetStart = -events.length * CARD_SPACING;
            const middleSetEnd = -2 * events.length * CARD_SPACING;
            
            let finalPosition = targetPosition;
            
            if (finalPosition > middleSetStart) {
              finalPosition -= events.length * CARD_SPACING;
            } else if (finalPosition < middleSetEnd) {
              finalPosition += events.length * CARD_SPACING;
            }
            
            translateX.value = finalPosition;
            offsetX.value = finalPosition;
            
            if (onIndexChange) {
              runOnJS(onIndexChange)(actualIndex);
            }
            
            runOnJS(setCurrentIndex)(actualIndex);
            velocity.value = withSpring(0, { damping: 8, stiffness: 10, mass: 0.5 });
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  cardsContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 40,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
});
