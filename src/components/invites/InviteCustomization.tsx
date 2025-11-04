import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Send, Download, Palette } from 'lucide-react';
import { InviteTemplate, CustomInviteData } from '@/types/invites';
import type { InviteCustomization } from '@/types/invites';

interface InviteCustomizationProps {
  template: InviteTemplate;
  eventData: {
    name: string;
    date: string;
    time: string;
    location: string;
    host?: string;
  };
  onBack: () => void;
  onSend: (inviteData: CustomInviteData, customization: InviteCustomization) => void;
  onSave: (inviteData: CustomInviteData, customization: InviteCustomization) => void;
}

const FONT_FAMILIES = [
  { value: 'sans-serif', label: 'Modern Sans-Serif' },
  { value: 'serif', label: 'Classic Serif' },
  { value: 'script', label: 'Elegant Script' },
  { value: 'modern', label: 'Contemporary' },
];

const FONT_SIZES = [
  { value: 'small', label: 'Compact' },
  { value: 'medium', label: 'Standard' },
  { value: 'large', label: 'Large & Bold' },
];

export default function InviteCustomization({
  template,
  eventData,
  onBack,
  onSend,
  onSave
}: InviteCustomizationProps) {
  const [inviteData, setInviteData] = useState<CustomInviteData>({
    event_name: eventData.name,
    host_name: eventData.host || '',
    date: eventData.date,
    time: eventData.time,
    location: eventData.location,
    dress_code: '',
    rsvp_info: '',
    additional_notes: '',
    template_id: template.id,
  });

  const [customization, setCustomization] = useState<InviteCustomization>({
    template_id: template.id,
    custom_text: `You're invited to ${eventData.name}!`,
    custom_colors: { ...template.colors },
    font_family: 'sans-serif',
    font_size: 'medium',
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const updateInviteData = (field: keyof CustomInviteData, value: string) => {
    setInviteData(prev => ({ ...prev, [field]: value }));
  };

  const updateCustomization = (field: keyof InviteCustomization, value: any) => {
    setCustomization(prev => ({ ...prev, [field]: value }));
  };

  const updateCustomColor = (colorKey: string, value: string) => {
    setCustomization(prev => ({
      ...prev,
      custom_colors: {
        ...prev.custom_colors,
        [colorKey]: value
      }
    }));
  };

  const handleSend = () => {
    onSend(inviteData, customization);
  };

  const handleSave = () => {
    onSave(inviteData, customization);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onBack} className="mr-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Customize Your Invitation
                </h1>
                <p className="text-gray-600">
                  Personalize your {template.name} invitation
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customization Panel */}
            <div className="space-y-6">
              {/* Template Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Template: {template.name}
                  </CardTitle>
                  <CardDescription>
                    {template.description}
                    {template.is_premium && (
                      <Badge className="ml-2 bg-yellow-500 text-yellow-900 text-xs">
                        PRO
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>
                    Basic information for your invitation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="event-name">Event Name</Label>
                    <Input
                      id="event-name"
                      value={inviteData.event_name}
                      onChange={(e) => updateInviteData('event_name', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="host-name">Host Name</Label>
                    <Input
                      id="host-name"
                      placeholder="Your name or organization"
                      value={inviteData.host_name}
                      onChange={(e) => updateInviteData('host_name', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={inviteData.date}
                        onChange={(e) => updateInviteData('date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={inviteData.time}
                        onChange={(e) => updateInviteData('time', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={inviteData.location}
                      onChange={(e) => updateInviteData('location', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dress-code">Dress Code (Optional)</Label>
                    <Input
                      id="dress-code"
                      placeholder="e.g., Casual, Formal, Cocktail Attire"
                      value={inviteData.dress_code || ''}
                      onChange={(e) => updateInviteData('dress_code', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rsvp-info">RSVP Information</Label>
                    <Input
                      id="rsvp-info"
                      placeholder="e.g., RSVP by March 15th to john@example.com"
                      value={inviteData.rsvp_info || ''}
                      onChange={(e) => updateInviteData('rsvp_info', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Customization Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Design Customization</CardTitle>
                  <CardDescription>
                    Personalize the look and feel of your invitation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="custom-text">Custom Headline</Label>
                    <Input
                      id="custom-text"
                      value={customization.custom_text}
                      onChange={(e) => updateCustomization('custom_text', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="font-family">Font Style</Label>
                      <Select
                        value={customization.font_family}
                        onValueChange={(value) => updateCustomization('font_family', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_FAMILIES.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="font-size">Text Size</Label>
                      <Select
                        value={customization.font_size}
                        onValueChange={(value) => updateCustomization('font_size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Color Customization */}
                  <div>
                    <Label>Color Scheme</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="primary-color" className="text-xs text-gray-500">Primary</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="primary-color"
                            type="color"
                            value={customization.custom_colors?.primary || template.colors.primary}
                            onChange={(e) => updateCustomColor('primary', e.target.value)}
                            className="w-12 h-8 p-0 border-0"
                          />
                          <Input
                            value={customization.custom_colors?.primary || template.colors.primary}
                            onChange={(e) => updateCustomColor('primary', e.target.value)}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="secondary-color" className="text-xs text-gray-500">Secondary</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={customization.custom_colors?.secondary || template.colors.secondary}
                            onChange={(e) => updateCustomColor('secondary', e.target.value)}
                            className="w-12 h-8 p-0 border-0"
                          />
                          <Input
                            value={customization.custom_colors?.secondary || template.colors.secondary}
                            onChange={(e) => updateCustomColor('secondary', e.target.value)}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="additional-notes">Additional Notes</Label>
                    <Textarea
                      id="additional-notes"
                      placeholder="Any special instructions or additional information..."
                      value={inviteData.additional_notes || ''}
                      onChange={(e) => updateInviteData('additional_notes', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="lg:sticky lg:top-8">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    See how your invitation will look
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Invitation Preview */}
                  <div 
                    className="aspect-[3/4] rounded-lg p-8 text-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${customization.custom_colors?.primary || template.colors.primary}, ${customization.custom_colors?.secondary || template.colors.secondary})`,
                      color: customization.custom_colors?.text || template.colors.text,
                      fontFamily: customization.font_family === 'serif' ? 'serif' : 
                                 customization.font_family === 'script' ? 'cursive' : 'sans-serif'
                    }}
                  >
                    {/* Decorative Elements */}
                    <div 
                      className="absolute inset-4 border-2 rounded-lg opacity-20"
                      style={{ borderColor: customization.custom_colors?.accent || template.colors.accent }}
                    />
                    
                    <div className="relative z-10 h-full flex flex-col justify-center space-y-4">
                      {/* Custom Headline */}
                      <h1 
                        className={`font-bold ${
                          customization.font_size === 'large' ? 'text-2xl' : 
                          customization.font_size === 'small' ? 'text-lg' : 'text-xl'
                        }`}
                        style={{ color: customization.custom_colors?.accent || template.colors.accent }}
                      >
                        {customization.custom_text}
                      </h1>
                      
                      {/* Event Details */}
                      <div 
                        className="space-y-2"
                        style={{ color: customization.custom_colors?.accent || template.colors.accent }}
                      >
                        <p className="text-lg font-semibold">{inviteData.event_name}</p>
                        <p className="text-sm">{formatDate(inviteData.date)}</p>
                        <p className="text-sm">{inviteData.time}</p>
                        <p className="text-sm">{inviteData.location}</p>
                        
                        {inviteData.dress_code && (
                          <p className="text-xs italic">Dress Code: {inviteData.dress_code}</p>
                        )}
                        
                        {inviteData.host_name && (
                          <p className="text-sm mt-4">Hosted by {inviteData.host_name}</p>
                        )}
                        
                        {inviteData.rsvp_info && (
                          <p className="text-xs mt-4">{inviteData.rsvp_info}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" onClick={handleSave} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button onClick={handleSend} className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Send Invites
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}