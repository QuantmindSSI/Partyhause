import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Clock, Users, Eye, EyeOff, Bell } from 'lucide-react';
import { TimelineBlock, BLOCK_TYPES, formatDuration, calculateEndTime } from '../types';
import { TimelineBlockComponent } from './TimelineBlockComponent';
import { AddTimelineBlockForm } from './AddTimelineBlockForm';

interface TimelineManagementProps {
  eventName?: string;
  initialBlocks?: TimelineBlock[];
  onBack?: () => void;
  onNext?: (blocks: TimelineBlock[]) => void;
  onSave?: (blocks: TimelineBlock[]) => void;
}

export function TimelineManagement({
  eventName = "Your Event",
  initialBlocks = [],
  onBack,
  onNext,
  onSave
}: TimelineManagementProps) {
  const [blocks, setBlocks] = useState<TimelineBlock[]>(initialBlocks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimelineBlock | null>(null);

  const handleAddBlock = (newBlock: Omit<TimelineBlock, 'id' | 'order'>) => {
    const block: TimelineBlock = {
      ...newBlock,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: blocks.length,
    };
    
    const updatedBlocks = [...blocks, block].sort((a, b) => {
      // Sort by start_time
      return new Date(`1970-01-01 ${a.start_time}`).getTime() - 
             new Date(`1970-01-01 ${b.start_time}`).getTime();
    });
    
    setBlocks(updatedBlocks);
    setShowAddForm(false);
  };

  const handleEditBlock = (blockId: string, updatedBlock: Partial<TimelineBlock>) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updatedBlock } : block
    ).sort((a, b) => {
      return new Date(`1970-01-01 ${a.start_time}`).getTime() - 
             new Date(`1970-01-01 ${b.start_time}`).getTime();
    });
    
    setBlocks(updatedBlocks);
    setEditingBlock(null);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(updatedBlocks);
  };

  const handleNext = () => {
    if (onNext) {
      onNext(blocks);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(blocks);
    }
  };

  const totalDuration = blocks.reduce((total, block) => total + block.duration, 0);
  const publicBlocks = blocks.filter(block => block.guest_visible).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {onBack && (
                <Button variant="ghost" onClick={onBack} className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  📅 Event Timeline
                </h1>
                <p className="text-gray-600">
                  Plan the schedule for {eventName}
                </p>
              </div>
            </div>
            
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            )}
          </div>

          {/* Timeline Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{blocks.length}</p>
                <p className="text-sm text-gray-600">Activities</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(totalDuration)}</p>
                <p className="text-sm text-gray-600">Total Duration</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{publicBlocks}</p>
                <p className="text-sm text-gray-600">Guest Visible</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Bell className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {blocks.filter(b => b.notify_before > 0).length}
                </p>
                <p className="text-sm text-gray-600">With Reminders</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Block Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Add New Activity</CardTitle>
                  <CardDescription>
                    Create a timeline block for your event schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AddTimelineBlockForm
                    onAdd={handleAddBlock}
                    onCancel={() => setShowAddForm(false)}
                    existingBlocks={blocks}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Timeline Blocks */}
          <div className="space-y-4 mb-8">
            {blocks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No activities yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start building your event timeline by adding activities, meals, speeches, and more.
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Activity
                  </Button>
                </CardContent>
              </Card>
            ) : (
              blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TimelineBlockComponent
                    block={block}
                    onEdit={(updatedData) => handleEditBlock(block.id, updatedData)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    isDraggable={false}
                  />
                </motion.div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="flex-1">
                Back to Event Details
              </Button>
            )}
            
            {onSave && (
              <Button variant="outline" onClick={handleSave}>
                Save Timeline
              </Button>
            )}
            
            {onNext && (
              <Button onClick={handleNext} className="flex-1">
                Continue to Invitations
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}