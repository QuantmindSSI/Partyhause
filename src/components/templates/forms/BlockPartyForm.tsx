import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface BlockPartyFormData {
  neighborhood_name?: string;
  street_location?: string;
  permit_obtained?: boolean;
  expected_guest_count?: number;
  party_type?: string;
  duration_hours?: number;
  activities?: string[];
  food_style?: string;
  potluck?: boolean;
  entertainment?: string;
  sound_system?: boolean;
  cleanup_plan?: string;
  rain_plan?: string;
  neighbor_coordination?: string;
  special_requests?: string;
}

interface BlockPartyFormProps {
  initialData?: BlockPartyFormData;
  onChange: (data: BlockPartyFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const PARTY_TYPES = [
  'Casual Neighborhood Gathering',
  'Street Festival',
  'Seasonal Celebration',
  'Welcome New Neighbors',
  'Holiday Party',
  'Summer BBQ',
  'Community Cleanup + Party',
  'Back to School',
  'National Night Out',
];

const ACTIVITIES = [
  'Bounce House',
  'Face Painting',
  'Live Music',
  'DJ/Dance',
  'Games (Cornhole, etc.)',
  'Potluck Tables',
  'Grilling/BBQ',
  'Kids Activities',
  'Chalk Art',
  'Parade/March',
  'Raffle/Prizes',
  'Community Booths',
];

const FOOD_STYLES = [
  'Potluck (Everyone Brings Something)',
  'BYO Food',
  'Grilling Station',
  'Food Trucks',
  'Catered',
  'Pizza Delivery',
  'Ice Cream Truck',
  'Potluck + Grilling',
];

const ENTERTAINMENT_OPTIONS = [
  'DJ with Sound System',
  'Live Band',
  'Playlist/Bluetooth Speaker',
  'No Music (Socializing Focus)',
  'Local Performers',
  'Karaoke',
];

export default function BlockPartyForm({
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange,
}: BlockPartyFormProps) {
  const [formData, setFormData] = useState<BlockPartyFormData>(initialData);

  const updateField = (field: keyof BlockPartyFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const toggleActivity = (activity: string) => {
    const current = formData.activities || [];
    const updated = current.includes(activity)
      ? current.filter(a => a !== activity)
      : [...current, activity];
    updateField('activities', updated);
  };

  const isValid = () => {
    return formData.neighborhood_name &&
           formData.street_location &&
           formData.party_type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏘️ Block Party</h1>
          <p className="text-gray-600">Let&apos;s bring the neighborhood together!</p>
        </div>
      </div>

      {/* Location & Permits */}
      <Card>
        <CardHeader>
          <CardTitle>Location & Permits</CardTitle>
          <CardDescription>Where and how you&apos;ll host</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="neighborhood">Neighborhood/Community Name *</Label>
            <Input
              id="neighborhood"
              placeholder="e.g., Oakwood Heights"
              value={formData.neighborhood_name || ''}
              onChange={(e) => updateField('neighborhood_name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="location">Street/Location *</Label>
            <Input
              id="location"
              placeholder="Which street or area will be closed?"
              value={formData.street_location || ''}
              onChange={(e) => updateField('street_location', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="permit"
              checked={formData.permit_obtained || false}
              onCheckedChange={(checked) => updateField('permit_obtained', checked)}
            />
            <Label htmlFor="permit">Street Permit Obtained/Applied</Label>
          </div>
        </CardContent>
      </Card>

      {/* Party Details */}
      <Card>
        <CardHeader>
          <CardTitle>Party Details</CardTitle>
          <CardDescription>Basic party information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="party-type">Party Type *</Label>
              <Select
                value={formData.party_type}
                onValueChange={(value) => updateField('party_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PARTY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (Hours)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="3-4 hours typical"
                value={formData.duration_hours || ''}
                onChange={(e) => updateField('duration_hours', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="guest-count">Expected Attendees</Label>
            <Input
              id="guest-count"
              type="number"
              placeholder="Number of neighbors expected"
              value={formData.expected_guest_count || ''}
              onChange={(e) => updateField('expected_guest_count', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Activities & Features</CardTitle>
          <CardDescription>What will be available?</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Select Activities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {ACTIVITIES.map((activity) => (
                <label key={activity} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.activities || []).includes(activity)}
                    onChange={() => toggleActivity(activity)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{activity}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food & Entertainment */}
      <Card>
        <CardHeader>
          <CardTitle>Food & Entertainment</CardTitle>
          <CardDescription>Feeding and entertaining the crowd</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="food-style">Food Style</Label>
              <Select
                value={formData.food_style}
                onValueChange={(value) => updateField('food_style', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select food arrangement" />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_STYLES.map((style) => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entertainment">Entertainment</Label>
              <Select
                value={formData.entertainment}
                onValueChange={(value) => updateField('entertainment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entertainment" />
                </SelectTrigger>
                <SelectContent>
                  {ENTERTAINMENT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="sound-system"
              checked={formData.sound_system || false}
              onCheckedChange={(checked) => updateField('sound_system', checked)}
            />
            <Label htmlFor="sound-system">Sound System/Music Equipment</Label>
          </div>
        </CardContent>
      </Card>

      {/* Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Planning & Logistics</CardTitle>
          <CardDescription>Important considerations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cleanup">Cleanup Plan</Label>
            <Textarea
              id="cleanup"
              placeholder="How will cleanup be organized?"
              value={formData.cleanup_plan || ''}
              onChange={(e) => updateField('cleanup_plan', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="rain-plan">Rain/Weather Plan</Label>
            <Input
              id="rain-plan"
              placeholder="Backup plan for bad weather"
              value={formData.rain_plan || ''}
              onChange={(e) => updateField('rain_plan', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="coordination">Neighbor Coordination</Label>
            <Textarea
              id="coordination"
              placeholder="How neighbors are helping, contact info, etc."
              value={formData.neighbor_coordination || ''}
              onChange={(e) => updateField('neighbor_coordination', e.target.value)}
              rows={3}
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
            placeholder="Special equipment, traffic control, or anything else..."
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
            Share a brief overview neighbors will see
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="event-description"
            placeholder="Describe this block party—share the community spirit!"
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
