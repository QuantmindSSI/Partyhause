import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Check, PartyPopper } from 'lucide-react';
import { Poll, PollOption } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PollCardProps {
  poll: Poll;
  onVote?: (optionIds: string[]) => void;
  showResults?: boolean;
  compact?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  onVote,
  showResults = false,
  compact = false,
}) => {
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleOptionSelect = (optionId: string) => {
    if (poll.status !== 'active') return;

    if (poll.poll_type === 'single-choice') {
      setSelectedOptions([optionId]);
      onVote?.([optionId]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmitMultiple = () => {
    if (selectedOptions.length > 0) {
      onVote?.(selectedOptions);
      setSelectedOptions([]);
    }
  };

  const getOptionPercentage = (option: PollOption): number => {
    if (poll.total_votes === 0) return 0;
    return (option.votes / poll.total_votes) * 100;
  };

  const getConsensusLevel = (): { level: number; color: string } => {
    const topOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0];
    const percentage = getOptionPercentage(topOption);
    
    if (percentage >= 70) return { level: percentage, color: 'rgb(16, 185, 129)' }; // green
    if (percentage >= 50) return { level: percentage, color: 'rgb(245, 158, 11)' }; // amber
    return { level: percentage, color: 'rgb(239, 68, 68)' }; // red
  };

  const consensus = getConsensusLevel();
  const isActive = poll.status === 'active';
  const showConsensusBar = poll.auto_close_on_consensus;

  const handleCardPress = () => {
    navigate(`/events/${poll.event_id}/planning/polls/${poll.id}`);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (compact) {
    return (
      <Card
        className="p-3 cursor-pointer hover:shadow-md transition-shadow mb-2"
        onClick={handleCardPress}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </div>
          <span className="font-semibold text-sm text-gray-900 truncate flex-1">
            {poll.question}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {poll.total_voters} votes
          </span>
          {isActive && (
            <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-500">LIVE</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{poll.creator_name}</p>
            <p className="text-xs text-gray-500">{formatTime(poll.created_at)}</p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-500 tracking-wide">LIVE</span>
          </div>
        )}
      </div>

      {/* Question */}
      <h3 className="text-lg font-bold text-gray-900 mb-4 leading-6">
        {poll.question}
      </h3>

      {/* Consensus Bar */}
      {showConsensusBar && isActive && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">
              Consensus Progress
            </span>
            <span
              className="text-base font-bold"
              style={{ color: consensus.color }}
            >
              {Math.round(consensus.level)}%
            </span>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style={{
                width: `${consensus.level}%`,
                backgroundColor: consensus.color,
              }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-[-18px] transform -translate-x-1/2"
              style={{ left: `${poll.consensus_threshold}%` }}
            >
              <span className="text-xs font-semibold text-gray-600">
                {poll.consensus_threshold}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 mb-4">
        {poll.options.map((option) => {
          const percentage = getOptionPercentage(option);
          const isSelected = selectedOptions.includes(option.id);
          const isLeading = percentage === consensus.level;

          return (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              disabled={!isActive}
              className={cn(
                'relative w-full border-2 rounded-xl overflow-hidden transition-all',
                isSelected && 'border-violet-500 bg-violet-50',
                !isSelected && 'border-gray-200 hover:border-gray-300',
                !isActive && 'opacity-70 cursor-not-allowed'
              )}
            >
              {/* Progress background */}
              {showResults && (
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 transition-all duration-500',
                    isLeading ? 'bg-blue-100' : 'bg-gray-100'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1">
                  {/* Radio button */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected ? 'border-violet-500' : 'border-gray-300'
                    )}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900 text-left">
                    {option.text}
                  </span>
                </div>

                {/* Results */}
                {showResults && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">
                      {option.votes}
                    </span>
                    <span className="text-sm font-bold text-violet-600">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit button for multiple choice */}
      {poll.poll_type === 'multiple-choice' &&
        isActive &&
        selectedOptions.length > 0 && (
          <Button
            onClick={handleSubmitMultiple}
            className="w-full mb-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            <span>
              Submit {selectedOptions.length} vote{selectedOptions.length > 1 ? 's' : ''}
            </span>
            <Check className="ml-2 h-5 w-5" />
          </Button>
        )}

      {/* Footer */}
      <button
        onClick={handleCardPress}
        className="w-full flex items-center justify-between pt-4 border-t border-gray-100 hover:opacity-70 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">
            View Discussion
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">
            {poll.total_voters} voted
          </span>
        </div>
      </button>

      {/* Consensus Reached Banner */}
      {poll.status === 'consensus-reached' && (
        <div className="flex items-center justify-center gap-2 bg-green-100 p-3 rounded-xl mt-3">
          <PartyPopper className="h-5 w-5 text-green-600" />
          <span className="text-sm font-bold text-green-600">
            Consensus Reached! 🎉
          </span>
        </div>
      )}
    </Card>
  );
};
