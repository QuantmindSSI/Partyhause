import React, { useState } from 'react';
import { Plus, X, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateNoteData, BoardCategory } from '../types';
import { STICKY_COLORS, CATEGORIES } from '../constants';
import { cn } from '@/lib/utils';

interface CreateStickyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNote: (data: CreateNoteData) => Promise<void>;
}

export const CreateStickyDialog: React.FC<CreateStickyDialogProps> = ({
  open,
  onOpenChange,
  onCreateNote,
}) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [color, setColor] = useState(STICKY_COLORS[0].id);
  const [category, setCategory] = useState<BoardCategory>('other');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Please enter some content');
      return;
    }

    setLoading(true);

    try {
      const selectedColor = STICKY_COLORS.find((c) => c.id === color) || STICKY_COLORS[0];
      
      await onCreateNote({
        content: content.trim(),
        color: selectedColor.color,
        category,
      });

      // Reset form
      setContent('');
      setColor(STICKY_COLORS[0].id);
      setCategory('other');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create sticky:', error);
      alert('Failed to create sticky. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedColor = STICKY_COLORS.find((c) => c.id === color) || STICKY_COLORS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-violet-600" />
            Create Sticky Note
          </DialogTitle>
          <DialogDescription>
            Add a quick note to your party planning board
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Note Content *</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              className="resize-none"
              style={{
                backgroundColor: selectedColor.color,
                color: selectedColor.textColor,
              }}
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Sticky Color</Label>
            <div className="flex gap-2 flex-wrap">
              {STICKY_COLORS.map((colorOption) => (
                <button
                  key={colorOption.id}
                  type="button"
                  onClick={() => setColor(colorOption.id)}
                  className={cn(
                    'w-12 h-12 rounded-lg border-2 transition-all',
                    color === colorOption.id
                      ? 'border-violet-600 ring-2 ring-violet-200 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: colorOption.color }}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as BoardCategory)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter((cat) => cat.id !== 'all').map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Sticky'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
