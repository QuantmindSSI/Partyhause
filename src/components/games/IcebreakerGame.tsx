import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  ArrowRight, 
  Heart,
  Lightbulb,
  Coffee,
  Shuffle,
  Volume2
} from 'lucide-react';
import type { IcebreakerQuestion, GameSession } from '@/lib/games';
import { cn } from '@/lib/utils';

interface IcebreakerGameProps {
  session: GameSession;
  onQuestionComplete: (questionId: string, responses: string[]) => void;
  onGameComplete: () => void;
  isHost: boolean;
  participantId: string;
}

// Sample icebreaker questions
const sampleQuestions: IcebreakerQuestion[] = [
  {
    id: '1',
    question: 'If you could have dinner with anyone, living or dead, who would it be and why?',
    category: 'Dreams & Aspirations',
    followUp: ['What would you ask them?', 'Where would you have this dinner?'],
    tags: ['personal', 'aspirational', 'conversation-starter']
  },
  {
    id: '2',
    question: 'What\'s the most interesting place you\'ve ever been to?',
    category: 'Travel & Adventure',
    followUp: ['What made it so special?', 'Would you go back?', 'Who did you go with?'],
    tags: ['travel', 'experiences', 'storytelling']
  },
  {
    id: '3',
    question: 'If you could learn any skill instantly, what would it be?',
    category: 'Learning & Growth',
    followUp: ['How would you use this skill?', 'Why this skill specifically?'],
    tags: ['skills', 'learning', 'goals']
  },
  {
    id: '4',
    question: 'What\'s your favorite way to spend a weekend?',
    category: 'Lifestyle & Hobbies',
    followUp: ['Do you prefer indoor or outdoor activities?', 'Alone time or with others?'],
    tags: ['lifestyle', 'hobbies', 'preferences']
  },
  {
    id: '5',
    question: 'If you could give your younger self one piece of advice, what would it be?',
    category: 'Wisdom & Reflection',
    followUp: ['At what age would you give this advice?', 'What inspired this wisdom?'],
    tags: ['wisdom', 'reflection', 'advice']
  },
  {
    id: '6',
    question: 'What\'s something you\'re passionate about that most people don\'t know?',
    category: 'Hidden Passions',
    followUp: ['How did you discover this passion?', 'Do you practice it regularly?'],
    tags: ['passion', 'hobbies', 'personal']
  },
  {
    id: '7',
    question: 'If you could change one thing about the world, what would it be?',
    category: 'Values & Beliefs',
    followUp: ['How would you implement this change?', 'What inspired this choice?'],
    tags: ['values', 'world-view', 'change']
  }
];

const categoryColors = {
  'Dreams & Aspirations': 'bg-purple-100 text-purple-800',
  'Travel & Adventure': 'bg-blue-100 text-blue-800',
  'Learning & Growth': 'bg-green-100 text-green-800',
  'Lifestyle & Hobbies': 'bg-orange-100 text-orange-800',
  'Wisdom & Reflection': 'bg-indigo-100 text-indigo-800',
  'Hidden Passions': 'bg-pink-100 text-pink-800',
  'Values & Beliefs': 'bg-red-100 text-red-800'
};

const categoryIcons = {
  'Dreams & Aspirations': '✨',
  'Travel & Adventure': '🌍',
  'Learning & Growth': '📚',
  'Lifestyle & Hobbies': '🎨',
  'Wisdom & Reflection': '🧠',
  'Hidden Passions': '💝',
  'Values & Beliefs': '💭'
};

