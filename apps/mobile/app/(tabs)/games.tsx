import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Types mirrored (simplified) from web src/lib/games.ts
export type GameCategory = 'icebreaker' | 'trivia' | 'creative' | 'physical' | 'social' | 'professional';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GameEnergy = 'low' | 'medium' | 'high';

interface GameTemplate {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  difficulty: GameDifficulty;
  energy: GameEnergy;
  duration: number;
  minPlayers: number;
  maxPlayers: number | null;
  instructions: string;
  materials?: string[];
  tags: string[];
  icon: string; // emoji for now
  color: string; // tailwind-like token converted to RN color usage
}

// Reuse subset of web game templates for mobile MVP demo
const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'trivia-general',
    name: 'General Trivia',
    description: 'Fast-paced knowledge questions',
    category: 'trivia',
    difficulty: 'medium',
    energy: 'medium',
    duration: 10,
    minPlayers: 2,
    maxPlayers: null,
    instructions: 'Answer each question before time runs out. Points for speed + correctness.',
    tags: ['knowledge','competitive'],
    icon: '🧠',
    color: '#3B82F6'
  },
  {
    id: 'icebreaker-getting-to-know',
    name: 'Getting to Know You',
    description: 'Share & discover fun personal insights',
    category: 'icebreaker',
    difficulty: 'easy',
    energy: 'low',
    duration: 8,
    minPlayers: 3,
    maxPlayers: 20,
    instructions: 'Each participant answers the prompt. Discuss interesting answers briefly.',
    tags: ['social','conversation'],
    icon: '🤝',
    color: '#10B981'
  },
  {
    id: 'would-you-rather',
    name: 'Would You Rather',
    description: 'Vote between two quirky choices',
    category: 'icebreaker',
    difficulty: 'easy',
    energy: 'low',
    duration: 6,
    minPlayers: 3,
    maxPlayers: null,
    instructions: 'Pick one of the two options. Reveal group results & discuss.',
    tags: ['choices','fun'],
    icon: '🤔',
    color: '#F59E0B'
  }
];

// Sample trivia data (subset) for mobile
const TRIVIA_QUESTIONS = [
  { id: 'q1', question: 'Capital of France?', options: ['Berlin','Paris','Madrid','Rome'], correctAnswer: 1, points: 10 },
  { id: 'q2', question: 'Largest planet?', options: ['Earth','Saturn','Jupiter','Mars'], correctAnswer: 2, points: 10 },
  { id: 'q3', question: 'H2O is?', options: ['Oxygen','Salt','Water','Hydrogen'], correctAnswer: 2, points: 5 }
];

