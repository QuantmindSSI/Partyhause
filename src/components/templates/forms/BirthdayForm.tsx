import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface BirthdayFormData {
  birthday_person?: string;
  age?: number;
  milestone?: string;
  expected_guest_count?: number;
  venue_type?: string;
  theme?: string;
  custom_theme?: string;
  dress_code?: string;
  catering_style?: string;
  menu_notes?: string;
  bar_service?: string;
  cake_details?: string;
  dietary_restrictions?: string;
  entertainment_type?: string;
  music_preferences?: string;
  gift_preference?: string;
  has_photo_booth?: boolean;
  photo_booth_details?: string;
  has_toasts?: boolean;
  toast_schedule?: string;
  special_requests?: string;
}

interface BirthdayFormProps {
  initialData?: BirthdayFormData;
  onChange: (data: BirthdayFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const THEME_PRESETS = [
  '80s Retro',
  'Tropical/Luau',
  'Hollywood Glamour',
  'Garden Party',
  'Casino Night',
  'Masquerade Ball',
  'Beach Party',
  'Winter Wonderland',
  'Wine & Cheese',
  'Roaring 20s',
  'Custom',
];

const VENUE_TYPES = [
  'Home (Indoor)',
  'Home (Backyard)',
  'Restaurant/Bar',
  'Banquet Hall',
  'Rooftop Venue',
  'Beach/Outdoor',
  'Wine Bar/Brewery',
  'Club/Lounge',
  'Hotel Suite',
  'Yacht/Boat',
  'Other',
];

const CATERING_STYLES = [
  'Buffet',
  'Plated Dinner',
  'Cocktail Party/Appetizers',
  'BBQ/Grilling',
  'Potluck',
  'Food Trucks',
  'Catered by Restaurant',
  'Home Cooked',
];

const BAR_SERVICES = [
  'Full Bar',
  'Wine & Beer Only',
  'Signature Cocktails',
  'BYOB',
  'No Alcohol',
];

const ENTERTAINMENT_TYPES = [
  'DJ',
  'Live Band',
  'Playlist/Spotify',
  'Karaoke',
  'Games & Activities',
  'Dancing',
  'None/Socializing',
];

export default function BirthdayForm({ 
  initialData = {}, 
  onChange, 
  onBack, 
  onNext,
  eventDescription,
  onDescriptionChange
}: BirthdayFormProps) {
  const [formData, setFormData] = useState<BirthdayFormData>(initialData);

  const updateField = (field: keyof BirthdayFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const isValid = () => {
    return formData.birthday_person && 
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
          <h1 className="text-2xl font-bold text-gray-900">🎉 Birthday Party Details</h1>
          <p className="text-gray-600">Let's plan an amazing birthday celebration!</p>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Tell us about the birthday person and celebration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthday-person">Birthday Person *</Label>
              <Input
                id="birthday-person"
                placeholder="Who's celebrating?"
                value={formData.birthday_person || ''}
                onChange={(e) => updateField('birthday_person', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="age">Age Turning</Label>
              <Input
                id="age"
                type="number"
                placeholder="e.g., 30"
                value={formData.age || ''}
                onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="milestone">Special Milestone</Label>
            <Input
              id="milestone"
              placeholder="e.g., Big 3-0, Sweet 16, Golden Birthday"
              value={formData.milestone || ''}
              onChange={(e) => updateField('milestone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="guest-count">Expected Guest Count *</Label>
            <Input
              id="guest-count"
              type="number"
              placeholder="How many guests?"
              value={formData.expected_guest_count || ''}
              onChange={(e) => updateField('expected_guest_count', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Venue & Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Venue & Theme</CardTitle>
          <CardDescription>Set the scene for your celebration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="venue-type">Venue Type *</Label>
            <Select 
              value={formData.venue_type} 
              onValueChange={(value) => updateField('venue_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose venue type" />
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
                <SelectValue placeholder="Choose a theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_PRESETS.map((theme) => (
                  <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.theme === 'Custom' && (
            <div>
              <Label htmlFor="custom-theme">Custom Theme</Label>
              <Input
                id="custom-theme"
                placeholder="Describe your custom theme"
                value={formData.custom_theme || ''}
                onChange={(e) => updateField('custom_theme', e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="dress-code">Dress Code</Label>
            <Input
              id="dress-code"
              placeholder="e.g., Casual, Cocktail Attire, Themed Costume"
              value={formData.dress_code || ''}
              onChange={(e) => updateField('dress_code', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Food & Drinks */}
      <Card>
        <CardHeader>
          <CardTitle>Food & Drinks</CardTitle>
          <CardDescription>Plan the menu and refreshments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="catering-style">Catering Style</Label>
            <Select 
              value={formData.catering_style} 
              onValueChange={(value) => updateField('catering_style', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose catering style" />
              </SelectTrigger>
              <SelectContent>
                {CATERING_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="menu-notes">Menu Notes</Label>
            <Textarea
              id="menu-notes"
              placeholder="Any specific menu preferences or dishes you want to include..."
              value={formData.menu_notes || ''}
              onChange={(e) => updateField('menu_notes', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="bar-service">Bar Service</Label>
            <Select 
              value={formData.bar_service || 'Full Bar'} 
              onValueChange={(value) => updateField('bar_service', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAR_SERVICES.map((service) => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cake-details">Birthday Cake Details</Label>
            <Textarea
              id="cake-details"
              placeholder="Flavor, size, design, special requests..."
              value={formData.cake_details || ''}
              onChange={(e) => updateField('cake_details', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dietary-restrictions">Dietary Restrictions</Label>
            <Input
              id="dietary-restrictions"
              placeholder="Allergies, vegetarian, vegan, etc."
              value={formData.dietary_restrictions || ''}
              onChange={(e) => updateField('dietary_restrictions', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Entertainment */}
      <Card>
        <CardHeader>
          <CardTitle>Entertainment</CardTitle>
          <CardDescription>Keep your guests entertained</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="entertainment-type">Entertainment Type</Label>
            <Select 
              value={formData.entertainment_type} 
              onValueChange={(value) => updateField('entertainment_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose entertainment type" />
              </SelectTrigger>
              <SelectContent>
                {ENTERTAINMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="music-preferences">Music Preferences</Label>
            <Input
              id="music-preferences"
              placeholder="Genre, specific artists, era (e.g., 90s hits, Jazz, Pop)"
              value={formData.music_preferences || ''}
              onChange={(e) => updateField('music_preferences', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="photo-booth"
              checked={formData.has_photo_booth || false}
              onCheckedChange={(checked) => updateField('has_photo_booth', checked)}
            />
            <Label htmlFor="photo-booth">Photo Booth</Label>
          </div>

          {formData.has_photo_booth && (
            <div>
              <Label htmlFor="photo-booth-details">Photo Booth Details</Label>
              <Input
                id="photo-booth-details"
                placeholder="Props, backdrop, instant prints, etc."
                value={formData.photo_booth_details || ''}
                onChange={(e) => updateField('photo_booth_details', e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="toasts"
              checked={formData.has_toasts || false}
              onCheckedChange={(checked) => updateField('has_toasts', checked)}
            />
            <Label htmlFor="toasts">Birthday Toasts/Speeches</Label>
          </div>

          {formData.has_toasts && (
            <div>
              <Label htmlFor="toast-schedule">Toast Schedule</Label>
              <Input
                id="toast-schedule"
                placeholder="When during the party? Who will speak?"
                value={formData.toast_schedule || ''}
                onChange={(e) => updateField('toast_schedule', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gift Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Gift Preferences</CardTitle>
          <CardDescription>Let guests know how they can celebrate the birthday person</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gift-preference">Gift Preference</Label>
            <Select 
              value={formData.gift_preference || 'registry'} 
              onValueChange={(value) => updateField('gift_preference', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registry">Gift Registry</SelectItem>
                <SelectItem value="donations">Donations to Charity</SelectItem>
                <SelectItem value="experiences">Experience Gifts</SelectItem>
                <SelectItem value="surprise">Surprise Me</SelectItem>
                <SelectItem value="none">No Gifts Please</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Special Requests</CardTitle>
          <CardDescription>Any other details or special requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Accessibility needs, parking info, surprise elements, or anything else we should know..."
            value={formData.special_requests || ''}
            onChange={(e) => updateField('special_requests', e.target.value)}
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
            placeholder="Describe your birthday event—what makes it special?"
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