export function IcebreakerGame({ 
  session, 
  onQuestionComplete, 
  onGameComplete, 
  isHost, 
  participantId 
}: IcebreakerGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds for sharing/discussion
  const [gamePhase, setGamePhase] = useState<'intro' | 'sharing' | 'discussion' | 'complete'>('intro');
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const totalQuestions = sampleQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect for sharing phase
  useEffect(() => {
    if (gamePhase !== 'sharing' || session.status === 'paused') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGamePhase('discussion');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, session.status]);

  // Reset when question changes
  useEffect(() => {
    setTimeLeft(90);
    setGamePhase('intro');
    setCurrentSpeaker(0);
    setResponses([]);
    setShowFollowUp(false);
  }, [currentQuestionIndex]);

  const handleStartSharing = () => {
    setGamePhase('sharing');
  };

  const handleNextQuestion = () => {
    onQuestionComplete(currentQuestion.id, responses);
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setGamePhase('complete');
      onGameComplete();
    }
  };

  const handleSkipQuestion = () => {
    handleNextQuestion();
  };

  const toggleFollowUp = () => {
    setShowFollowUp(!showFollowUp);
  };

  const renderIntro = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">{categoryIcons[currentQuestion.category as keyof typeof categoryIcons]}</div>
      
      <div className="space-y-3">
        <Badge variant="secondary" className={categoryColors[currentQuestion.category as keyof typeof categoryColors]}>
          {currentQuestion.category}
        </Badge>
        <h2 className="text-2xl font-bold text-gray-900">Get Ready!</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Everyone will have a chance to share their thoughts on the next question.
        </p>
      </div>

      <Card className="p-6 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {currentQuestion.question}
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>~90 seconds to share</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{session.participants.length} participants</span>
            </div>
          </div>

          <Button onClick={handleStartSharing} size="lg" className="w-full">
            <Volume2 className="w-4 h-4 mr-2" />
            Start Sharing Round
          </Button>
        </div>
      </Card>

      <p className="text-sm text-gray-500">
        Take a moment to think about your answer before we begin!
      </p>
    </div>
  );

  const renderSharing = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Badge variant="secondary" className={categoryColors[currentQuestion.category as keyof typeof categoryColors]}>
          {currentQuestion.category}
        </Badge>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Sharing Time</h2>
      </div>

      {/* Timer */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">Time for sharing</span>
          </div>
          <div className={cn(
            "text-xl font-bold",
            timeLeft <= 30 ? "text-red-500" : timeLeft <= 60 ? "text-yellow-500" : "text-green-500"
          )}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <Progress 
          value={(timeLeft / 90) * 100} 
          className="h-2"
        />
      </Card>

      {/* Question */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 text-center">
            {currentQuestion.question}
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900">Sharing Guidelines</div>
                <ul className="text-blue-800 mt-1 space-y-1">
                  <li>• Everyone gets a chance to share</li>
                  <li>• Keep responses brief and authentic</li>
                  <li>• Listen actively to others</li>
                  <li>• Ask follow-up questions if time allows</li>
                </ul>
              </div>
            </div>
          </div>

          {currentQuestion.followUp && (
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={toggleFollowUp}
                className="w-full"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {showFollowUp ? 'Hide' : 'Show'} Follow-up Questions
              </Button>
              
              {showFollowUp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm">
                    <div className="font-medium text-yellow-900 mb-2">Follow-up Questions:</div>
                    <ul className="text-yellow-800 space-y-1">
                      {currentQuestion.followUp.map((followUp, index) => (
                        <li key={index}>• {followUp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Controls */}
      <div className="flex justify-center space-x-3">
        <Button 
          variant="outline" 
          onClick={() => setGamePhase('discussion')}
        >
          <Coffee className="w-4 h-4 mr-2" />
          Move to Discussion
        </Button>
        {isHost && (
          <Button variant="outline" onClick={handleSkipQuestion}>
            <Shuffle className="w-4 h-4 mr-2" />
            Skip Question
          </Button>
        )}
      </div>
    </div>
  );

  const renderDiscussion = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Badge variant="secondary" className={categoryColors[currentQuestion.category as keyof typeof categoryColors]}>
          {currentQuestion.category}
        </Badge>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Discussion Time</h2>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Great sharing, everyone!
            </h3>
            <p className="text-gray-600">
              Take a few minutes to discuss interesting responses or ask follow-up questions.
            </p>
          </div>

          {currentQuestion.followUp && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-2">Discussion Starters:</div>
                <ul className="text-blue-800 space-y-1">
                  {currentQuestion.followUp.map((followUp, index) => (
                    <li key={index}>• {followUp}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Heart className="w-4 h-4" />
            <span>Building connections through conversation</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-center space-x-3">
        <Button onClick={handleNextQuestion} size="lg">
          {currentQuestionIndex < totalQuestions - 1 ? (
            <>
              Next Question
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Wrap Up
              <Heart className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold text-gray-900">Great Conversations!</h2>
      
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            You've completed all the icebreaker questions!
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm">
              <div className="font-medium text-green-900 mb-2">Session Summary:</div>
              <ul className="text-green-800 space-y-1">
                <li>• {totalQuestions} questions explored</li>
                <li>• {session.participants.length} participants engaged</li>
                <li>• Meaningful connections made</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-600">
            We hope everyone learned something new about each other and made some great connections!
          </p>
        </div>
      </Card>

      {isHost && (
        <Button onClick={() => window.location.reload()} size="lg">
          <Shuffle className="w-4 h-4 mr-2" />
          Start New Session
        </Button>
      )}
    </div>
  );

  // Progress bar
  const progressComponent = gamePhase !== 'intro' && gamePhase !== 'complete' && (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with progress */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Icebreaker Questions</h1>
          </div>
          <p className="text-gray-600">Getting to know each other better</p>
        </div>
        {progressComponent}
      </div>

      {/* Game Content */}
      {gamePhase === 'intro' && renderIntro()}
      {gamePhase === 'sharing' && renderSharing()}
      {gamePhase === 'discussion' && renderDiscussion()}
      {gamePhase === 'complete' && renderComplete()}
    </div>
  );
}