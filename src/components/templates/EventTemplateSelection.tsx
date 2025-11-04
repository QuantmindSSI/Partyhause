import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

const TEMPLATES: EventTemplate[] = [
  {
    id: 'birthday',
    name: 'Birthday Party (Adult)',
    description: 'Celebrate with cocktails & entertainment',
    icon: '🎉',
    color: '#FF6B9D',
    category: 'birthday',
  },
  {
    id: 'kids-birthday',
    name: 'Kids Birthday Party',
    description: 'Fun activities for children',
    icon: '🎈',
    color: '#FFB74D',
    category: 'birthday',
  },
  {
    id: 'wedding',
    name: 'Wedding',
    description: 'Plan your special day',
    icon: '💍',
    color: '#EC407A',
    category: 'wedding',
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Showcase your product',
    icon: '🚀',
    color: '#42A5F5',
    category: 'corporate',
  },
  {
    id: 'fundraiser',
    name: 'Fundraiser',
    description: 'Charity event with auctions',
    icon: '💰',
    color: '#66BB6A',
    category: 'fundraiser',
  },
  {
    id: 'festival',
    name: 'Music Festival',
    description: 'Multi-stage event',
    icon: '🎵',
    color: '#AB47BC',
    category: 'social',
  },
  {
    id: 'conference',
    name: 'Conference',
    description: 'Professional meetup',
    icon: '🎤',
    color: '#26A69A',
    category: 'corporate',
  },
  {
    id: 'travel',
    name: 'Group Travel',
    description: 'Multi-day trip planning',
    icon: '✈️',
    color: '#5C6BC0',
    category: 'travel',
  },
  {
    id: 'block-party',
    name: 'Block Party',
    description: 'Community celebration',
    icon: '🏘️',
    color: '#FF7043',
    category: 'social',
  },
  {
    id: 'workshop',
    name: 'Class/Workshop',
    description: 'Learning experience',
    icon: '📚',
    color: '#78909C',
    category: 'corporate',
  },
  {
    id: 'hackathon',
    name: 'Hackathon',
    description: 'Coding competition',
    icon: '💻',
    color: '#7E57C2',
    category: 'corporate',
  },
];

interface EventTemplateSelectionProps {
  onSelectTemplate: (template: EventTemplate) => void;
  onBack?: () => void;
}

export const EventTemplateSelection: React.FC<EventTemplateSelectionProps> = ({
  onSelectTemplate,
  onBack,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSelect = (template: EventTemplate) => {
    setSelectedTemplate(template.id);
    onSelectTemplate(template);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Create Event
            </h1>
            <p className="text-lg text-gray-600">
              Choose a template to get started
            </p>
          </motion.div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {TEMPLATES.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl',
                  'border-2 hover:border-violet-500',
                  selectedTemplate === template.id && 'ring-2 ring-violet-500'
                )}
                style={{ borderColor: template.color }}
                onClick={() => handleSelect(template)}
              >
                <CardContent className="p-6">
                  {/* Icon Container */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
                    style={{ backgroundColor: `${template.color}33` }}
                  >
                    {template.icon}
                  </div>

                  {/* Template Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {template.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Category Badge */}
                  <div className="mt-4">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: template.color }}
                    >
                      {template.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* AI-Powered Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: TEMPLATES.length * 0.05 }}
          className="mt-8"
        >
          <Card className="border-2 border-dashed border-violet-300 hover:border-violet-500 transition-colors cursor-pointer">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-12 w-12 text-violet-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI-Powered Custom Event
              </h3>
              <p className="text-gray-600 mb-4">
                Let AI help you create a personalized event from scratch
              </p>
              <Button variant="outline" className="border-violet-300 text-violet-600 hover:bg-violet-50">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
