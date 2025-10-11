import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameSelector } from './GameSelector';
import { TriviaGame } from './TriviaGame';
import { IcebreakerGame } from './IcebreakerGame';
import { 
  Play, 
  Pause, 
  Users, 
  Trophy, 
  ArrowLeft,
  Settings,
  Share2
} from 'lucide-react';
import type { Game, GameSession } from '@/lib/games';
import { cn } from '@/lib/utils';

interface GameManagerProps {
  eventId: string;
  hostId: string;
  participantId: string;
  participants: Array<{ id: string; name: string; email: string }>;
  isHost: boolean;
  onGameEnd: () => void;
}

export function GameManager({ 
  eventId, 
  hostId, 
  participantId, 
  participants, 
  isHost,
  onGameEnd 
}: GameManagerProps) {
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gamePhase, setGamePhase] = useState<'select' | 'setup' | 'playing' | 'results'>('select');
  const [sessionData, setSessionData] = useState<Record<string, any>>({});

  // Create a new game session
  const createGameSession = (game: Game, settings: Record<string, any> = {}) => {
    const session: GameSession = {
      id: crypto.randomUUID(),
      eventId,
      gameId: game.id,
      hostId,
      status: 'not_started',
      participants: participants.map(p => p.id),
      scores: {},
      settings,
      data: {}
    };
    
    setCurrentSession(session);
    setGamePhase('setup');
  };

  const startGame = () => {
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      status: 'in_progress' as const,
      startedAt: new Date()
    };
    
    setCurrentSession(updatedSession);
    setGamePhase('playing');
  };

  const pauseGame = () => {
    if (!currentSession) return;
    
    setCurrentSession({
      ...currentSession,
      status: 'paused'
    });
  };

  const resumeGame = () => {
    if (!currentSession) return;
    
    setCurrentSession({
      ...currentSession,
      status: 'in_progress'
    });
  };

  const endGame = (finalScores?: Record<string, number>) => {
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      status: 'completed' as const,
      completedAt: new Date(),
      scores: finalScores || currentSession.scores
    };
    
    setCurrentSession(updatedSession);
    setGamePhase('results');
  };

  const resetGame = () => {
    setCurrentSession(null);
    setSelectedGame(null);
    setGamePhase('select');
    setSessionData({});
  };

  // Handle game-specific events
  const handleTriviaAnswer = (questionId: string, answerIndex: number, timeToAnswer: number) => {
    if (!currentSession) return;
    
    // In a real app, this would be sent to the server and broadcast to all participants
    console.log('Trivia answer:', { questionId, answerIndex, timeToAnswer, participantId });
  };

  const handleTriviaComplete = (finalScores: Record<string, number>) => {
    endGame(finalScores);
  };

  const handleIcebreakerQuestionComplete = (questionId: string, responses: string[]) => {
    if (!currentSession) return;
    
    // Store responses for this question
    setSessionData(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: responses
      }
    }));
  };

  const handleIcebreakerComplete = () => {
    endGame();
  };

  // Render game setup screen
  const renderGameSetup = () => {
    if (!selectedGame || !currentSession) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setGamePhase('select')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">Game Setup</span>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Game Info */}
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full ${selectedGame.color} flex items-center justify-center text-white text-3xl mx-auto`}>
                {selectedGame.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedGame.name}</h2>
                <p className="text-gray-600 mt-1">{selectedGame.description}</p>
              </div>
              <div className="flex justify-center space-x-2">
                <Badge variant="secondary">{selectedGame.category}</Badge>
                <Badge variant="secondary">{selectedGame.difficulty}</Badge>
                <Badge variant="secondary">{selectedGame.energy} energy</Badge>
              </div>
            </div>

            {/* Game Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Users className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Participants</div>
                <div className="font-semibold">{participants.length}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Trophy className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Duration</div>
                <div className="font-semibold">{selectedGame.duration} min</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Play className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Difficulty</div>
                <div className="font-semibold capitalize">{selectedGame.difficulty}</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">How to Play</h3>
              <p className="text-blue-800 text-sm">{selectedGame.instructions}</p>
              {selectedGame.materials && selectedGame.materials.length > 0 && (
                <div className="mt-3">
                  <div className="font-medium text-blue-900 text-sm">Materials needed:</div>
                  <ul className="text-blue-800 text-sm mt-1">
                    {selectedGame.materials.map((material, index) => (
                      <li key={index}>• {material}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Participants List */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Participants ({participants.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {participants.map(participant => (
                  <div 
                    key={participant.id} 
                    className={cn(
                      "p-2 rounded-lg border text-sm",
                      participant.id === hostId 
                        ? "bg-blue-50 border-blue-200 text-blue-800" 
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    )}
                  >
                    <div className="font-medium">{participant.name}</div>
                    {participant.id === hostId && (
                      <div className="text-xs text-blue-600">Host</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Start Game */}
            {isHost && (
              <div className="text-center">
                <Button onClick={startGame} size="lg" className="w-full md:w-auto">
                  <Play className="w-5 h-5 mr-2" />
                  Start Game
                </Button>
              </div>
            )}

            {!isHost && (
              <div className="text-center">
                <div className="text-gray-600 text-sm">
                  Waiting for the host to start the game...
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  // Render active game
  const renderActiveGame = () => {
    if (!selectedGame || !currentSession) return null;

    switch (selectedGame.id) {
      case 'trivia-general':
        return (
          <TriviaGame
            session={currentSession}
            onAnswer={handleTriviaAnswer}
            onGameComplete={handleTriviaComplete}
            onPause={pauseGame}
            onResume={resumeGame}
            isHost={isHost}
            participantId={participantId}
          />
        );
      
      case 'icebreaker-getting-to-know':
        return (
          <IcebreakerGame
            session={currentSession}
            onQuestionComplete={handleIcebreakerQuestionComplete}
            onGameComplete={handleIcebreakerComplete}
            isHost={isHost}
            participantId={participantId}
          />
        );
      
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Game Coming Soon</h3>
            <p className="text-gray-600">
              This game is still being developed. Try another game for now!
            </p>
            <Button onClick={resetGame} className="mt-4">
              Choose Different Game
            </Button>
          </div>
        );
    }
  };

  // Render game results
  const renderGameResults = () => {
    if (!selectedGame || !currentSession) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900">Game Complete!</h2>
          <p className="text-gray-600 mt-2">
            Great job everyone! Here's how the game went:
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{selectedGame.name}</h3>
              <Badge variant="secondary">{selectedGame.category}</Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{participants.length}</div>
                <div className="text-sm text-gray-600">Participants</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round((Date.now() - (currentSession.startedAt?.getTime() || Date.now())) / 60000)}
                </div>
                <div className="text-sm text-gray-600">Minutes Played</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(currentSession.scores || {}).length}
                </div>
                <div className="text-sm text-gray-600">Players Scored</div>
              </div>
            </div>

            {/* Show scores if available */}
            {currentSession.scores && Object.keys(currentSession.scores).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Final Scores</h4>
                <div className="space-y-2">
                  {Object.entries(currentSession.scores)
                    .sort(([,a], [,b]) => b - a)
                    .map(([playerId, score], index) => {
                      const participant = participants.find(p => p.id === playerId);
                      return (
                        <div key={playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                              index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-600" : "bg-gray-300"
                            )}>
                              {index + 1}
                            </div>
                            <span className="font-medium">
                              {participant?.name || `Player ${playerId.slice(-4)}`}
                            </span>
                          </div>
                          <div className="font-bold text-lg">{score} pts</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-center space-x-3">
          <Button onClick={resetGame} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Play Another Game
          </Button>
          <Button onClick={onGameEnd}>
            <Share2 className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {gamePhase === 'select' && (
          <GameSelector 
            onGameSelect={(game) => {
              setSelectedGame(game);
              createGameSession(game);
            }}
            participantCount={participants.length}
          />
        )}
        
        {gamePhase === 'setup' && renderGameSetup()}
        {gamePhase === 'playing' && renderActiveGame()}
        {gamePhase === 'results' && renderGameResults()}
      </div>
    </div>
  );
}