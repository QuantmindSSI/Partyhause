import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface HackathonFormData {
  hackathon_name?: string;
  hackathon_type?: string;
  theme_challenge?: string;
  duration_hours?: number;
  team_size?: string;
  expected_participants?: number;
  skill_level?: string;
  venue_type?: string;
  technology_focus?: string[];
  prizes_awards?: string;
  judges_mentors?: string;
  sponsor_partners?: string;
  meals_provided?: boolean;
  sleeping_arrangements?: boolean;
  swag_provided?: boolean;
  submission_platform?: string;
  presentation_format?: string;
  code_of_conduct?: boolean;
  special_requests?: string;
}

interface HackathonFormProps {
  initialData?: HackathonFormData;
  onChange: (data: HackathonFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const HACKATHON_TYPES = [
  'General Hackathon',
  'Themed/Challenge Hackathon',
  'Competitive Hackathon',
  'Learning/Educational Hackathon',
  'Social Impact Hackathon',
  'Startup Launch Hackathon',
  'Game Jam',
  'Data Science/AI Hackathon',
  'Blockchain/Web3 Hackathon',
  'Health Tech Hackathon',
  'Environmental/Green Tech',
  'Internal Company Hackathon',
];

const SKILL_LEVELS = [
  'Beginner Friendly',
  'Intermediate',
  'Advanced',
  'All Levels',
  'Student Focused',
  'Professional',
];

const VENUE_TYPES = [
  'University Campus',
  'Tech Hub/Co-working Space',
  'Conference Center',
  'Corporate Office',
  'Online/Virtual',
  'Hybrid (In-Person + Virtual)',
  'Incubator/Accelerator Space',
  'Library/Community Space',
];

const TECHNOLOGY_FOCUS = [
  'Web Development',
  'Mobile Apps',
  'AI/Machine Learning',
  'Data Science',
  'Blockchain/Web3',
  'IoT/Hardware',
  'Game Development',
  'VR/AR',
  'Cloud/DevOps',
  'Cybersecurity',
  'Open Source',
  'Any/All Technologies',
];

const TEAM_SIZES = [
  'Solo (Individual)',
  '2-3 People',
  '3-5 People',
  '4-6 People',
  'Flexible',
];

const PRESENTATION_FORMATS = [
  'Live Demo/Presentation',
  'Pre-recorded Video',
  'Panel Judging',
  'Science Fair Style',
  'Lightning Talks',
  'Poster Session',
];

export default function HackathonForm({
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange,
}: HackathonFormProps) {
  const [formData, setFormData] = useState<HackathonFormData>(initialData);

  const updateField = (field: keyof HackathonFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const toggleTech = (tech: string) => {
    const current = formData.technology_focus || [];
    const updated = current.includes(tech)
      ? current.filter(t => t !== tech)
      : [...current, tech];
    updateField('technology_focus', updated);
  };

  const isValid = () => {
    return formData.hackathon_name &&
           formData.hackathon_type &&
           formData.duration_hours &&
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
          <h1 className="text-2xl font-bold text-gray-900">💻 Hackathon</h1>
          <p className="text-gray-600">Let&apos;s organize a coding competition!</p>
        </div>
      </div>

      {/* Hackathon Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Hackathon Basics</CardTitle>
          <CardDescription>Core event information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hackathon-name">Hackathon Name *</Label>
            <Input
              id="hackathon-name"
              placeholder="e.g., CodeFest 2024"
              value={formData.hackathon_name || ''}
              onChange={(e) => updateField('hackathon_name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hackathon-type">Hackathon Type *</Label>
              <Select
                value={formData.hackathon_type}
                onValueChange={(value) => updateField('hackathon_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {HACKATHON_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (Hours) *</Label>
              <Input
                id="duration"
                type="number"
                placeholder="24-48 hours typical"
                value={formData.duration_hours || ''}
                onChange={(e) => updateField('duration_hours', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="theme">Theme/Challenge</Label>
            <Textarea
              id="theme"
              placeholder="What problem will participants solve? What theme guides the event?"
              value={formData.theme_challenge || ''}
              onChange={(e) => updateField('theme_challenge', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>Who can join and how</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="skill-level">Target Skill Level</Label>
              <Select
                value={formData.skill_level}
                onValueChange={(value) => updateField('skill_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="team-size">Team Size</Label>
              <Select
                value={formData.team_size}
                onValueChange={(value) => updateField('team_size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="participants">Expected Participants</Label>
            <Input
              id="participants"
              type="number"
              placeholder="Number of hackers expected"
              value={formData.expected_participants || ''}
              onChange={(e) => updateField('expected_participants', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div>
            <Label>Technology Focus (select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {TECHNOLOGY_FOCUS.map((tech) => (
                <label key={tech} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.technology_focus || []).includes(tech)}
                    onChange={() => toggleTech(tech)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{tech}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Venue & Logistics */}
      <Card>
        <CardHeader>
          <CardTitle>Venue & Logistics</CardTitle>
          <CardDescription>Where and amenities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="venue-type">Venue Type *</Label>
            <Select
              value={formData.venue_type}
              onValueChange={(value) => updateField('venue_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                {VENUE_TYPES.map((venue) => (
                  <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="meals"
                checked={formData.meals_provided || false}
                onCheckedChange={(checked) => updateField('meals_provided', checked)}
              />
              <Label htmlFor="meals">Meals Provided</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sleeping"
                checked={formData.sleeping_arrangements || false}
                onCheckedChange={(checked) => updateField('sleeping_arrangements', checked)}
              />
              <Label htmlFor="sleeping">Sleeping/Lounge Area</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="swag"
                checked={formData.swag_provided || false}
                onCheckedChange={(checked) => updateField('swag_provided', checked)}
              />
              <Label htmlFor="swag">Swag/T-shirts Provided</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="code-of-conduct"
                checked={formData.code_of_conduct || false}
                onCheckedChange={(checked) => updateField('code_of_conduct', checked)}
              />
              <Label htmlFor="code-of-conduct">Code of Conduct Required</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Awards & Judges */}
      <Card>
        <CardHeader>
          <CardTitle>Awards & Recognition</CardTitle>
          <CardDescription>Prizes and evaluation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prizes">Prizes & Awards</Label>
            <Textarea
              id="prizes"
              placeholder="Cash prizes, internships, incubation opportunities..."
              value={formData.prizes_awards || ''}
              onChange={(e) => updateField('prizes_awards', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="judges">Judges & Mentors</Label>
            <Textarea
              id="judges"
              placeholder="Industry experts, company reps, past winners..."
              value={formData.judges_mentors || ''}
              onChange={(e) => updateField('judges_mentors', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="presentation">Presentation Format</Label>
            <Select
              value={formData.presentation_format}
              onValueChange={(value) => updateField('presentation_format', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {PRESENTATION_FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="submission">Submission Platform</Label>
            <Input
              id="submission"
              placeholder="Devpost, GitHub, custom platform..."
              value={formData.submission_platform || ''}
              onChange={(e) => updateField('submission_platform', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sponsors */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsors & Partners</CardTitle>
          <CardDescription>Supporting organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="List sponsors, API partners, technology providers..."
            value={formData.sponsor_partners || ''}
            onChange={(e) => updateField('sponsor_partners', e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Special Requests</CardTitle>
          <CardDescription>Any additional details</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="API access, special hardware, streaming needs..."
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
            Share a brief overview participants will see
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="event-description"
            placeholder="Describe this hackathon—share the challenge, prizes, and excitement!"
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
