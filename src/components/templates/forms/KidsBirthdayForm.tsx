import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface KidsBirthdayFormData {
  birthday_child_name?: string;
  child_age?: number;
  expected_guest_count?: number;
  guest_age_range?: string;
  venue_type?: string;
  theme?: string;
  custom_theme?: string;
  activities?: string[];
  entertainment_type?: string;
  duration_hours?: number;
  food_service?: string;
  cake_details?: string;
  dietary_restrictions?: string;
  gift_policy?: string;
  parent_involvement?: string;
  safety_requirements?: string;
  party_favors?: boolean;
  party_favor_details?: string;
  photo_permission?: boolean;
  special_requests?: string;
}

interface KidsBirthdayFormProps {
  initialData?: KidsBirthdayFormData;
  onChange: (data: KidsBirthdayFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const THEMES = [
  'Superhero',
  'Princess/Fairy',
  'Pirate',
  'Dinosaur',
  'Unicorn',
  'Space/Rocket',
  'Under the Sea',
  'Jungle/Safari',
  'Sports',
  'Lego/Building',
  'Art/Craft',
  'Science/Mad Scientist',
  'Video Game',
  'Movie Character',
  'Custom',
];

const VENUE_TYPES = [
  'Home (Indoor)',
  'Home (Backyard)',
  'Indoor Play Center',
  'Park/Outdoor',
  'Community Center',
  'Restaurant (Kid-Friendly)',
  'Bounce House/Gym',
  'Pool/Swimming',
  'Bowling Alley',
  'Movie Theater',
  'Zoo/Aquarium',
  'Museum',
  'Arcade',
  'Skating Rink',
];

const ACTIVITIES = [
  'Bounce House',
  'Face Painting',
  'Balloon Artist',
  'Magic Show',
  'Petting Zoo',
  'Pony Rides',
  'Craft Station',
  'Photo Booth',
  'Treasure Hunt',
  'Piñata',
  'Musical Games',
  'Relay Races',
  'Karaoke',
  'Dance Party',
];

const ENTERTAINMENT_OPTIONS = [
  'Professional Entertainer (Clown/Magician)',
  'Character Performer',
  'DJ/Music',
  'Live Band',
  'Puppet Show',
  'Storyteller',
  'Science Demonstration',
  'Art Instructor',
  'Sports Coach',
  'No Professional Entertainment',
];

const FOOD_OPTIONS = [
  'Pizza Party',
  'Finger Foods/Snacks',
  'BBQ/Grilling',
  'Catered Kids Menu',
  'Build-Your-Own (Tacos/Sundaes)',
  'Lunch Boxes',
  'Parents Provide Food',
];

export default function KidsBirthdayForm({
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange,
}: KidsBirthdayFormProps) {
  const [formData, setFormData] = useState<KidsBirthdayFormData>(initialData);

  const updateField = (field: keyof KidsBirthdayFormData, value: any) => {
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
    return formData.birthday_child_name &&
           formData.child_age &&
           formData.expected_guest_count &&
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
          <h1 className="text-2xl font-bold text-gray-900">🎈 Kids Birthday Party</h1>
          <p className="text-gray-600">Let&apos;s plan a magical celebration!</p>
        </div>
      </div>

      {/* Birthday Child Info */}
      <Card>
        <CardHeader>
          <CardTitle>Birthday Child Information</CardTitle>
          <CardDescription>Tell us about the birthday star</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="child-name">Child&apos;s Name *</Label>
              <Input
                id="child-name"
                placeholder="Who's celebrating?"
                value={formData.birthday_child_name || ''}
                onChange={(e) => updateField('birthday_child_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="child-age">Age Turning *</Label>
              <Input
                id="child-age"
                type="number"
                placeholder="How old?"
                value={formData.child_age || ''}
                onChange={(e) => updateField('child_age', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="guest-count">Expected Guest Count *</Label>
            <Input
              id="guest-count"
              type="number"
              placeholder="How many kids (and adults)?"
              value={formData.expected_guest_count || ''}
              onChange={(e) => updateField('expected_guest_count', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div>
            <Label htmlFor="guest-age-range">Guest Age Range</Label>
            <Input
              id="guest-age-range"
              placeholder="e.g., Ages 4-8, mostly classmates"
              value={formData.guest_age_range || ''}
              onChange={(e) => updateField('guest_age_range', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Venue & Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Venue & Theme</CardTitle>
          <CardDescription>Where and what style of party?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="venue-type">Venue Type *</Label>
            <Select
              value={formData.venue_type}
              onValueChange={(value) => updateField('venue_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a venue" />
              </SelectTrigger>
              <SelectContent>
                {VENUE_TYPES.map((venue) => (
                  <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="theme">Party Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) => updateField('theme', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a theme (optional)" />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map((theme) => (
                  <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.theme === 'Custom' && (
            <div>
              <Label htmlFor="custom-theme">Custom Theme Details</Label>
              <Input
                id="custom-theme"
                placeholder="Describe your custom theme"
                value={formData.custom_theme || ''}
                onChange={(e) => updateField('custom_theme', e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="duration">Party Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="2-3 hours typical"
              value={formData.duration_hours || ''}
              onChange={(e) => updateField('duration_hours', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Activities & Entertainment</CardTitle>
          <CardDescription>What fun activities would you like?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div>
            <Label htmlFor="entertainment">Professional Entertainment</Label>
            <Select
              value={formData.entertainment_type}
              onValueChange={(value) => updateField('entertainment_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose entertainment (optional)" />
              </SelectTrigger>
              <SelectContent>
                {ENTERTAINMENT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Food & Cake */}
      <Card>
        <CardHeader>
          <CardTitle>Food & Cake</CardTitle>
          <CardDescription>Catering for the little guests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="food-service">Food Service Style</Label>
            <Select
              value={formData.food_service}
              onValueChange={(value) => updateField('food_service', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose food style" />
              </SelectTrigger>
              <SelectContent>
                {FOOD_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cake-details">Cake Details</Label>
            <Input
              id="cake-details"
              placeholder="Flavor, design, bakery name..."
              value={formData.cake_details || ''}
              onChange={(e) => updateField('cake_details', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dietary">Dietary Restrictions</Label>
            <Input
              id="dietary"
              placeholder="Allergies, vegetarian options, etc."
              value={formData.dietary_restrictions || ''}
              onChange={(e) => updateField('dietary_restrictions', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Party Details */}
      <Card>
        <CardHeader>
          <CardTitle>Party Details</CardTitle>
          <CardDescription>Gifts, favors, and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gift-policy">Gift Policy</Label>
            <Select
              value={formData.gift_policy}
              onValueChange={(value) => updateField('gift_policy', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Gift preferences" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presents-welcome">Presents Welcome</SelectItem>
                <SelectItem value="no-presents">No Presents Please</SelectItem>
                <SelectItem value="charity-donation">Charity Donation Instead</SelectItem>
                <SelectItem value="experiences-only">Experiences/Activities Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="party-favors"
              checked={formData.party_favors || false}
              onCheckedChange={(checked) => updateField('party_favors', checked)}
            />
            <Label htmlFor="party-favors">Provide Party Favors</Label>
          </div>

          {formData.party_favors && (
            <div>
              <Label htmlFor="favor-details">Party Favor Details</Label>
              <Input
                id="favor-details"
                placeholder="Goodie bags, small toys, candy..."
                value={formData.party_favor_details || ''}
                onChange={(e) => updateField('party_favor_details', e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="photo-permission"
              checked={formData.photo_permission || false}
              onCheckedChange={(checked) => updateField('photo_permission', checked)}
            />
            <Label htmlFor="photo-permission">Photo Permission (allow photos of children)</Label>
          </div>

          <div>
            <Label htmlFor="parent-involvement">Parent Involvement</Label>
            <Select
              value={formData.parent_involvement}
              onValueChange={(value) => updateField('parent_involvement', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Parent attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drop-off">Drop-off (kids only)</SelectItem>
                <SelectItem value="parents-stay">Parents Welcome to Stay</SelectItem>
                <SelectItem value="parents-required">Parents Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="safety">Safety Requirements</Label>
            <Textarea
              id="safety"
              placeholder="Any allergies, medical needs, or safety considerations..."
              value={formData.safety_requirements || ''}
              onChange={(e) => updateField('safety_requirements', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Special Requests</CardTitle>
          <CardDescription>Any additional details or special requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Special accommodations, surprise elements, or anything else we should know..."
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
            Share a brief overview your guests will see in invites and on the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="event-description"
            placeholder="Describe the birthday party—share what will make it special!"
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
