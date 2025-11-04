import React, { useState } from 'react';
import { Plus, X, StickyNote, Lightbulb } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateNoteData, CreateIdeaData, BoardCategory, StickyType } from '../types';
import { STICKY_COLORS, CATEGORIES } from '../constants';
import { cn } from '@/lib/utils';

interface CreateStickyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNote: (data: CreateNoteData) => Promise<void>;
  onCreateIdea?: (data: CreateIdeaData) => Promise<void>;
}

export const CreateStickyDialog: React.FC<CreateStickyDialogProps> = ({
  open,
  onOpenChange,
  onCreateNote,
  onCreateIdea,
}) => {
  const [loading, setLoading] = useState(false);
  const [stickyType, setStickyType] = useState<'note' | 'idea'>('note');
  
  // Note fields
  const [content, setContent] = useState('');
  const [color, setColor] = useState(STICKY_COLORS[0].id);
  
  // Idea fields
  const [ideaContent, setIdeaContent] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  
  // Common fields
  const [category, setCategory] = useState<BoardCategory>('other');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (stickyType === 'note' && !content.trim()) {
      alert('Please enter some content');
      return;
    }

    if (stickyType === 'idea' && !ideaContent.trim()) {
      alert('Please enter your idea');
      return;
    }

    setLoading(true);

    try {
      if (stickyType === 'note') {
        const selectedColor = STICKY_COLORS.find((c) => c.id === color) || STICKY_COLORS[0];
        
        await onCreateNote({
          content: content.trim(),
          color: selectedColor.color,
          category,
        });

        // Reset note form
        setContent('');
        setColor(STICKY_COLORS[0].id);
      } else if (stickyType === 'idea' && onCreateIdea) {
        await onCreateIdea({
          content: ideaContent.trim(),
          category,
          estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        });

        // Reset idea form
        setIdeaContent('');
        setEstimatedCost('');
      }

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
          <DialogTitle>Add to PartyBoard</DialogTitle>
          <DialogDescription>
            Create a sticky note or share an idea
          </DialogDescription>
        </DialogHeader>

        <Tabs value={stickyType} onValueChange={(value) => setStickyType(value as 'note' | 'idea')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="note" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Note
            </TabsTrigger>
            <TabsTrigger value="idea" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Idea
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="note" className="space-y-6 mt-0">
              {/* Note Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Note Content *</Label>
                <Textarea
                  id="content"
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
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
            </TabsContent>

            <TabsContent value="idea" className="space-y-6 mt-0">
              {/* Idea Content */}
              <div className="space-y-2">
                <Label htmlFor="ideaContent">Your Idea *</Label>
                <Textarea
                  id="ideaContent"
                  placeholder="Share your party planning idea..."
                  value={ideaContent}
                  onChange={(e) => setIdeaContent(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              {/* Estimated Cost */}
              <div className="space-y-2">
                <Label htmlFor="cost">Estimated Cost (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="0.00"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="pl-7"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Category (Common for both) */}
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
                {loading ? 'Creating...' : `Create ${stickyType === 'note' ? 'Note' : 'Idea'}`}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
