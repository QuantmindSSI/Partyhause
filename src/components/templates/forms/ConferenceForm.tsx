import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface ConferenceFormData {
  conference_name?: string;
  conference_type?: string;
  industry?: string;
  expected_attendees?: number;
  target_audience?: string;
  venue_type?: string;
  venue_name?: string;
  conference_format?: string;
  number_of_days?: number;
  hybrid_event?: boolean;
  virtual_platform?: string;
  number_of_tracks?: number;
  keynote_speakers?: string;
  session_types?: string[];
  networking_events?: boolean;
  meals_included?: string[];
  registration_tiers?: string[];
  early_bird_pricing?: boolean;
  sponsor_exhibitors?: boolean;
  ceu_credits?: boolean;
  accessibility_needs?: string;
  special_requests?: string;
}

interface ConferenceFormProps {
  initialData?: ConferenceFormData;
  onChange: (data: ConferenceFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const CONFERENCE_TYPES = [
  'Academic/Scholarly',
  'Industry/Professional',
  'Trade Show/Expo',
  'Summit',
  'Symposium',
  'Workshop Series',
  'Annual Meeting',
  'User Conference',
  'Networking Event',
  'Panel Discussion Series',
];

const VENUE_TYPES = [
  'Convention Center',
  'Hotel Conference Center',
  'University Campus',
  'Corporate Campus',
  'Resort',
  'Virtual Only',
  'Hybrid Venue',
  'Community Center',
  'Co-working Space',
];

const FORMATS = [
  'Single Track',
  'Multi-Track',
  'Unconference',
  'Workshop-Focused',
  'Exhibition-Focused',
  'Hybrid Sessions',
  'Lightning Talks',
  'Poster Session',
];

const SESSION_TYPES = [
  'Keynote',
  'Panel Discussion',
  'Workshop',
  'Lightning Talk',
  'Poster Session',
  'Demo',
  'Roundtable',
  'Networking Session',
  'Q&A Session',
  'Breakout Session',
];

const MEAL_OPTIONS = [
  'Breakfast',
  'Morning Coffee Break',
  'Lunch',
  'Afternoon Coffee Break',
  'Dinner',
  'Welcome Reception',
  'Closing Reception',
];

const REGISTRATION_TIERS = [
  'Early Bird',
  'Standard',
  'Late Registration',
  'Student/Academic',
  'VIP',
  'Speaker',
  'Exhibitor',
  'Virtual Only',
];

export default function ConferenceForm({
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange,
}: ConferenceFormProps) {
  const [formData, setFormData] = useState<ConferenceFormData>(initialData);

  const updateField = (field: keyof ConferenceFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const toggleSessionType = (type: string) => {
    const current = formData.session_types || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateField('session_types', updated);
  };

  const toggleMeal = (meal: string) => {
    const current = formData.meals_included || [];
    const updated = current.includes(meal)
      ? current.filter(m => m !== meal)
      : [...current, meal];
    updateField('meals_included', updated);
  };

  const toggleRegistration = (tier: string) => {
    const current = formData.registration_tiers || [];
    const updated = current.includes(tier)
      ? current.filter(t => t !== tier)
      : [...current, tier];
    updateField('registration_tiers', updated);
  };

  const isValid = () => {
    return formData.conference_name &&
           formData.conference_type &&
           formData.expected_attendees &&
           formData.venue_type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎤 Conference Planning</h1>
          <p className="text-gray-600">Let&apos;s organize a professional gathering!</p>
        </div>
      </div>

      {/* Conference Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Conference Basics</CardTitle>
          <CardDescription>Core information about your event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="conference-name">Conference Name *</Label>
            <Input
              id="conference-name"
              placeholder="e.g., Tech Summit 2024"
              value={formData.conference_name || ''}
              onChange={(e) => updateField('conference_name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="conference-type">Conference Type *</Label>
              <Select
                value={formData.conference_type}
                onValueChange={(value) => updateField('conference_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONFERENCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="industry">Industry/Field</Label>
              <Input
                id="industry"
                placeholder="e.g., Technology, Healthcare, Finance"
                value={formData.industry || ''}
                onChange={(e) => updateField('industry', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expected-attendees">Expected Attendees *</Label>
              <Input
                id="expected-attendees"
                type="number"
                placeholder="Number of participants"
                value={formData.expected_attendees || ''}
                onChange={(e) => updateField('expected_attendees', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="number-of-days">Number of Days</Label>
              <Input
                id="number-of-days"
                type="number"
                placeholder="1-3 days typical"
                value={formData.number_of_days || ''}
                onChange={(e) => updateField('number_of_days', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="target-audience">Target Audience</Label>
            <Input
              id="target-audience"
              placeholder="e.g., C-suite executives, developers, researchers"
              value={formData.target_audience || ''}
              onChange={(e) => updateField('target_audience', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Venue & Format */}
      <Card>
        <CardHeader>
          <CardTitle>Venue & Format</CardTitle>
          <CardDescription>Where and how will it take place?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="venue-type">Venue Type *</Label>
              <Select
                value={formData.venue_type}
                onValueChange={(value) => updateField('venue_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPES.map((venue) => (
                    <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="conference-format">Conference Format</Label>
              <Select
                value={formData.conference_format}
                onValueChange={(value) => updateField('conference_format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="venue-name">Venue Name</Label>
            <Input
              id="venue-name"
              placeholder="Specific venue or location name"
              value={formData.venue_name || ''}
              onChange={(e) => updateField('venue_name', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="hybrid-event"
              checked={formData.hybrid_event || false}
              onCheckedChange={(checked) => updateField('hybrid_event', checked)}
            />
            <Label htmlFor="hybrid-event">Hybrid Event (in-person + virtual)</Label>
          </div>

          {formData.hybrid_event && (
            <div>
              <Label htmlFor="virtual-platform">Virtual Platform</Label>
              <Input
                id="virtual-platform"
                placeholder="e.g., Zoom, Teams, Hopin, Whova"
                value={formData.virtual_platform || ''}
                onChange={(e) => updateField('virtual_platform', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions & Tracks */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions & Tracks</CardTitle>
          <CardDescription>Content structure and speakers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="number-of-tracks">Number of Tracks/Sessions</Label>
            <Input
              id="number-of-tracks"
              type="number"
              placeholder="How many concurrent tracks?"
              value={formData.number_of_tracks || ''}
              onChange={(e) => updateField('number_of_tracks', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div>
            <Label htmlFor="keynote-speakers">Keynote Speakers</Label>
            <Textarea
              id="keynote-speakers"
              placeholder="List keynote or featured speakers..."
              value={formData.keynote_speakers || ''}
              onChange={(e) => updateField('keynote_speakers', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label>Session Types (select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {SESSION_TYPES.map((type) => (
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.session_types || []).includes(type)}
                    onChange={() => toggleSessionType(type)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration & Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Registration & Pricing</CardTitle>
          <CardDescription>Ticketing and attendance options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Registration Tiers</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {REGISTRATION_TIERS.map((tier) => (
                <label key={tier} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.registration_tiers || []).includes(tier)}
                    onChange={() => toggleRegistration(tier)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{tier}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="early-bird"
              checked={formData.early_bird_pricing || false}
              onCheckedChange={(checked) => updateField('early_bird_pricing', checked)}
            />
            <Label htmlFor="early-bird">Offer Early Bird Pricing</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="sponsor-exhibitors"
              checked={formData.sponsor_exhibitors || false}
              onCheckedChange={(checked) => updateField('sponsor_exhibitors', checked)}
            />
            <Label htmlFor="sponsor-exhibitors">Include Sponsor/Exhibitor Area</Label>
          </div>
        </CardContent>
      </Card>

      {/* Meals & Catering */}
      <Card>
        <CardHeader>
          <CardTitle>Meals & Catering</CardTitle>
          <CardDescription>Food and beverage arrangements</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Meals Included</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {MEAL_OPTIONS.map((meal) => (
                <label key={meal} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.meals_included || []).includes(meal)}
                    onChange={() => toggleMeal(meal)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{meal}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Features */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Features</CardTitle>
          <CardDescription>Special considerations and certifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="networking-events"
              checked={formData.networking_events || false}
              onCheckedChange={(checked) => updateField('networking_events', checked)}
            />
            <Label htmlFor="networking-events">Include Networking Events</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ceu-credits"
              checked={formData.ceu_credits || false}
              onCheckedChange={(checked) => updateField('ceu_credits', checked)}
            />
            <Label htmlFor="ceu-credits">Offer CEU/Certification Credits</Label>
          </div>

          <div>
            <Label htmlFor="accessibility">Accessibility Needs</Label>
            <Textarea
              id="accessibility"
              placeholder="Describe any accessibility accommodations provided..."
              value={formData.accessibility_needs || ''}
              onChange={(e) => updateField('accessibility_needs', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Special Requests</CardTitle>
          <CardDescription>Any additional details or requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="AV requirements, special accommodations, or anything else we should know..."
            value={formData.special_requests || ''}
            onChange={(e) => updateField('special_requests', e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Event Description */}
      <Card>
        <CardHeader>
          <CardTitle>Event Description *</CardTitle>
          <CardDescription>
            Share a brief overview attendees will see in invites and on the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="event-description"
            placeholder="Describe your conference—share what makes it valuable and unique!"
            value={eventDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            required
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Templates
        </Button>
        <Button
          onClick={onNext}
          className="flex-1"
          disabled={!isValid() || !eventDescription.trim()}
        >
          Continue to Event Details
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
