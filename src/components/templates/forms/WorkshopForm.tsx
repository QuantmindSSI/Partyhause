import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface WorkshopFormData {
  workshop_title?: string;
  workshop_type?: string;
  subject_category?: string;
  instructor_name?: string;
  instructor_credentials?: string;
  skill_level?: string;
  max_participants?: number;
  duration_hours?: number;
  venue_type?: string;
  materials_included?: boolean;
  materials_list?: string;
  prerequisites?: string;
  learning_objectives?: string;
  hands_on_practice?: boolean;
  take_home_items?: string;
  certificate_offered?: boolean;
  follow_up_resources?: string;
  special_requests?: string;
}

interface WorkshopFormProps {
  initialData?: WorkshopFormData;
  onChange: (data: WorkshopFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const WORKSHOP_TYPES = [
  'Art & Creative',
  'Cooking & Culinary',
  'Technology & Coding',
  'Business & Professional',
  'Writing & Literature',
  'Music & Performance',
  'Health & Wellness',
  'Fitness & Exercise',
  'Crafts & DIY',
  'Photography & Video',
  'Personal Development',
  'Language Learning',
  'Finance & Investing',
  'Marketing & Social Media',
];

const SUBJECT_CATEGORIES = [
  'Arts & Crafts',
  'Business Skills',
  'Cooking & Baking',
  'Design',
  'Finance',
  'Health & Wellness',
  'Languages',
  'Marketing',
  'Music',
  'Personal Development',
  'Photography',
  'Technology',
  'Writing',
  'Other',
];

const SKILL_LEVELS = [
  'Beginner (No Experience)',
  'Beginner-Friendly',
  'Intermediate',
  'Advanced',
  'All Levels Welcome',
  'Mixed (Multiple Tracks)',
];

const VENUE_TYPES = [
  'Studio/Workshop Space',
  'Classroom',
  'Conference Room',
  'Kitchen/Culinary Space',
  'Community Center',
  'Online/Virtual',
  'Makerspace/Tech Lab',
  'Outdoor Space',
  'Gallery/Exhibition Space',
];

export default function WorkshopForm({
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange,
}: WorkshopFormProps) {
  const [formData, setFormData] = useState<WorkshopFormData>(initialData);

  const updateField = (field: keyof WorkshopFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const isValid = () => {
    return formData.workshop_title &&
           formData.workshop_type &&
           formData.instructor_name &&
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
          <h1 className="text-2xl font-bold text-gray-900">📚 Workshop/Class</h1>
          <p className="text-gray-600">Let&apos;s create a learning experience!</p>
        </div>
      </div>

      {/* Workshop Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Workshop Basics</CardTitle>
          <CardDescription>Core workshop information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="workshop-title">Workshop Title *</Label>
            <Input
              id="workshop-title"
              placeholder="e.g., Introduction to Watercolor Painting"
              value={formData.workshop_title || ''}
              onChange={(e) => updateField('workshop_title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workshop-type">Workshop Type *</Label>
              <Select
                value={formData.workshop_type}
                onValueChange={(value) => updateField('workshop_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {WORKSHOP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject Category</Label>
              <Select
                value={formData.subject_category}
                onValueChange={(value) => updateField('subject_category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (Hours)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="2-4 hours typical"
                value={formData.duration_hours || ''}
                onChange={(e) => updateField('duration_hours', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="max-participants">Max Participants</Label>
              <Input
                id="max-participants"
                type="number"
                placeholder="Class size limit"
                value={formData.max_participants || ''}
                onChange={(e) => updateField('max_participants', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructor */}
      <Card>
        <CardHeader>
          <CardTitle>Instructor/Facilitator</CardTitle>
          <CardDescription>Who will be teaching?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="instructor-name">Instructor Name *</Label>
            <Input
              id="instructor-name"
              placeholder="Lead instructor or facilitator"
              value={formData.instructor_name || ''}
              onChange={(e) => updateField('instructor_name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="credentials">Credentials/Background</Label>
            <Textarea
              id="credentials"
              placeholder="Experience, qualifications, bio..."
              value={formData.instructor_credentials || ''}
              onChange={(e) => updateField('instructor_credentials', e.target.value)}
              rows={2}
            />
          </div>

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
        </CardContent>
      </Card>

      {/* Venue & Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Venue & Setup</CardTitle>
          <CardDescription>Where and how the workshop runs</CardDescription>
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

          <div className="flex items-center space-x-2">
            <Switch
              id="hands-on"
              checked={formData.hands_on_practice || false}
              onCheckedChange={(checked) => updateField('hands_on_practice', checked)}
            />
            <Label htmlFor="hands-on">Hands-On Practice Included</Label>
          </div>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Materials & Prerequisites</CardTitle>
          <CardDescription>What participants need</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="materials-included"
              checked={formData.materials_included || false}
              onCheckedChange={(checked) => updateField('materials_included', checked)}
            />
            <Label htmlFor="materials-included">All Materials Provided</Label>
          </div>

          {formData.materials_included && (
            <div>
              <Label htmlFor="materials-list">Materials List</Label>
              <Textarea
                id="materials-list"
                placeholder="What materials/supplies will be provided?"
                value={formData.materials_list || ''}
                onChange={(e) => updateField('materials_list', e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div>
            <Label htmlFor="prerequisites">Prerequisites</Label>
            <Textarea
              id="prerequisites"
              placeholder="What should participants know or bring?"
              value={formData.prerequisites || ''}
              onChange={(e) => updateField('prerequisites', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="take-home">Take-Home Items</Label>
            <Input
              id="take-home"
              placeholder="What will participants leave with?"
              value={formData.take_home_items || ''}
              onChange={(e) => updateField('take_home_items', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Outcomes</CardTitle>
          <CardDescription>What will be achieved?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="objectives">Learning Objectives</Label>
            <Textarea
              id="objectives"
              placeholder="What skills or knowledge will participants gain?"
              value={formData.learning_objectives || ''}
              onChange={(e) => updateField('learning_objectives', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="certificate"
              checked={formData.certificate_offered || false}
              onCheckedChange={(checked) => updateField('certificate_offered', checked)}
            />
            <Label htmlFor="certificate">Completion Certificate Offered</Label>
          </div>

          <div>
            <Label htmlFor="follow-up">Follow-Up Resources</Label>
            <Textarea
              id="follow-up"
              placeholder="Continued learning resources, community access, etc."
              value={formData.follow_up_resources || ''}
              onChange={(e) => updateField('follow_up_resources', e.target.value)}
              rows={2}
            />
          </div>
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
            placeholder="Special equipment, accessibility needs, or anything else..."
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
            placeholder="Describe this workshop—share what participants will learn and experience!"
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
