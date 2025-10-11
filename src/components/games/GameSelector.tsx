import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Users, Clock, Trophy, Star } from 'lucide-react';
import type { Game, GameCategory } from '@/lib/games';

interface GameSelectorProps {
  onGameSelect: (game: Game) => void;
  eventType?: string;
  participantCount?: number;
}

const gameTemplates: Game[] = [
  {
    id: 'trivia-general',
    name: 'General Knowledge Trivia',
    description: 'Test your knowledge with fun trivia questions across various topics',
    category: 'trivia' as GameCategory,
    difficulty: 'medium',
    energy: 'medium',
    duration: 15,
    minPlayers: 2,
    maxPlayers: null,
    instructions: 'Answer questions as quickly and accurately as possible. Points are awarded for correct answers and speed.',
    materials: [],
    tags: ['knowledge', 'competitive', 'fun'],
    icon: '🧠',
    color: 'bg-blue-500'
  },
  {
    id: 'icebreaker-getting-to-know',
    name: 'Getting to Know You',
    description: 'Fun questions to help everyone learn about each other',
    category: 'icebreaker' as GameCategory,
    difficulty: 'easy',
    energy: 'low',
    duration: 10,
    minPlayers: 3,
    maxPlayers: 20,
    instructions: 'Take turns answering interesting questions about yourself. No right or wrong answers!',
    materials: [],
    tags: ['social', 'personal', 'networking'],
    icon: '🤝',
    color: 'bg-green-500'
  },
  {
    id: 'bingo-party',
    name: 'Party Bingo',
    description: 'Complete squares by finding people who match the descriptions',
    category: 'social' as GameCategory,
    difficulty: 'easy',
    energy: 'medium',
    duration: 20,
    minPlayers: 5,
    maxPlayers: null,
    instructions: 'Find people who match the squares on your bingo card. First to get a line wins!',
    materials: [],
    tags: ['social', 'networking', 'active'],
    icon: '🎯',
    color: 'bg-purple-500'
  },
  {
    id: 'would-you-rather',
    name: 'Would You Rather',
    description: 'Choose between interesting and sometimes silly options',
    category: 'icebreaker' as GameCategory,
    difficulty: 'easy',
    energy: 'low',
    duration: 15,
    minPlayers: 3,
    maxPlayers: null,
    instructions: 'Vote on which option you prefer and see how others voted. Discuss your choices!',
    materials: [],
    tags: ['choices', 'discussion', 'fun'],
    icon: '🤔',
    color: 'bg-orange-500'
  },
  {
    id: 'team-building-challenges',
    name: 'Team Building Challenges',
    description: 'Quick challenges that require teamwork and communication',
    category: 'professional' as GameCategory,
    difficulty: 'medium',
    energy: 'high',
    duration: 25,
    minPlayers: 4,
    maxPlayers: 16,
    instructions: 'Work together in small teams to complete fun challenges. Communication is key!',
    materials: ['Timer', 'Optional props'],
    tags: ['teamwork', 'communication', 'problem-solving'],
    icon: '🏆',
    color: 'bg-red-500'
  },
  {
    id: 'photo-scavenger-hunt',
    name: 'Photo Scavenger Hunt',
    description: 'Find and photograph items or complete tasks around the venue',
    category: 'creative' as GameCategory,
    difficulty: 'easy',
    energy: 'high',
    duration: 30,
    minPlayers: 2,
    maxPlayers: null,
    instructions: 'Complete the photo challenges by taking creative pictures. Most creative photos win!',
    materials: ['Camera/phone'],
    tags: ['creative', 'photography', 'exploration'],
    icon: '📸',
    color: 'bg-pink-500'
  }
];

const categoryColors = {
  icebreaker: 'bg-green-100 text-green-800',
  trivia: 'bg-blue-100 text-blue-800',
  creative: 'bg-pink-100 text-pink-800',
  physical: 'bg-yellow-100 text-yellow-800',
  social: 'bg-purple-100 text-purple-800',
  professional: 'bg-gray-100 text-gray-800'
};

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

const energyColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export function GameSelector({ onGameSelect, eventType, participantCount = 0 }: GameSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all'>('all');
  const [filteredGames, setFilteredGames] = useState(gameTemplates);

  useEffect(() => {
    let filtered = gameTemplates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(game => game.category === selectedCategory);
    }

    // Filter by participant count
    if (participantCount > 0) {
      filtered = filtered.filter(game => 
        game.minPlayers <= participantCount && 
        (game.maxPlayers === null || game.maxPlayers >= participantCount)
      );
    }

    setFilteredGames(filtered);
  }, [selectedCategory, participantCount]);

  const categories: Array<{ key: GameCategory | 'all', label: string, icon: string }> = [
    { key: 'all', label: 'All Games', icon: '🎮' },
    { key: 'icebreaker', label: 'Icebreakers', icon: '🤝' },
    { key: 'trivia', label: 'Trivia', icon: '🧠' },
    { key: 'social', label: 'Social', icon: '👥' },
    { key: 'creative', label: 'Creative', icon: '🎨' },
    { key: 'professional', label: 'Professional', icon: '💼' },
    { key: 'physical', label: 'Physical', icon: '🏃' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Game</h2>
        <p className="text-gray-600">
          Pick the perfect game for your event
          {participantCount > 0 && ` (${participantCount} participants)`}
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => (
          <Button
            key={category.key}
            variant={selectedCategory === category.key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.key)}
            className="text-sm"
          >
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </Button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGames.map(game => (
          <Card key={game.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer group">
            <div onClick={() => onGameSelect(game)}>
              {/* Game Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full ${game.color} flex items-center justify-center text-white text-lg`}>
                    {game.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {game.name}
                    </h3>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGameSelect(game);
                  }}
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {game.description}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1 mb-4">
                <Badge variant="secondary" className={categoryColors[game.category]}>
                  {game.category}
                </Badge>
                <Badge variant="secondary" className={difficultyColors[game.difficulty]}>
                  {game.difficulty}
                </Badge>
                <Badge variant="secondary" className={energyColors[game.energy]}>
                  {game.energy} energy
                </Badge>
              </div>

              {/* Game Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{game.duration}min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>
                      {game.minPlayers}
                      {game.maxPlayers ? `-${game.maxPlayers}` : '+'}
                    </span>
                  </div>
                </div>
                
                {/* Rating placeholder */}
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>4.{Math.floor(Math.random() * 9) + 1}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎮</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No games found</h3>
          <p className="text-gray-600">
            Try selecting a different category or adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
}