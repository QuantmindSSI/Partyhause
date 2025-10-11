import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Calendar,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Brain,
  Heart,
  Zap,
  Target,
  Plus,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { EventDetails } from '@/types/eventDetails';

interface EnhancedEventCreationProps {
  onEventCreated: (eventDetails: EventDetails) => void;
  onCancel: () => void;
}

export const EnhancedEventCreation: React.FC<EnhancedEventCreationProps> = ({
  onEventCreated,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [eventDetails, setEventDetails] = useState<Partial<EventDetails>>({});

  const steps = [
    { id: 1, title: 'Basic Info', icon: Calendar },
    { id: 2, title: 'Atmosphere', icon: Sparkles },
    { id: 3, title: 'Attendees', icon: Users },
    { id: 4, title: 'Preferences', icon: Heart },
    { id: 5, title: 'Context', icon: MapPin },
    { id: 6, title: 'AI Insights', icon: Brain }
  ];

  const updateEventDetails = (section: keyof EventDetails, data: any) => {
    setEventDetails(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (eventDetails) {
      onEventCreated(eventDetails as EventDetails);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step.id 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            <step.icon className="w-5 h-5" />
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`w-16 h-0.5 mx-2 ${
                currentStep > step.id ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderBasicInfo = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              placeholder="Give your event a name..."
              value={eventDetails.basicInfo?.name || ''}
              onChange={(e) => updateEventDetails('basicInfo', { name: e.target.value })}
            />
          </div>

          <div>
            <Label>Event Type</Label>
            <Select 
              value={eventDetails.basicInfo?.eventType || ''}
              onValueChange={(value) => updateEventDetails('basicInfo', { eventType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">Birthday Party</SelectItem>
                <SelectItem value="corporate">Corporate Event</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="reunion">Reunion</SelectItem>
                <SelectItem value="casual">Casual Gathering</SelectItem>
                <SelectItem value="celebration">Celebration</SelectItem>
                <SelectItem value="networking">Networking Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="attendeeCount">Expected Attendees</Label>
            <Input
              id="attendeeCount"
              type="number"
              placeholder="How many people?"
              value={eventDetails.basicInfo?.attendeeCount || ''}
              onChange={(e) => updateEventDetails('basicInfo', { attendeeCount: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="How long will it last?"
              value={eventDetails.basicInfo?.estimatedDuration || ''}
              onChange={(e) => updateEventDetails('basicInfo', { estimatedDuration: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <Label>Venue Type</Label>
            <RadioGroup 
              value={eventDetails.basicInfo?.venue || ''}
              onValueChange={(value) => updateEventDetails('basicInfo', { venue: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="indoor" id="indoor" />
                <Label htmlFor="indoor">Indoor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outdoor" id="outdoor" />
                <Label htmlFor="outdoor">Outdoor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed">Mixed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="virtual" id="virtual" />
                <Label htmlFor="virtual">Virtual</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Where will it take place?"
              value={eventDetails.basicInfo?.location?.address || ''}
              onChange={(e) => updateEventDetails('basicInfo', { 
                location: { ...eventDetails.basicInfo?.location, address: e.target.value }
              })}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAtmosphere = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Energy Level</Label>
            <div className="space-y-2">
              <Slider
                value={[getEnergyValue(eventDetails.atmosphere?.energyLevel)]}
                onValueChange={([value]) => updateEventDetails('atmosphere', { 
                  energyLevel: getEnergyLevel(value) 
                })}
                max={4}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Chill</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Very High</span>
              </div>
            </div>
          </div>

          <div>
            <Label>Formality Level</Label>
            <Select 
              value={eventDetails.atmosphere?.formality || ''}
              onValueChange={(value) => updateEventDetails('atmosphere', { formality: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="How formal?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very-casual">Very Casual</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="semi-formal">Semi-Formal</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="black-tie">Black Tie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Interaction Style</Label>
            <RadioGroup 
              value={eventDetails.atmosphere?.interactionStyle || ''}
              onValueChange={(value) => updateEventDetails('atmosphere', { interactionStyle: value })}
            >
              {[
                { value: 'intimate', label: 'Intimate & Personal' },
                { value: 'social', label: 'Social & Mingling' },
                { value: 'competitive', label: 'Competitive & Exciting' },
                { value: 'collaborative', label: 'Collaborative & Team-building' },
                { value: 'mixed', label: 'Mixed Interactions' }
              ].map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Mood & Vibes (select all that apply)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['fun', 'relaxed', 'exciting', 'elegant', 'adventurous', 'creative', 'nostalgic', 'energetic'].map(mood => (
                <Badge
                  key={mood}
                  variant={eventDetails.atmosphere?.mood?.includes(mood) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const currentMoods = eventDetails.atmosphere?.mood || [];
                    const newMoods = currentMoods.includes(mood)
                      ? currentMoods.filter(m => m !== mood)
                      : [...currentMoods, mood];
                    updateEventDetails('atmosphere', { mood: newMoods });
                  }}
                >
                  {mood}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Music Preference</Label>
            <Select 
              value={eventDetails.atmosphere?.musicPreference || ''}
              onValueChange={(value) => updateEventDetails('atmosphere', { musicPreference: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Music style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="background">Background Music</SelectItem>
                <SelectItem value="dancing">Dancing Music</SelectItem>
                <SelectItem value="live-performance">Live Performance</SelectItem>
                <SelectItem value="none">No Music</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Themes (optional)</Label>
            <Input
              placeholder="Add themes separated by commas"
              value={eventDetails.atmosphere?.themes?.join(', ') || ''}
              onChange={(e) => updateEventDetails('atmosphere', { 
                themes: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Helper functions
  const getEnergyValue = (level: string | undefined): number => {
    const map: { [key: string]: number } = { 'chill': 0, 'moderate': 1, 'high': 2, 'very-high': 3 };
    return map[level || 'moderate'] || 1;
  };

  const getEnergyLevel = (value: number): string => {
    const levels = ['chill', 'moderate', 'high', 'very-high'];
    return levels[value] || 'moderate';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Perfect Event</h1>
        <p className="text-gray-600">Let's gather some details to curate the ideal experience for you.</p>
      </div>

      {renderStepIndicator()}

      <Card className="min-h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep - 1].icon, { className: "w-6 h-6 text-orange-500" })}
            {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && renderBasicInfo()}
          {currentStep === 2 && renderAtmosphere()}
          {/* TODO: Add remaining steps */}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          {currentStep === steps.length ? (
            <Button onClick={handleSubmit} className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Create Event & Get Game Recommendations
            </Button>
          ) : (
            <Button onClick={nextStep} className="flex items-center gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};