export default function GamesScreen() {
  const [phase, setPhase] = useState<'library' | 'setup' | 'playing' | 'results'>('library');
  const [selectedGame, setSelectedGame] = useState<GameTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Simulated participants for demo video
  const participants = ['You','Alice','Bob','Carol'];

  // Handlers
  const handleSelectGame = (game: GameTemplate) => {
    Haptics.selectionAsync();
    setSelectedGame(game);
    setPhase('setup');
  };

  const handleStartGame = () => {
    if (!selectedGame) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('playing');
    setCurrentTriviaIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  const currentTrivia = selectedGame?.id === 'trivia-general' ? TRIVIA_QUESTIONS[currentTriviaIndex] : null;

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowAnswer(true);
    if (currentTrivia && index === currentTrivia.correctAnswer) {
      setScore(s => s + currentTrivia.points);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setTimeout(() => {
      // Advance or finish
      if (currentTriviaIndex < TRIVIA_QUESTIONS.length - 1) {
        setCurrentTriviaIndex(i => i + 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
      } else {
        setPhase('results');
      }
    }, 1200);
  };

  const resetToLibrary = () => {
    setPhase('library');
    setSelectedGame(null);
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  // UI sections
  const renderLibrary = () => (
    <ScrollView contentContainerStyle={styles.libraryContainer}>
      <Text style={styles.heading}>Party Games</Text>
      <Text style={styles.subheading}>Pick a quick interactive activity for your event</Text>

      <View style={styles.categoryRow}>
        {['all','icebreaker','trivia','social'].map(cat => (
          <View key={cat} style={styles.categoryChip}><Text style={styles.categoryChipText}>{cat}</Text></View>
        ))}
      </View>

      <View style={styles.gamesGrid}>
        {GAME_TEMPLATES.map(game => (
          <TouchableOpacity key={game.id} style={styles.gameCard} onPress={() => handleSelectGame(game)}>
            <View style={[styles.gameIconWrapper,{ backgroundColor: game.color + '22'}]}>
              <Text style={styles.gameIcon}>{game.icon}</Text>
            </View>
            <Text style={styles.gameName}>{game.name}</Text>
            <Text style={styles.gameDesc}>{game.description}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>{game.category}</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>{game.difficulty}</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>{game.energy}</Text></View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderSetup = () => selectedGame && (
    <ScrollView contentContainerStyle={styles.setupContainer}>
      <TouchableOpacity style={styles.backRow} onPress={resetToLibrary}>
        <Ionicons name="arrow-back" size={20} color="#374151" />
        <Text style={styles.backText}>Library</Text>
      </TouchableOpacity>
      <View style={[styles.largeIconCircle,{backgroundColor: selectedGame.color}]}> 
        <Text style={styles.largeIcon}>{selectedGame.icon}</Text>
      </View>
      <Text style={styles.gameTitle}>{selectedGame.name}</Text>
      <Text style={styles.gameLongDesc}>{selectedGame.description}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}><Ionicons name="time" size={16} color="#6B7280" /><Text style={styles.metaItemText}>{selectedGame.duration} min</Text></View>
        <View style={styles.metaItem}><Ionicons name="people" size={16} color="#6B7280" /><Text style={styles.metaItemText}>{selectedGame.minPlayers}{selectedGame.maxPlayers?'–'+selectedGame.maxPlayers:'+'} players</Text></View>
        <View style={styles.metaItem}><Ionicons name="flash" size={16} color="#6B7280" /><Text style={styles.metaItemText}>{selectedGame.energy}</Text></View>
      </View>

      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsHeading}>How to Play</Text>
        <Text style={styles.instructionsText}>{selectedGame.instructions}</Text>
        {selectedGame.materials?.length ? (
          <View style={{marginTop:12}}>
            <Text style={styles.instructionsMaterialsLabel}>Materials:</Text>
            {selectedGame.materials.map(m => <Text key={m} style={styles.instructionsMaterialBullet}>• {m}</Text>)}
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
        <Ionicons name="play" size={20} color="#FFF" />
        <Text style={styles.startButtonText}>Start Game</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTriviaPlay = () => currentTrivia && (
    <ScrollView contentContainerStyle={styles.playContainer}>
      <View style={styles.scoreRow}><Text style={styles.scoreLabel}>Score:</Text><Text style={styles.scoreValue}>{score}</Text></View>
      <Text style={styles.questionText}>{currentTrivia.question}</Text>
      {currentTrivia.options.map((opt, idx) => {
        const isCorrect = showAnswer && idx === currentTrivia.correctAnswer;
        const isSelected = selectedAnswer === idx;
        return (
          <TouchableOpacity key={idx} disabled={showAnswer} onPress={() => handleAnswer(idx)} style={[styles.answerOption,
            isCorrect && styles.answerCorrect,
            isSelected && !isCorrect && styles.answerSelected,
          ]}>
            <Text style={[styles.answerText, isCorrect && {color:'#065F46'}, isSelected && !isCorrect && {color:'#7F1D1D'}]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
      <View style={styles.progressHint}><Text style={styles.progressHintText}>Question {currentTriviaIndex+1} / {TRIVIA_QUESTIONS.length}</Text></View>
    </ScrollView>
  );

  const renderIcebreakerPlay = () => (
    <ScrollView contentContainerStyle={styles.playContainer}>
      <Text style={styles.questionText}>Share something about: "A place you'd love to visit again"</Text>
      <Text style={styles.helperText}>Each participant speaks ~30s. Tap results when done.</Text>
      <TouchableOpacity style={styles.endRoundButton} onPress={() => setPhase('results')}>
        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
        <Text style={styles.endRoundText}>Finish Round</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderResults = () => (
    <ScrollView contentContainerStyle={styles.resultsContainer}>
      <Text style={styles.heading}>Session Complete 🎉</Text>
      {selectedGame?.id === 'trivia-general' && (
        <View style={styles.resultsCard}> 
          <Text style={styles.resultMetricLabel}>Final Score</Text>
          <Text style={styles.resultMetricValue}>{score} pts</Text>
        </View>
      )}
      <View style={styles.resultsActionsRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleStartGame}>
          <Ionicons name="refresh" size={18} color="#1F2937" />
          <Text style={styles.secondaryButtonText}>Replay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={resetToLibrary}>
          <Ionicons name="arrow-back" size={18} color="#FFF" />
          <Text style={styles.primaryButtonText}>Back to Library</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#F59E0B" /></View>
      )}
      {phase === 'library' && renderLibrary()}
      {phase === 'setup' && renderSetup()}
      {phase === 'playing' && selectedGame?.id === 'trivia-general' && renderTriviaPlay()}
      {phase === 'playing' && selectedGame?.id === 'icebreaker-getting-to-know' && renderIcebreakerPlay()}
      {phase === 'playing' && selectedGame && !['trivia-general','icebreaker-getting-to-know'].includes(selectedGame.id) && (
        <View style={styles.placeholder}><Text style={styles.placeholderText}>Game coming soon</Text></View>
      )}
      {phase === 'results' && renderResults()}
    </View>
  );
}

// Styles (brand aligned - neutral surfaces + burnt orange accent)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  heading: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 4, textAlign: 'center' },
  subheading: { fontSize: 14, color: '#64748B', marginBottom: 16, textAlign: 'center' },
  libraryContainer: { padding: 20 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  categoryChipText: { fontSize: 12, fontWeight: '500', color: '#475569' },
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gameCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  gameIconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gameIcon: { fontSize: 24 },
  gameName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  gameDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  badge: { backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#475569' },
  setupContainer: { padding: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: '500', color: '#374151', marginLeft: 6 },
  largeIconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 8 },
  largeIcon: { fontSize: 40 },
  gameTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginTop: 16 },
  gameLongDesc: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItemText: { fontSize: 12, fontWeight: '500', color: '#475569' },
  instructionsBox: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 8 },
  instructionsHeading: { fontSize: 16, fontWeight: '600', color: '#92400E', marginBottom: 6 },
  instructionsText: { fontSize: 13, color: '#78350F', lineHeight: 18 },
  instructionsMaterialsLabel: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  instructionsMaterialBullet: { fontSize: 12, color: '#78350F' },
  startButton: { flexDirection: 'row', gap: 8, backgroundColor: '#D97706', paddingVertical: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  startButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  playContainer: { padding: 20 },
  scoreRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12, alignItems: 'center', gap: 8 },
  scoreLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
  scoreValue: { fontSize: 22, fontWeight: '700', color: '#D97706' },
  questionText: { fontSize: 18, fontWeight: '600', color: '#0F172A', marginBottom: 16 },
  answerOption: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, marginBottom: 10 },
  answerText: { fontSize: 14, fontWeight: '500', color: '#334155' },
  answerCorrect: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  answerSelected: { borderColor: '#EF4444', backgroundColor: '#FEE2E2' },
  progressHint: { alignItems: 'center', marginTop: 8 },
  progressHintText: { fontSize: 12, color: '#475569' },
  helperText: { fontSize: 14, color: '#475569', marginBottom: 24 },
  endRoundButton: { flexDirection: 'row', gap: 8, backgroundColor: '#D97706', paddingVertical: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  endRoundText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  resultsContainer: { padding: 20 },
  resultsCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 20, marginTop: 16, alignItems: 'center' },
  resultMetricLabel: { fontSize: 14, fontWeight: '500', color: '#475569' },
  resultMetricValue: { fontSize: 28, fontWeight: '700', color: '#D97706', marginTop: 4 },
  resultsActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  secondaryButton: { flexDirection: 'row', gap: 6, backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  primaryButton: { flexDirection: 'row', gap: 6, backgroundColor: '#D97706', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 16, fontWeight: '500', color: '#64748B' },
  loadingOverlay: { position: 'absolute', top:0, left:0, right:0, bottom:0, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center', zIndex: 20 }
});
