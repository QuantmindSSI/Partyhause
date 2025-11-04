import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreatePollData, PollType } from '../types';

interface CreatePollDialogProps {
  eventId: string;
  onCreatePoll: (pollData: CreatePollData) => Promise<void>;
  trigger?: React.ReactNode;
}

export const CreatePollDialog: React.FC<CreatePollDialogProps> = ({
  eventId,
  onCreatePoll,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [pollType, setPollType] = useState<PollType>('single-choice');
  const [options, setOptions] = useState(['', '']);
  const [autoClose, setAutoClose] = useState(false);
  const [consensusThreshold, setConsensusThreshold] = useState(70);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    const validOptions = options.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    setLoading(true);

    try {
      const pollData: CreatePollData = {
        question: question.trim(),
        poll_type: pollType,
        options: validOptions.map((text) => ({ text: text.trim() })),
        auto_close_on_consensus: autoClose,
        consensus_threshold: autoClose ? consensusThreshold : undefined,
      };

      await onCreatePoll(pollData);

      // Reset form
      setQuestion('');
      setPollType('single-choice');
      setOptions(['', '']);
      setAutoClose(false);
      setConsensusThreshold(70);
      setOpen(false);
    } catch (error) {
      console.error('Failed to create poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Poll</DialogTitle>
          <DialogDescription>
            Ask your guests to vote on event details. Get instant consensus!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Question *</Label>
            <Input
              id="question"
              placeholder="What should we do for music?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>

          {/* Poll Type */}
          <div className="space-y-2">
            <Label htmlFor="poll-type">Poll Type</Label>
            <Select value={pollType} onValueChange={(value) => setPollType(value as PollType)}>
              <SelectTrigger id="poll-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-choice">Single Choice</SelectItem>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="ranking">Ranking</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {pollType === 'single-choice' && 'Guests can vote for one option'}
              {pollType === 'multiple-choice' && 'Guests can vote for multiple options'}
              {pollType === 'ranking' && 'Guests can rank options in order'}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Options *</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required={index < 2}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>

          {/* Auto-close on Consensus */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-close">Auto-close on Consensus</Label>
                <p className="text-xs text-gray-500">
                  Automatically close poll when threshold is reached
                </p>
              </div>
              <Switch
                id="auto-close"
                checked={autoClose}
                onCheckedChange={setAutoClose}
              />
            </div>

            {autoClose && (
              <div className="space-y-2 pl-4 border-l-2 border-violet-200">
                <Label htmlFor="threshold">Consensus Threshold: {consensusThreshold}%</Label>
                <input
                  id="threshold"
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={consensusThreshold}
                  onChange={(e) => setConsensusThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <p className="text-xs text-gray-500">
                  Poll will close when one option reaches {consensusThreshold}% of votes
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
