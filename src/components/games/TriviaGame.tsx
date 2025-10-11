import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  Trophy,
  ArrowRight,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import type { TriviaQuestion, GameSession } from '@/lib/games';
import { cn } from '@/lib/utils';

interface TriviaGameProps {
  session: GameSession;
  onAnswer: (questionId: string, answerIndex: number, timeToAnswer: number) => void;
  onGameComplete: (finalScores: Record<string, number>) => void;
  onPause: () => void;
  onResume: () => void;
  isHost: boolean;
  participantId: string;
}

// Sample trivia questions - in real app, these would come from the database
const sampleQuestions: TriviaQuestion[] = [
  {
    id: '1',
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctAnswer: 2,
    category: 'Geography',
    difficulty: 'medium',
    explanation: 'Canberra is the capital city of Australia, located in the Australian Capital Territory.',
    points: 10
  },
  {
    id: '2',
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    category: 'Science',
    difficulty: 'easy',
    explanation: 'Mars is called the Red Planet due to iron oxide (rust) on its surface.',
    points: 5
  },
  {
    id: '3',
    question: 'Who painted the Mona Lisa?',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Van Gogh'],
    correctAnswer: 1,
    category: 'Art',
    difficulty: 'easy',
    explanation: 'Leonardo da Vinci painted the Mona Lisa between 1503 and 1519.',
    points: 5
  },
  {
    id: '4',
    question: 'What is the largest mammal in the world?',
    options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Polar Bear'],
    correctAnswer: 1,
    category: 'Nature',
    difficulty: 'easy',
    explanation: 'The Blue Whale is the largest animal ever known to have lived on Earth.',
    points: 5
  },
  {
    id: '5',
    question: 'In which year did World War II end?',
    options: ['1944', '1945', '1946', '1947'],
    correctAnswer: 1,
    category: 'History',
    difficulty: 'medium',
    explanation: 'World War II ended in 1945 with the surrender of Japan in September.',
    points: 10
  }
];

export function TriviaGame({ 
  session, 
  onAnswer, 
  onGameComplete, 
  onPause, 
  onResume,
  isHost, 
  participantId 
}: TriviaGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [gamePhase, setGamePhase] = useState<'question' | 'results' | 'complete'>('question');
  const [scores, setScores] = useState<Record<string, number>>(session.scores || {});
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const totalQuestions = sampleQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (gamePhase !== 'question' || session.status === 'paused') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          if (selectedAnswer === null) {
            handleAnswer(-1); // -1 indicates no answer
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, session.status, selectedAnswer]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(30);
    setQuestionStartTime(Date.now());
    setSelectedAnswer(null);
    setShowResults(false);
    setGamePhase('question');
  }, [currentQuestionIndex]);

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || gamePhase !== 'question') return;

    const timeToAnswer = Math.max(0, 30 - timeLeft);
    setSelectedAnswer(answerIndex);
    
    // Calculate score
    let points = 0;
    if (answerIndex === currentQuestion.correctAnswer) {
      // Base points plus time bonus
      points = currentQuestion.points! + Math.max(0, timeLeft);
    }

    // Update local scores
    const newScores = {
      ...scores,
      [participantId]: (scores[participantId] || 0) + points
    };
    setScores(newScores);

    // Store the answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerIndex
    }));

    // Notify parent
    onAnswer(currentQuestion.id, answerIndex, timeToAnswer);

    // Show results after a brief delay
    setTimeout(() => {
      setGamePhase('results');
      setShowResults(true);
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Game complete
      setGamePhase('complete');
      onGameComplete(scores);
    }
  };

  const getAnswerStyle = (optionIndex: number) => {
    if (!showResults) {
      return selectedAnswer === optionIndex 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 hover:border-gray-300';
    }

    if (optionIndex === currentQuestion.correctAnswer) {
      return 'border-green-500 bg-green-50 text-green-800';
    }
    
    if (selectedAnswer === optionIndex && optionIndex !== currentQuestion.correctAnswer) {
      return 'border-red-500 bg-red-50 text-red-800';
    }

    return 'border-gray-200 opacity-60';
  };

  const renderGameComplete = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🏆</div>
      <h2 className="text-3xl font-bold text-gray-900">Game Complete!</h2>
      
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Final Scores</h3>
        <div className="space-y-3">
          {Object.entries(scores)
            .sort(([,a], [,b]) => b - a)
            .map(([playerId, score], index) => (
              <div key={playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                    index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-600" : "bg-gray-300"
                  )}>
                    {index + 1}
                  </div>
                  <span className="font-medium">
                    {playerId === participantId ? 'You' : `Player ${playerId.slice(-4)}`}
                  </span>
                </div>
                <div className="font-bold text-lg">{score} pts</div>
              </div>
            ))}
        </div>
      </Card>

      <div className="space-y-2">
        <p className="text-gray-600">
          You answered {Object.values(answers).filter((answer, i) => answer === sampleQuestions[i]?.correctAnswer).length} out of {totalQuestions} questions correctly!
        </p>
        {isHost && (
          <Button onClick={() => window.location.reload()} className="mt-4">
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        )}
      </div>
    </div>
  );

  if (gamePhase === 'complete') {
    return renderGameComplete();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Trivia Challenge</h2>
          </div>
          <Badge variant="secondary">{currentQuestion.category}</Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Your Score</div>
            <div className="text-xl font-bold text-blue-600">{scores[participantId] || 0}</div>
          </div>
          {isHost && (
            <Button
              variant="outline"
              size="sm"
              onClick={session.status === 'paused' ? onResume : onPause}
            >
              {session.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Timer */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">Time Remaining</span>
          </div>
          <div className={cn(
            "text-2xl font-bold",
            timeLeft <= 10 ? "text-red-500" : timeLeft <= 20 ? "text-yellow-500" : "text-green-500"
          )}>
            {timeLeft}s
          </div>
        </div>
        <Progress 
          value={(timeLeft / 30) * 100} 
          className={cn(
            "h-2",
            timeLeft <= 10 ? "bg-red-100" : timeLeft <= 20 ? "bg-yellow-100" : "bg-green-100"
          )}
        />
      </Card>

      {/* Question */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentQuestion.question}
            </h3>
            <Badge variant="outline" className={cn(
              currentQuestion.difficulty === 'easy' ? 'border-green-500 text-green-700' :
              currentQuestion.difficulty === 'medium' ? 'border-yellow-500 text-yellow-700' :
              'border-red-500 text-red-700'
            )}>
              {currentQuestion.difficulty} • {currentQuestion.points} pts
            </Badge>
          </div>

          <div className="grid gap-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null || gamePhase !== 'question'}
                className={cn(
                  "p-4 text-left rounded-lg border-2 transition-all",
                  getAnswerStyle(index),
                  "disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {showResults && (
                    <div>
                      {index === currentQuestion.correctAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {showResults && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">Explanation</div>
                    <div className="text-blue-800 text-sm mt-1">
                      {currentQuestion.explanation}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={handleNextQuestion} size="lg">
                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      View Results
                      <Trophy className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Participants */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {session.participants.length} participant{session.participants.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Round {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
      </Card>
    </div>
  );
}