import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Check, Sparkles, Diamond, Heart, Circle, Gift, Briefcase } from 'lucide-react';
import { INVITE_TEMPLATES, InviteTemplate } from '@/types/invites';

interface InviteTemplateSelectionProps {
  eventType?: string;
  onSelectTemplate: (template: InviteTemplate) => void;
  onBack?: () => void;
}

const getStyleIcon = (style: InviteTemplate['style']) => {
  const icons = {
    elegant: Sparkles,
    modern: Diamond,
    fun: Heart,
    minimal: Circle,
    festive: Gift,
    formal: Briefcase,
  };
  return icons[style];
};

export default function InviteTemplateSelection({ 
  eventType, 
  onSelectTemplate, 
  onBack 
}: InviteTemplateSelectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'birthday' | 'wedding' | 'corporate' | 'casual' | 'formal'>('all');

  // Filter templates based on event type or user selection
  const filteredTemplates = INVITE_TEMPLATES.filter(template => {
    if (filter === 'all') return true;
    return template.category === filter;
  });

  const handleSelectTemplate = (template: InviteTemplate) => {
    setSelectedTemplate(template.id);
    // Small delay for visual feedback
    setTimeout(() => {
      onSelectTemplate(template);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            {onBack && (
              <Button variant="ghost" onClick={onBack} className="mr-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Choose Your Invitation Design
              </h1>
              <p className="text-gray-600">
                Select a beautiful template to customize for your event invitations
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { value: 'all', label: 'All Templates' },
              { value: 'birthday', label: 'Birthday' },
              { value: 'wedding', label: 'Wedding' },
              { value: 'corporate', label: 'Corporate' },
              { value: 'casual', label: 'Casual' },
              { value: 'formal', label: 'Formal' },
            ].map((filterOption) => (
              <Button
                key={filterOption.value}
                variant={filter === filterOption.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption.value as any)}
              >
                {filterOption.label}
              </Button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => {
              const StyleIcon = getStyleIcon(template.style);
              const isSelected = selectedTemplate === template.id;

              return (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 overflow-hidden ${
                      isSelected 
                        ? 'shadow-lg border-indigo-200' 
                        : 'hover:shadow-md hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    {/* Preview Area */}
                    <div 
                      className="h-40 relative"
                      style={{
                        background: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary})`
                      }}
                    >
                      {/* Premium Badge */}
                      {template.is_premium && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            PRO
                          </Badge>
                        </div>
                      )}

                      {/* Style Icon */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: template.colors.accent,
                            opacity: 0.9
                          }}
                        >
                          <StyleIcon 
                            className="w-8 h-8" 
                            style={{ color: template.colors.primary }}
                          />
                        </div>
                      </div>

                      {/* Mock invitation content */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div 
                          className="h-2 rounded mb-2"
                          style={{ 
                            backgroundColor: template.colors.accent,
                            width: '80%'
                          }}
                        />
                        <div 
                          className="h-2 rounded"
                          style={{ 
                            backgroundColor: template.colors.accent,
                            width: '60%'
                          }}
                        />
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 left-2">
                          <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {template.description}
                        </p>
                      </div>

                      {/* Style and Category Tags */}
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {template.style.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500">No templates found for the selected category.</p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm mb-4">
              Can't find the perfect design? You can customize any template after selection.
            </p>
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                Skip invitations for now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}