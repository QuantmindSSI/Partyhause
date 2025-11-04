import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Clock } from 'lucide-react';
import { TimelineBlock, TimelineBlockType, BLOCK_TYPES, formatDuration } from '../types';
import { cn } from '@/lib/utils';

interface AddTimelineBlockFormProps {
  onAdd: (block: Omit<TimelineBlock, 'id'>) => void;
  onCancel: () => void;
  existingBlocks?: TimelineBlock[];
}

export const AddTimelineBlockForm: React.FC<AddTimelineBlockFormProps> = ({
  onAdd,
  onCancel,
  existingBlocks = [],
}) => {
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    start_time: '',
    duration: 60,
    type: 'activity' as TimelineBlockType,
    guest_visible: true,
    notify_before: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (formData.duration < 5) {
      newErrors.duration = 'Duration must be at least 5 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onAdd({
      label: formData.label.trim(),
      description: formData.description.trim(),
      start_time: formData.start_time,
      duration: formData.duration,
      type: formData.type,
      guest_visible: formData.guest_visible,
      notify_before: formData.notify_before,
      order: existingBlocks.length,
    });

    // Reset form
    setFormData({
      label: '',
      description: '',
      start_time: '',
      duration: 60,
      type: 'activity',
      guest_visible: true,
      notify_before: 0,
    });
  };

  const selectedTypeConfig = BLOCK_TYPES.find(t => t.value === formData.type);

  return (
    <Card className="border-2 border-violet-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Add Timeline Block</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Create a new activity, meal, speech, or other timeline event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Block Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Block Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as TimelineBlockType })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              placeholder="e.g., Welcome Reception, Dinner, Keynote Speech"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className={cn(errors.label && 'border-red-500')}
            />
            {errors.label && (
              <p className="text-sm text-red-600">{errors.label}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Time and Duration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className={cn(errors.start_time && 'border-red-500')}
              />
              {errors.start_time && (
                <p className="text-sm text-red-600">{errors.start_time}</p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">{formatDuration(formData.duration)}</span>
              </div>
              <p className="text-xs text-gray-500">5-240 minutes (5 min to 4 hours)</p>
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-4">
            {/* Guest Visible */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="guest_visible">Visible to Guests</Label>
                <p className="text-sm text-gray-500">
                  Show this block in guest-facing timeline
                </p>
              </div>
              <Switch
                id="guest_visible"
                checked={formData.guest_visible}
                onCheckedChange={(checked) => setFormData({ ...formData, guest_visible: checked })}
              />
            </div>

            {/* Notification */}
            <div className="space-y-2">
              <Label htmlFor="notify_before">Remind Before</Label>
              <Select
                value={formData.notify_before.toString()}
                onValueChange={(value) => setFormData({ ...formData, notify_before: parseInt(value) })}
              >
                <SelectTrigger id="notify_before">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No reminder</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="120">2 hours before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              style={{ backgroundColor: selectedTypeConfig?.color }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
